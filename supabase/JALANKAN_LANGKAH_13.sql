-- ============================================================
-- JALANKAN DI: Supabase Dashboard -> SQL Editor -> New Query
-- LANGKAH 13a: Rentang hari dihitung SERVER-SIDE (anti bypass dedup/kuota)
-- Penyerang tak bisa lagi mengakali day_start/day_end dari klien.
-- Aman dijalankan ulang (idempotent).
-- ============================================================

-- 13a-1. daftar_pasien: untuk anon, rentang "hari ini" WIB dihitung di server.
CREATE OR REPLACE FUNCTION daftar_pasien(data jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  no_baru    int;
  day_start  timestamptz := (data->>'day_start')::timestamptz;
  day_end    timestamptz := (data->>'day_end')::timestamptz;
  srv_start  timestamptz := date_trunc('day', now() AT TIME ZONE 'Asia/Jakarta') AT TIME ZONE 'Asia/Jakarta';
  srv_end    timestamptz := date_trunc('day', now() AT TIME ZONE 'Asia/Jakarta') AT TIME ZONE 'Asia/Jakarta' + interval '1 day' - interval '1 microsecond';
  nik_in     text := coalesce(data->>'nomor_nik','');
  v_role     text := coalesce(current_setting('request.jwt.claims', true)::jsonb ->> 'role', 'anon');
  v_status   text;
  v_created  timestamptz;
  v_nomor_rm text;
  v_count    int;
  inserted   pasien;
  dup        pasien;
BEGIN
  IF v_role <> 'authenticated' THEN
    -- ====== Jalur PUBLIK (anon): rentang dipaksa server-side ======
    day_start := srv_start;
    day_end   := srv_end;
    IF nik_in !~ '^[0-9]{16}$' THEN
      RETURN jsonb_build_object('error', 'NIK harus 16 digit angka.');
    END IF;
    IF length(coalesce(data->>'nama','')) > 100
       OR length(coalesce(data->>'keluhan','')) > 500
       OR length(coalesce(data->>'alamat','')) > 300
       OR length(coalesce(data->>'no_hp','')) > 20 THEN
      RETURN jsonb_build_object('error', 'Input terlalu panjang.');
    END IF;
    SELECT count(*) INTO v_count FROM pasien
      WHERE created_at >= day_start AND created_at <= day_end;
    IF v_count >= 300 THEN
      RETURN jsonb_build_object('error', 'Kuota pendaftaran online hari ini penuh. Hubungi klinik.');
    END IF;
    v_status   := 'Menunggu';
    v_created  := now();
    v_nomor_rm := '';
  ELSE
    -- ====== Jalur ADMIN (login): percayai input ======
    v_status   := coalesce(data->>'status', 'Menunggu');
    v_created  := coalesce(nullif(data->>'created_at','')::timestamptz, now());
    v_nomor_rm := coalesce(data->>'nomor_rm','');
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext('antrian:' || day_start::text));

  IF nik_in <> '' THEN
    SELECT * INTO dup FROM pasien
      WHERE nomor_nik = nik_in AND created_at >= day_start AND created_at <= day_end
      LIMIT 1;
    IF dup IS NOT NULL THEN
      RETURN jsonb_build_object('error','NIK sudah terdaftar hari ini',
                                'nomor_antrian',dup.nomor_antrian,'status',dup.status);
    END IF;
  END IF;

  SELECT coalesce(max(nomor_antrian),0)+1 INTO no_baru FROM pasien
    WHERE created_at >= day_start AND created_at <= day_end;

  INSERT INTO pasien (
    nomor_antrian, nama, keluhan, tanggal_lahir, jenis_kelamin,
    alamat, no_hp, nomor_nik, jenis_pembayaran, nomor_bpjs, nama_asuransi,
    nomor_rm, status, created_at
  ) VALUES (
    no_baru, data->>'nama', data->>'keluhan', nullif(data->>'tanggal_lahir','')::date,
    coalesce(data->>'jenis_kelamin','Laki-laki'), coalesce(data->>'alamat',''),
    coalesce(data->>'no_hp',''), nik_in, coalesce(data->>'jenis_pembayaran','Umum'),
    coalesce(data->>'nomor_bpjs',''), coalesce(data->>'nama_asuransi',''),
    v_nomor_rm, v_status, v_created
  )
  RETURNING * INTO inserted;

  RETURN to_jsonb(inserted);
