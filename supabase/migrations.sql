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
