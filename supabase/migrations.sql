-- ============================================================
-- JALANKAN DI: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- LANGKAH 1: Tambah kolom yang dibutuhkan (skip jika sudah ada)
ALTER TABLE pasien ADD COLUMN IF NOT EXISTS tanggal_lahir DATE;
ALTER TABLE pasien ADD COLUMN IF NOT EXISTS jenis_kelamin TEXT DEFAULT 'Laki-laki';
ALTER TABLE pasien ADD COLUMN IF NOT EXISTS alamat TEXT DEFAULT '';
ALTER TABLE pasien ADD COLUMN IF NOT EXISTS no_hp TEXT DEFAULT '';

-- LANGKAH 2: Disable RLS agar data bisa masuk (untuk demo/development)
ALTER TABLE pasien DISABLE ROW LEVEL SECURITY;

-- Alternatif: Tambah policy yang allow semua operasi (untuk production)
-- ALTER TABLE pasien ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "allow_all" ON pasien FOR ALL USING (true) WITH CHECK (true);

-- LANGKAH 3: Jika ada tabel pengaturan
-- ALTER TABLE pengaturan DISABLE ROW LEVEL SECURITY;

-- Verifikasi kolom sudah ada:
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'pasien';

-- ============================================================
-- LANGKAH 4: Kolom kasir (biaya & status pembayaran)
-- ============================================================
ALTER TABLE pasien ADD COLUMN IF NOT EXISTS biaya INTEGER DEFAULT 0;
ALTER TABLE pasien ADD COLUMN IF NOT EXISTS status_bayar TEXT DEFAULT 'Belum Bayar';

