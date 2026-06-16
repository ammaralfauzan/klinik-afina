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
-- LANGKAH 7: Aktifkan RLS (Row Level Security) — PRODUCTION
-- Jalankan ini setelah membuat user di Supabase Auth Dashboard
-- ============================================================

-- Aktifkan RLS pada tabel pasien
ALTER TABLE pasien ENABLE ROW LEVEL SECURITY;

-- Policy: user yang sudah login bisa baca/tulis semua data pasien
CREATE POLICY IF NOT EXISTS "authenticated_all_pasien"
  ON pasien FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Aktifkan RLS pada tabel rekam_medis
ALTER TABLE rekam_medis ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "authenticated_all_rekam_medis"
  ON rekam_medis FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Aktifkan RLS pada tabel pengaturan (jika ada)
-- ALTER TABLE pengaturan ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY IF NOT EXISTS "authenticated_all_pengaturan"
--   ON pengaturan FOR ALL TO authenticated USING (true) WITH CHECK (true);
