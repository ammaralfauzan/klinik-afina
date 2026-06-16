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