-- ============================================================
-- LANGKAH 5: Tabel rekam medis
-- ============================================================
CREATE TABLE IF NOT EXISTS rekam_medis (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nomor_antrian INTEGER,
  visit_date DATE NOT NULL,
  pasien_nama TEXT NOT NULL,
  pasien_keluhan TEXT DEFAULT '',
  diagnosa TEXT DEFAULT '',
  tindakan TEXT DEFAULT '',
  obat TEXT DEFAULT '',
  catatan TEXT DEFAULT '',
  dokter TEXT DEFAULT 'dr. Umum',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE rekam_medis DISABLE ROW LEVEL SECURITY;

-- Verifikasi:
-- SELECT * FROM rekam_medis LIMIT 5;

-- ============================================================
-- LANGKAH 6: Nomor RM permanen + kolom BPJS / Asuransi
-- ============================================================
ALTER TABLE pasien ADD COLUMN IF NOT EXISTS nomor_rm TEXT DEFAULT '';
ALTER TABLE pasien ADD COLUMN IF NOT EXISTS jenis_pembayaran TEXT DEFAULT 'Umum';
ALTER TABLE pasien ADD COLUMN IF NOT EXISTS nomor_bpjs TEXT DEFAULT '';
ALTER TABLE pasien ADD COLUMN IF NOT EXISTS nama_asuransi TEXT DEFAULT '';

-- ============================================================
-- LANGKAH 7a: Kolom Vital Signs di rekam_medis
-- ============================================================
ALTER TABLE rekam_medis ADD COLUMN IF NOT EXISTS td TEXT DEFAULT '';
ALTER TABLE rekam_medis ADD COLUMN IF NOT EXISTS suhu TEXT DEFAULT '';
ALTER TABLE rekam_medis ADD COLUMN IF NOT EXISTS berat TEXT DEFAULT '';
ALTER TABLE rekam_medis ADD COLUMN IF NOT EXISTS tinggi TEXT DEFAULT '';
ALTER TABLE rekam_medis ADD COLUMN IF NOT EXISTS saturasi TEXT DEFAULT '';

-- ============================================================
-- LANGKAH 7b: Aktifkan RLS (Row Level Security) — PRODUCTION
-- Jalankan ini setelah membuat user di Supabase Auth Dashboard
-- ============================================================

-- Aktifkan RLS pada tabel pasien
ALTER TABLE pasien ENABLE ROW LEVEL SECURITY;

-- Hapus policy lama jika ada, lalu buat ulang
DROP POLICY IF EXISTS "authenticated_all_pasien" ON pasien;
CREATE POLICY "authenticated_all_pasien"
  ON pasien FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Aktifkan RLS pada tabel rekam_medis
ALTER TABLE rekam_medis ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated_all_rekam_medis" ON rekam_medis;
CREATE POLICY "authenticated_all_rekam_medis"
  ON rekam_medis FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Aktifkan RLS pada tabel pengaturan (jika ada)
-- ALTER TABLE pengaturan ENABLE ROW LEVEL SECURITY;
-- DROP POLICY IF EXISTS "authenticated_all_pengaturan" ON pengaturan;
-- CREATE POLICY "authenticated_all_pengaturan"
--   ON pengaturan FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- LANGKAH 8: Registrasi pasien ATOMIK (anti race-condition)
-- Mencegah dua pasien dapat nomor antrian yang sama saat
-- mendaftar bersamaan (terutama via pendaftaran online).
-- Memakai advisory lock agar perhitungan nomor + insert
-- berjalan serial per-hari.
-- ============================================================
CREATE OR REPLACE FUNCTION daftar_pasien(data jsonb)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  no_baru      int;
  day_start    timestamptz := (data->>'day_start')::timestamptz;
  day_end      timestamptz := (data->>'day_end')::timestamptz;
  inserted     pasien;
BEGIN
  -- Serialkan registrasi untuk hari yang sama
  PERFORM pg_advisory_xact_lock(hashtext('antrian:' || day_start::text));

  SELECT COALESCE(MAX(nomor_antrian), 0) + 1
    INTO no_baru
    FROM pasien
   WHERE created_at >= day_start AND created_at <= day_end;

  INSERT INTO pasien (
    nomor_antrian, nama, keluhan, tanggal_lahir, jenis_kelamin,
    alamat, no_hp, jenis_pembayaran, nomor_bpjs, nama_asuransi,
    nomor_rm, status, created_at
  ) VALUES (
    no_baru,
    data->>'nama',
    data->>'keluhan',
    NULLIF(data->>'tanggal_lahir', '')::date,
    COALESCE(data->>'jenis_kelamin', 'Laki-laki'),
    COALESCE(data->>'alamat', ''),
    COALESCE(data->>'no_hp', ''),
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

-- Beri akses ke role yang dipakai aplikasi
GRANT EXECUTE ON FUNCTION daftar_pasien(jsonb) TO anon, authenticated;

-- ============================================================
-- LANGKAH 9: Kolom NIK + index dedup + perbarui RPC
-- Jalankan setelah Langkah 8.
-- ============================================================
ALTER TABLE pasien ADD COLUMN IF NOT EXISTS nomor_nik TEXT DEFAULT '';

-- Index supaya cek dedup NIK per-hari cepat
CREATE INDEX IF NOT EXISTS idx_pasien_nomor_nik ON pasien(nomor_nik);

-- Perbarui RPC agar menyimpan nomor_nik
CREATE OR REPLACE FUNCTION daftar_pasien(data jsonb)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  no_baru      int;
  day_start    timestamptz := (data->>'day_start')::timestamptz;
  day_end      timestamptz := (data->>'day_end')::timestamptz;
  inserted     pasien;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('antrian:' || day_start::text));

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
    COALESCE(data->>'nomor_nik', ''),
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
-- LANGKAH 10: edit_pendaftaran — anon edit pendaftaran miliknya
-- (versi resmi, version-controlled. Sebelumnya hanya ada di DB.)
-- SECURITY DEFINER + gate: NIK harus cocok dengan baris nomor_antrian
-- hari ini, dan status masih "Menunggu".
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
  -- Cari baris milik NIK ini, di nomor antrian ini, hari ini
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
-- LANGKAH 11: AKTIFKAN RLS DENGAN BENAR (anti kebocoran data pasien)
-- Setelah langkah ini, anon (publik) TIDAK bisa lagi membaca NIK,
-- alamat, no HP, atau BPJS pasien lain. Pendaftaran online tetap
-- jalan lewat RPC SECURITY DEFINER di bawah.
-- ============================================================

-- 11a. daftar_pasien: jadikan SECURITY DEFINER + dedup NIK atomik
--      (cek duplikat di dalam lock agar 2 request NIK sama tak lolos).
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

  -- Dedup: 1 NIK per hari (hanya jika NIK diisi)
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

-- 11b. cek_pendaftaran_nik: anon ambil pendaftarannya sendiri (untuk
--      pre-isi form mode edit). Di-gate NIK + tanggal lahir agar orang
--      tidak bisa menebak NIK acak untuk mengintip data orang lain.
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

-- 11c. Aktifkan RLS + kunci akses langsung anon ke tabel.
ALTER TABLE pasien        ENABLE ROW LEVEL SECURITY;
ALTER TABLE rekam_medis   ENABLE ROW LEVEL SECURITY;

-- Admin (login) = akses penuh
DROP POLICY IF EXISTS "authenticated_all_pasien" ON pasien;
CREATE POLICY "authenticated_all_pasien"
  ON pasien FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_all_rekam_medis" ON rekam_medis;
CREATE POLICY "authenticated_all_rekam_medis"
  ON rekam_medis FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Publik (anon): hanya boleh BACA antrian HARI INI (untuk TV display &
-- penghitung antrian online). Realtime ikut pakai policy ini.
DROP POLICY IF EXISTS "anon_select_today_pasien" ON pasien;
CREATE POLICY "anon_select_today_pasien"
  ON pasien FOR SELECT TO anon
  USING (created_at >= date_trunc('day', now() AT TIME ZONE 'Asia/Jakarta') AT TIME ZONE 'Asia/Jakarta');

-- Batasi KOLOM yang bisa dibaca anon — sembunyikan NIK, alamat, no HP, BPJS.
REVOKE ALL ON pasien FROM anon;
GRANT SELECT (nomor_antrian, nama, status, keluhan, created_at, jenis_kelamin) ON pasien TO anon;
-- anon TIDAK punya INSERT/UPDATE/DELETE langsung — semua lewat RPC di atas.

-- rekam_medis: anon tidak punya akses sama sekali (tak ada policy anon).
REVOKE ALL ON rekam_medis FROM anon;

-- Verifikasi (opsional):
-- SET ROLE anon; SELECT nomor_nik FROM pasien LIMIT 1;  -- harus ERROR/permission denied
-- RESET ROLE;

-- ============================================================
-- LANGKAH 12: HARDENING RPC ANON (anti penyalahgunaan & kebocoran PII)
-- Menutup 2 celah:
--  (1) edit_pendaftaran mengembalikan seluruh baris (PII) & hanya di-gate
--      NIK+nomor_antrian → bisa dipakai mencuri data/ubah data orang lain.
--  (2) daftar_pasien (anon) bisa memaksa status/created_at/nomor_rm,
--      tanpa validasi panjang & tanpa batas volume → spam/DoS/poisoning.
-- ============================================================

-- 12a. edit_pendaftaran: tambah gate tanggal lahir + JANGAN balikan PII.
DROP FUNCTION IF EXISTS edit_pendaftaran(text, int, text, text, text, text, text, timestamptz, timestamptz);

CREATE OR REPLACE FUNCTION edit_pendaftaran(
  p_nomor_nik        text,
  p_nomor_antrian    int,
  p_keluhan          text,
  p_no_hp            text,
  p_jenis_pembayaran text,
  p_nomor_bpjs       text,
  p_nama_asuransi    text,
  p_day_start        timestamptz,
  p_day_end          timestamptz,
  p_tanggal_lahir    date DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target pasien;
BEGIN
  IF length(coalesce(p_keluhan,'')) > 500
     OR length(coalesce(p_no_hp,'')) > 20
     OR length(coalesce(p_nomor_bpjs,'')) > 25
     OR length(coalesce(p_nama_asuransi,'')) > 120 THEN
    RETURN jsonb_build_object('error', 'Input terlalu panjang.');
  END IF;

  -- Gate: NIK + nomor antrian + TANGGAL LAHIR harus cocok (anti enumerasi).
  SELECT * INTO target
    FROM pasien
   WHERE nomor_antrian = p_nomor_antrian
     AND nomor_nik     = p_nomor_nik
     AND tanggal_lahir IS NOT DISTINCT FROM p_tanggal_lahir
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
    AND created_at >= p_day_start AND created_at <= p_day_end;

  -- JANGAN kembalikan baris (mengandung PII). Cukup tanda sukses.
  RETURN jsonb_build_object('ok', true);
END;
$$;

GRANT EXECUTE ON FUNCTION edit_pendaftaran(
  text, int, text, text, text, text, text, timestamptz, timestamptz, date
) TO anon, authenticated;

-- 12b. daftar_pasien: sadar-peran. Anon dipaksa nilai aman + validasi + kuota.
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
  nik_in     text := coalesce(data->>'nomor_nik','');
  v_role     text := coalesce(current_setting('request.jwt.claims', true)::jsonb ->> 'role', 'anon');
  v_status   text;
  v_created  timestamptz;
  v_nomor_rm text;
  v_count    int;
  inserted   pasien;
  dup        pasien;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('antrian:' || day_start::text));

  IF v_role <> 'authenticated' THEN
    -- ====== Jalur PUBLIK (anon): ketat ======
    IF nik_in !~ '^[0-9]{16}$' THEN
      RETURN jsonb_build_object('error', 'NIK harus 16 digit angka.');
    END IF;
    IF length(coalesce(data->>'nama','')) > 100
       OR length(coalesce(data->>'keluhan','')) > 500
       OR length(coalesce(data->>'alamat','')) > 300
       OR length(coalesce(data->>'no_hp','')) > 20 THEN
      RETURN jsonb_build_object('error', 'Input terlalu panjang.');
    END IF;
    -- Kuota harian (anti spam/DoS). Klinik nyata jauh di bawah ini.
    SELECT count(*) INTO v_count FROM pasien
      WHERE created_at >= day_start AND created_at <= day_end;
    IF v_count >= 300 THEN
      RETURN jsonb_build_object('error', 'Kuota pendaftaran online hari ini penuh. Hubungi klinik.');
    END IF;
    -- Abaikan input berbahaya — paksa default aman.
    v_status   := 'Menunggu';
    v_created  := now();
    v_nomor_rm := '';
  ELSE
    -- ====== Jalur ADMIN (login): percayai input ======
    v_status   := coalesce(data->>'status', 'Menunggu');
    v_created  := coalesce(nullif(data->>'created_at','')::timestamptz, now());
    v_nomor_rm := coalesce(data->>'nomor_rm','');
  END IF;

  -- Dedup 1 NIK per hari (atomik dalam lock)
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
    no_baru,
    data->>'nama',
    data->>'keluhan',
    nullif(data->>'tanggal_lahir','')::date,
    coalesce(data->>'jenis_kelamin','Laki-laki'),
    coalesce(data->>'alamat',''),
    coalesce(data->>'no_hp',''),
    nik_in,
    coalesce(data->>'jenis_pembayaran','Umum'),
    coalesce(data->>'nomor_bpjs',''),
    coalesce(data->>'nama_asuransi',''),
    v_nomor_rm,
    v_status,
    v_created
  )
  RETURNING * INTO inserted;

  RETURN to_jsonb(inserted);
