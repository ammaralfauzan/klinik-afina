-- ============================================================
-- JALANKAN DI: Supabase Dashboard → SQL Editor → New Query
-- Buka file ini, Select All (Cmd+A), Copy, paste ke SQL Editor, Run.
-- Aman dijalankan ulang (idempotent).
-- SYARAT: deploy Vercel terbaru sudah live dulu.
-- ============================================================

-- ============================================================
-- LANGKAH 10: edit_pendaftaran — anon edit pendaftaran miliknya
-- ============================================================
CREATE OR REPLACE FUNCTION edit_pendaftaran(
  p_nomor_nik        text,
  p_nomor_antrian    int,
  p_keluhan          text,
  p_no_hp            text,
  p_jenis_pembayaran text,
  p_nomor_bpjs       text,
  p_nama_asuransi    text,
  p_day_start        timestamptz,
  p_day_end          timestamptz
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target  pasien;
BEGIN
  SELECT * INTO target
    FROM pasien
   WHERE nomor_antrian = p_nomor_antrian
     AND nomor_nik     = p_nomor_nik
     AND created_at >= p_day_start AND created_at <= p_day_end
   LIMIT 1;

  IF target IS NULL THEN
    RETURN jsonb_build_object('error', 'Data pendaftaran tidak ditemukan.');
  END IF;

  IF target.status <> 'Menunggu' THEN
    RETURN jsonb_build_object('error', 'Pendaftaran sudah diproses, tidak bisa diubah.');
  END IF;

  UPDATE pasien SET
    keluhan          = p_keluhan,
    no_hp            = p_no_hp,
    jenis_pembayaran = p_jenis_pembayaran,
    nomor_bpjs       = p_nomor_bpjs,
    nama_asuransi    = p_nama_asuransi
  WHERE nomor_antrian = p_nomor_antrian
    AND nomor_nik     = p_nomor_nik
    AND created_at >= p_day_start AND created_at <= p_day_end
  RETURNING * INTO target;

  RETURN to_jsonb(target);
END;
$$;

GRANT EXECUTE ON FUNCTION edit_pendaftaran(
  text, int, text, text, text, text, text, timestamptz, timestamptz
) TO anon, authenticated;

-- ============================================================
-- LANGKAH 11a: daftar_pasien — SECURITY DEFINER + dedup NIK atomik
-- ============================================================
CREATE OR REPLACE FUNCTION daftar_pasien(data jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  no_baru      int;
  day_start    timestamptz := (data->>'day_start')::timestamptz;
  day_end      timestamptz := (data->>'day_end')::timestamptz;
  nik_in       text        := COALESCE(data->>'nomor_nik', '');
  inserted     pasien;
  dup          pasien;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('antrian:' || day_start::text));

  IF nik_in <> '' THEN
    SELECT * INTO dup
      FROM pasien
     WHERE nomor_nik = nik_in
       AND created_at >= day_start AND created_at <= day_end
     LIMIT 1;
    IF dup IS NOT NULL THEN
      RETURN jsonb_build_object(
        'error', 'NIK sudah terdaftar hari ini',
        'nomor_antrian', dup.nomor_antrian,
        'status', dup.status
      );
    END IF;
  END IF;

  SELECT COALESCE(MAX(nomor_antrian), 0) + 1
    INTO no_baru
    FROM pasien
   WHERE created_at >= day_start AND created_at <= day_end;

  INSERT INTO pasien (
    nomor_antrian, nama, keluhan, tanggal_lahir, jenis_kelamin,
    alamat, no_hp, nomor_nik, jenis_pembayaran, nomor_bpjs, nama_asuransi,
    nomor_rm, status, created_at
  ) VALUES (
    no_baru,
    data->>'nama',
    data->>'keluhan',
    NULLIF(data->>'tanggal_lahir', '')::date,
    COALESCE(data->>'jenis_kelamin', 'Laki-laki'),
    COALESCE(data->>'alamat', ''),
    COALESCE(data->>'no_hp', ''),
    nik_in,
    COALESCE(data->>'jenis_pembayaran', 'Umum'),
    COALESCE(data->>'nomor_bpjs', ''),
    COALESCE(data->>'nama_asuransi', ''),
    COALESCE(data->>'nomor_rm', ''),
    COALESCE(data->>'status', 'Menunggu'),
    COALESCE(NULLIF(data->>'created_at', '')::timestamptz, now())
  )
  RETURNING * INTO inserted;

  RETURN to_jsonb(inserted);
END;
$$;

GRANT EXECUTE ON FUNCTION daftar_pasien(jsonb) TO anon, authenticated;

-- ============================================================
-- LANGKAH 11b: cek_pendaftaran_nik — anon ambil pendaftarannya sendiri
-- (gate NIK + tanggal lahir)
-- ============================================================
CREATE OR REPLACE FUNCTION cek_pendaftaran_nik(
  p_nomor_nik     text,
  p_tanggal_lahir date,
  p_day_start     timestamptz,
  p_day_end       timestamptz
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  row pasien;
BEGIN
  SELECT * INTO row
    FROM pasien
   WHERE nomor_nik = p_nomor_nik
     AND tanggal_lahir IS NOT DISTINCT FROM p_tanggal_lahir
     AND created_at >= p_day_start AND created_at <= p_day_end
   LIMIT 1;

  IF row IS NULL THEN
    RETURN NULL;
  END IF;

  RETURN jsonb_build_object(
    'nomor_antrian',    row.nomor_antrian,
    'status',           row.status,
    'nama',             row.nama,
    'keluhan',          row.keluhan,
    'no_hp',            row.no_hp,
    'jenis_pembayaran', row.jenis_pembayaran,
    'nomor_bpjs',       row.nomor_bpjs,
    'nama_asuransi',    row.nama_asuransi
  );
END;
$$;

GRANT EXECUTE ON FUNCTION cek_pendaftaran_nik(
  text, date, timestamptz, timestamptz
) TO anon, authenticated;

-- ============================================================
-- LANGKAH 11c: Aktifkan RLS + kunci akses langsung anon
-- ============================================================
ALTER TABLE pasien        ENABLE ROW LEVEL SECURITY;
ALTER TABLE rekam_medis   ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated_all_pasien" ON pasien;
CREATE POLICY "authenticated_all_pasien"
  ON pasien FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_all_rekam_medis" ON rekam_medis;
CREATE POLICY "authenticated_all_rekam_medis"
  ON rekam_medis FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_select_today_pasien" ON pasien;
CREATE POLICY "anon_select_today_pasien"
  ON pasien FOR SELECT TO anon
  USING (created_at >= date_trunc('day', now() AT TIME ZONE 'Asia/Jakarta') AT TIME ZONE 'Asia/Jakarta');

REVOKE ALL ON pasien FROM anon;
GRANT SELECT (nomor_antrian, nama, status, keluhan, created_at, jenis_kelamin) ON pasien TO anon;

REVOKE ALL ON rekam_medis FROM anon;

-- Verifikasi (opsional): harus muncul "permission denied"
-- SET ROLE anon; SELECT nomor_nik FROM pasien LIMIT 1; RESET ROLE;