END;
$$;
GRANT EXECUTE ON FUNCTION daftar_pasien(jsonb) TO anon, authenticated;

-- 13a-2. cek_pendaftaran_nik: rentang "hari ini" WIB dihitung server-side.
CREATE OR REPLACE FUNCTION cek_pendaftaran_nik(
  p_nomor_nik     text,
  p_tanggal_lahir date,
  p_day_start     timestamptz DEFAULT NULL,
  p_day_end       timestamptz DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  row pasien;
  srv_start timestamptz := date_trunc('day', now() AT TIME ZONE 'Asia/Jakarta') AT TIME ZONE 'Asia/Jakarta';
  srv_end   timestamptz := date_trunc('day', now() AT TIME ZONE 'Asia/Jakarta') AT TIME ZONE 'Asia/Jakarta' + interval '1 day' - interval '1 microsecond';
BEGIN
  IF p_nomor_nik !~ '^[0-9]{16}$' OR p_tanggal_lahir IS NULL THEN
    RETURN NULL;
  END IF;
  SELECT * INTO row FROM pasien
   WHERE nomor_nik = p_nomor_nik
     AND tanggal_lahir IS NOT DISTINCT FROM p_tanggal_lahir
     AND created_at >= srv_start AND created_at <= srv_end
   LIMIT 1;
  IF row IS NULL THEN RETURN NULL; END IF;
  RETURN jsonb_build_object(
    'nomor_antrian', row.nomor_antrian, 'status', row.status, 'nama', row.nama,
    'keluhan', row.keluhan, 'no_hp', row.no_hp, 'jenis_pembayaran', row.jenis_pembayaran,
    'nomor_bpjs', row.nomor_bpjs, 'nama_asuransi', row.nama_asuransi
  );
END;
$$;
GRANT EXECUTE ON FUNCTION cek_pendaftaran_nik(text, date, timestamptz, timestamptz) TO anon, authenticated;

-- 13a-3. edit_pendaftaran: rentang "hari ini" WIB dihitung server-side.
CREATE OR REPLACE FUNCTION edit_pendaftaran(
  p_nomor_nik        text,
  p_nomor_antrian    int,
  p_keluhan          text,
  p_no_hp            text,
  p_jenis_pembayaran text,
  p_nomor_bpjs       text,
  p_nama_asuransi    text,
  p_day_start        timestamptz DEFAULT NULL,
  p_day_end          timestamptz DEFAULT NULL,
  p_tanggal_lahir    date DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target pasien;
  srv_start timestamptz := date_trunc('day', now() AT TIME ZONE 'Asia/Jakarta') AT TIME ZONE 'Asia/Jakarta';
  srv_end   timestamptz := date_trunc('day', now() AT TIME ZONE 'Asia/Jakarta') AT TIME ZONE 'Asia/Jakarta' + interval '1 day' - interval '1 microsecond';
BEGIN
  IF length(coalesce(p_keluhan,'')) > 500 OR length(coalesce(p_no_hp,'')) > 20
     OR length(coalesce(p_nomor_bpjs,'')) > 25 OR length(coalesce(p_nama_asuransi,'')) > 120 THEN
    RETURN jsonb_build_object('error', 'Input terlalu panjang.');
  END IF;
  SELECT * INTO target FROM pasien
   WHERE nomor_antrian = p_nomor_antrian
     AND nomor_nik     = p_nomor_nik
     AND tanggal_lahir IS NOT DISTINCT FROM p_tanggal_lahir
     AND created_at >= srv_start AND created_at <= srv_end
   LIMIT 1;
  IF target IS NULL THEN
    RETURN jsonb_build_object('error', 'Data pendaftaran tidak ditemukan.');
  END IF;
  IF target.status <> 'Menunggu' THEN
    RETURN jsonb_build_object('error', 'Pendaftaran sudah diproses, tidak bisa diubah.');
  END IF;
  UPDATE pasien SET
    keluhan = p_keluhan, no_hp = p_no_hp, jenis_pembayaran = p_jenis_pembayaran,
    nomor_bpjs = p_nomor_bpjs, nama_asuransi = p_nama_asuransi
  WHERE nomor_antrian = p_nomor_antrian AND nomor_nik = p_nomor_nik
    AND created_at >= srv_start AND created_at <= srv_end;
  RETURN jsonb_build_object('ok', true);
END;
$$;
GRANT EXECUTE ON FUNCTION edit_pendaftaran(
  text, int, text, text, text, text, text, timestamptz, timestamptz, date
) TO anon, authenticated;

-- ============================================================
-- LANGKAH 13b: ALLOWLIST STAF (tutup eskalasi signup publik)
-- Walau seseorang berhasil bikin akun authenticated, ia TETAP tak
-- bisa menyentuh data kecuali email-nya ada di tabel staff.
-- ============================================================

-- Tabel allowlist (RLS aktif, tanpa policy => hanya service_role/SQL editor
-- yang bisa baca/tulis; fungsi is_staff() membacanya via SECURITY DEFINER).
CREATE TABLE IF NOT EXISTS staff (
  email text PRIMARY KEY
);
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON staff FROM anon, authenticated;

-- >>> Isi email staf yang BOLEH akses. Tambah baris bila ada staf lain. <<<
INSERT INTO staff (email) VALUES ('admin@klinik-afina.com')
ON CONFLICT (email) DO NOTHING;

-- Cek keanggotaan staf dari email JWT pemanggil (bypass RLS staff).
CREATE OR REPLACE FUNCTION is_staff()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM staff
    WHERE email = (current_setting('request.jwt.claims', true)::jsonb ->> 'email')
  );
$$;
GRANT EXECUTE ON FUNCTION is_staff() TO authenticated;

-- Ketatkan policy: dari "semua authenticated" -> "hanya staf allowlist".
DROP POLICY IF EXISTS "authenticated_all_pasien" ON pasien;
DROP POLICY IF EXISTS "staff_all_pasien" ON pasien;
CREATE POLICY "staff_all_pasien" ON pasien FOR ALL TO authenticated
  USING ( is_staff() ) WITH CHECK ( is_staff() );

DROP POLICY IF EXISTS "authenticated_all_rekam_medis" ON rekam_medis;
DROP POLICY IF EXISTS "staff_all_rekam_medis" ON rekam_medis;
CREATE POLICY "staff_all_rekam_medis" ON rekam_medis FOR ALL TO authenticated
  USING ( is_staff() ) WITH CHECK ( is_staff() );

-- ============================================================
-- VERIFIKASI (jalankan setelah di atas):
--   SELECT is_staff();   -- saat login sebagai admin harus TRUE
-- Jika setelah ini Anda TERKUNCI (data admin kosong), email allowlist
-- tidak cocok dengan email login. ROLLBACK sementara:
--   DROP POLICY IF EXISTS "staff_all_pasien" ON pasien;
--   CREATE POLICY "authenticated_all_pasien" ON pasien FOR ALL TO authenticated USING (true) WITH CHECK (true);
--   DROP POLICY IF EXISTS "staff_all_rekam_medis" ON rekam_medis;
--   CREATE POLICY "authenticated_all_rekam_medis" ON rekam_medis FOR ALL TO authenticated USING (true) WITH CHECK (true);
-- lalu beri tahu saya email login Anda yang benar.
-- ============================================================