END;
$$;

GRANT EXECUTE ON FUNCTION daftar_pasien(jsonb) TO anon, authenticated;

-- ============================================================
-- LANGKAH 13: server-side day window + allowlist staf (lihat JALANKAN_LANGKAH_13.sql)
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

-- ============================================================
-- LANGKAH 14: amankan tabel pengaturan (lihat JALANKAN_LANGKAH_14.sql)
-- ============================================================
-- Aman dijalankan ulang (idempotent). Butuh is_staff() dari Langkah 13b.
-- ============================================================

ALTER TABLE pengaturan ENABLE ROW LEVEL SECURITY;

-- Cabut semua akses langsung anon (anon tidak butuh tabel ini sama sekali).
REVOKE ALL ON pengaturan FROM anon;

-- Hanya staf allowlist yang boleh baca/tulis.
DROP POLICY IF EXISTS "staff_all_pengaturan" ON pengaturan;
CREATE POLICY "staff_all_pengaturan" ON pengaturan FOR ALL TO authenticated
  USING ( is_staff() ) WITH CHECK ( is_staff() );

-- ============================================================
-- VERIFIKASI: setelah Run, anon harus DITOLAK:
--   (dari luar) GET /rest/v1/pengaturan -> 401/permission denied
-- Admin (login) tetap bisa buka halaman Pengaturan seperti biasa.
-- ============================================================

-- ============================================================
-- LANGKAH 15: kurangi kolom baca anon (buang keluhan & jenis_kelamin) — lihat JALANKAN_LANGKAH_15.sql
-- ============================================================
-- ============================================================

-- Reset lalu beri ulang hanya kolom yang benar-benar dipakai display publik.
REVOKE SELECT ON pasien FROM anon;
GRANT SELECT (nomor_antrian, nama, status, created_at) ON pasien TO anon;

-- Bersihkan baris uji red-team (jika ada).
DELETE FROM pasien WHERE nama = 'ZZ_TEST_HAPUS';

-- ============================================================
-- VERIFIKASI (dari luar, sebagai anon):
--   GET /rest/v1/pasien?select=keluhan  -> harus permission denied
--   GET /rest/v1/pasien?select=nama,status,nomor_antrian -> tetap boleh
-- ============================================================

-- ============================================================
-- LANGKAH 16: jadwal & tarif pindah ke DB (lihat JALANKAN_LANGKAH_16.sql)
-- ============================================================

ALTER TABLE pengaturan ADD COLUMN IF NOT EXISTS jadwal     jsonb DEFAULT '{}'::jsonb;
ALTER TABLE pengaturan ADD COLUMN IF NOT EXISTS tarif_umum text  DEFAULT '75000';
ALTER TABLE pengaturan ADD COLUMN IF NOT EXISTS tarif_bpjs text  DEFAULT '0';
ALTER TABLE pengaturan ADD COLUMN IF NOT EXISTS tarif_igd  text  DEFAULT '150000';

-- Pastikan ada baris id=1 (sumber konfigurasi tunggal klinik).
INSERT INTO pengaturan (id, nama_klinik)
VALUES (1, 'Klinik & RB Afina')
ON CONFLICT (id) DO NOTHING;

-- Verifikasi:
-- SELECT id, jadwal, tarif_umum, tarif_bpjs, tarif_igd FROM pengaturan WHERE id = 1;

-- ============================================================
-- LANGKAH 17: billing (metode bayar, invoice, rincian) — lihat JALANKAN_LANGKAH_17.sql
-- ============================================================

ALTER TABLE pasien ADD COLUMN IF NOT EXISTS metode_bayar  text  DEFAULT '';
ALTER TABLE pasien ADD COLUMN IF NOT EXISTS nomor_invoice text  DEFAULT '';
ALTER TABLE pasien ADD COLUMN IF NOT EXISTS rincian       jsonb DEFAULT '[]'::jsonb;

-- Verifikasi:
-- SELECT nomor_antrian, biaya, metode_bayar, nomor_invoice, rincian
--   FROM pasien WHERE nomor_invoice <> '' LIMIT 5;

-- ============================================================
-- LANGKAH 18: RME terstruktur SOAP + finalisasi/kunci — lihat JALANKAN_LANGKAH_18.sql
-- ============================================================

ALTER TABLE rekam_medis ADD COLUMN IF NOT EXISTS anamnesa          text        DEFAULT '';
ALTER TABLE rekam_medis ADD COLUMN IF NOT EXISTS pemeriksaan_fisik text        DEFAULT '';
ALTER TABLE rekam_medis ADD COLUMN IF NOT EXISTS finalized         boolean     DEFAULT false;
ALTER TABLE rekam_medis ADD COLUMN IF NOT EXISTS finalized_at      timestamptz;

-- (Opsional, lapisan keras) Cegah perubahan rekam medis yang SUDAH difinalisasi
-- di tingkat database — addendum/koreksi harus lewat catatan baru, bukan edit.
CREATE OR REPLACE FUNCTION cegah_edit_rm_terkunci()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.finalized = true THEN
    RAISE EXCEPTION 'Rekam medis sudah difinalisasi dan tidak dapat diubah.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_rm_terkunci ON rekam_medis;
CREATE TRIGGER trg_rm_terkunci
  BEFORE UPDATE ON rekam_medis
  FOR EACH ROW
  WHEN (OLD.finalized = true)
  EXECUTE FUNCTION cegah_edit_rm_terkunci();

-- Verifikasi:
-- SELECT nomor_antrian, pasien_nama, finalized, finalized_at FROM rekam_medis WHERE finalized;

-- ============================================================
-- LANGKAH 19: multi-user + peran (role) — lihat JALANKAN_LANGKAH_19.sql
-- ============================================================

-- Tambah kolom peran ke allowlist staf (default 'admin' agar staf lama
-- tetap akses penuh sampai perannya diatur).
ALTER TABLE staff ADD COLUMN IF NOT EXISTS role text DEFAULT 'admin';

-- Pastikan admin utama tetap admin.
UPDATE staff SET role = 'admin' WHERE email = 'admin@klinik-afina.com' AND (role IS NULL OR role = '');

-- Fungsi: kembalikan peran pemanggil (dari email JWT). '' jika bukan staf.
-- SECURITY DEFINER agar bisa membaca tabel staff (yang terkunci RLS).
CREATE OR REPLACE FUNCTION staff_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT coalesce(
    (SELECT role FROM staff
      WHERE email = (current_setting('request.jwt.claims', true)::jsonb ->> 'email')
      LIMIT 1),
    ''
  );
$$;
GRANT EXECUTE ON FUNCTION staff_role() TO authenticated;

-- ============================================================
-- CARA MENAMBAH STAF BARU (setelah buat akun di Authentication -> Users):
--   INSERT INTO staff (email, role) VALUES ('loket@klinik-afina.com', 'loket')
--   ON CONFLICT (email) DO UPDATE SET role = EXCLUDED.role;
-- Peran valid: admin | loket | dokter | kasir | apoteker
--
-- Ubah peran staf:
--   UPDATE staff SET role = 'kasir' WHERE email = 'budi@klinik-afina.com';
--
-- Lihat semua staf & perannya:
--   SELECT email, role FROM staff ORDER BY role;
-- ============================================================

-- ============================================================
-- LANGKAH 20: audit log — lihat JALANKAN_LANGKAH_20.sql
-- ============================================================
-- ============================================================

CREATE TABLE IF NOT EXISTS audit_log (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  ts          timestamptz DEFAULT now(),
  actor_email text DEFAULT '',
  aksi        text,           -- INSERT / UPDATE / DELETE
  tabel       text,
  ref         text DEFAULT '',-- penanda baris (nomor_antrian / id)
  ringkas     text DEFAULT '' -- ringkasan (nama / status / dll)
);
CREATE INDEX IF NOT EXISTS idx_audit_ts ON audit_log(ts DESC);

-- RLS: hanya staf ber-peran 'admin' yang boleh BACA. Tak ada yang boleh
-- tulis/ubah/hapus langsung (hanya trigger SECURITY DEFINER).
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON audit_log FROM anon, authenticated;
GRANT SELECT ON audit_log TO authenticated;
DROP POLICY IF EXISTS "admin_read_audit" ON audit_log;
CREATE POLICY "admin_read_audit" ON audit_log FOR SELECT TO authenticated
  USING ( staff_role() = 'admin' );

-- Fungsi trigger generik: ambil aktor dari email JWT + ringkasan baris.
CREATE OR REPLACE FUNCTION audit_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  actor text := coalesce(nullif(current_setting('request.jwt.claims', true)::jsonb ->> 'email', ''), 'publik/sistem');
  v     jsonb := to_jsonb(coalesce(NEW, OLD));
BEGIN
  INSERT INTO audit_log (actor_email, aksi, tabel, ref, ringkas)
  VALUES (
    actor, TG_OP, TG_TABLE_NAME,
    coalesce(v->>'nomor_antrian', v->>'id', v->>'email', ''),
    nullif(concat_ws(' · ',
      nullif(v->>'nama', ''), nullif(v->>'pasien_nama', ''),
      nullif(v->>'status', ''), nullif(v->>'status_bayar', ''),
      nullif(v->>'diagnosa', ''), nullif(v->>'nama_klinik', ''),
      nullif(v->>'role', '')
    ), '')
  );
  RETURN coalesce(NEW, OLD);
END;
$$;

-- Pasang trigger di tabel-tabel penting.
DROP TRIGGER IF EXISTS trg_audit_pasien ON pasien;
CREATE TRIGGER trg_audit_pasien AFTER INSERT OR UPDATE OR DELETE ON pasien
  FOR EACH ROW EXECUTE FUNCTION audit_trigger();

DROP TRIGGER IF EXISTS trg_audit_rm ON rekam_medis;
CREATE TRIGGER trg_audit_rm AFTER INSERT OR UPDATE OR DELETE ON rekam_medis
  FOR EACH ROW EXECUTE FUNCTION audit_trigger();

DROP TRIGGER IF EXISTS trg_audit_pengaturan ON pengaturan;
CREATE TRIGGER trg_audit_pengaturan AFTER INSERT OR UPDATE OR DELETE ON pengaturan
  FOR EACH ROW EXECUTE FUNCTION audit_trigger();

DROP TRIGGER IF EXISTS trg_audit_staff ON staff;
CREATE TRIGGER trg_audit_staff AFTER INSERT OR UPDATE OR DELETE ON staff
  FOR EACH ROW EXECUTE FUNCTION audit_trigger();

-- Verifikasi:
-- SELECT ts, actor_email, aksi, tabel, ref, ringkas FROM audit_log ORDER BY ts DESC LIMIT 20;

-- ============================================================
-- LANGKAH 21: manajemen obat + stok (apotek) — lihat JALANKAN_LANGKAH_21.sql
-- ============================================================
-- ============================================================

CREATE TABLE IF NOT EXISTS obat (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  nama          text NOT NULL,
  satuan        text DEFAULT 'Tablet',     -- Tablet/Kapsul/Botol/Strip/Tube/Sachet
  harga         integer DEFAULT 0,         -- harga jual per satuan
  stok          integer DEFAULT 0,
  stok_minimal  integer DEFAULT 10,        -- ambang peringatan stok menipis
  aktif         boolean DEFAULT true,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_obat_nama ON obat(lower(nama));

-- RLS: hanya staf (allowlist) yang boleh akses. Pembatasan per-peran
-- (apoteker/admin yang menyunting) dilakukan di lapisan aplikasi.
ALTER TABLE obat ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "staff_all_obat" ON obat;
CREATE POLICY "staff_all_obat" ON obat FOR ALL TO authenticated
  USING ( is_staff() ) WITH CHECK ( is_staff() );

-- Audit (jika fungsi audit_trigger sudah ada dari Langkah 20).
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'audit_trigger') THEN
    DROP TRIGGER IF EXISTS trg_audit_obat ON obat;
    CREATE TRIGGER trg_audit_obat AFTER INSERT OR UPDATE OR DELETE ON obat
      FOR EACH ROW EXECUTE FUNCTION audit_trigger();
  END IF;
END $$;

-- Contoh isi awal (opsional — hapus jika tak perlu):
-- INSERT INTO obat (nama, satuan, harga, stok, stok_minimal) VALUES
--   ('Paracetamol 500mg', 'Tablet', 500, 200, 50),
--   ('Amoxicillin 500mg', 'Kapsul', 1000, 150, 30),
--   ('Antasida Syrup',    'Botol',  8000, 24,  5);

-- Verifikasi:
-- SELECT nama, stok, stok_minimal, harga FROM obat ORDER BY nama;

-- ============================================================
-- LANGKAH 22: e-resep -> stok + billing — lihat JALANKAN_LANGKAH_22.sql
-- ============================================================
-- Aman dijalankan ulang (idempotent).
-- ============================================================

-- Simpan resep terstruktur di rekam medis (selain teks obat untuk cetak).
ALTER TABLE rekam_medis ADD COLUMN IF NOT EXISTS resep jsonb DEFAULT '[]'::jsonb;

-- Dispense: potong stok tiap item + tambahkan biayanya ke rincian & total
-- pasien hari ini (dicocokkan via nomor_antrian + rentang hari WIB).
-- p_resep: array of { obat_id, nama, qty, harga }
CREATE OR REPLACE FUNCTION dispense_resep(p_nomor_antrian int, p_resep jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  item       jsonb;
  v_total    int := 0;
  v_items    jsonb := '[]'::jsonb;
  v_qty      int;
  v_harga    int;
  srv_start  timestamptz := date_trunc('day', now() AT TIME ZONE 'Asia/Jakarta') AT TIME ZONE 'Asia/Jakarta';
  srv_end    timestamptz := date_trunc('day', now() AT TIME ZONE 'Asia/Jakarta') AT TIME ZONE 'Asia/Jakarta' + interval '1 day' - interval '1 microsecond';
BEGIN
  IF NOT is_staff() THEN
    RETURN jsonb_build_object('error', 'Akses ditolak.');
  END IF;
  IF p_resep IS NULL OR jsonb_typeof(p_resep) <> 'array' OR jsonb_array_length(p_resep) = 0 THEN
    RETURN jsonb_build_object('ok', true, 'total', 0);
  END IF;

  FOR item IN SELECT * FROM jsonb_array_elements(p_resep) LOOP
    v_qty   := coalesce((item->>'qty')::int, 0);
    v_harga := coalesce((item->>'harga')::int, 0);
    IF v_qty <= 0 THEN CONTINUE; END IF;

    -- Potong stok (tidak boleh minus).
    IF (item->>'obat_id') IS NOT NULL AND (item->>'obat_id') <> '' THEN
      UPDATE obat
         SET stok = greatest(0, stok - v_qty), updated_at = now()
       WHERE id = (item->>'obat_id')::uuid;
    END IF;

    v_total := v_total + v_harga * v_qty;
    v_items := v_items || jsonb_build_object(
      'nama', coalesce(item->>'nama','Obat') || ' x' || v_qty,
      'harga', v_harga * v_qty
    );
  END LOOP;

  -- Tambahkan ke rincian + total biaya pasien hari ini.
  UPDATE pasien
     SET rincian = coalesce(rincian, '[]'::jsonb) || v_items,
         biaya   = coalesce(biaya, 0) + v_total
   WHERE nomor_antrian = p_nomor_antrian
     AND created_at >= srv_start AND created_at <= srv_end;

  RETURN jsonb_build_object('ok', true, 'total', v_total);
END;
$$;
GRANT EXECUTE ON FUNCTION dispense_resep(int, jsonb) TO authenticated;

-- Verifikasi:
-- SELECT nama, stok FROM obat ORDER BY updated_at DESC LIMIT 5;
