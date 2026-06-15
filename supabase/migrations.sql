-- Jalankan SQL ini di Supabase Dashboard → SQL Editor
-- https://supabase.com/dashboard → pilih project → SQL Editor → New Query

-- 1. Tambah kolom baru ke tabel pasien
ALTER TABLE pasien ADD COLUMN IF NOT EXISTS tanggal_lahir DATE;
ALTER TABLE pasien ADD COLUMN IF NOT EXISTS jenis_kelamin TEXT DEFAULT 'Laki-laki';
ALTER TABLE pasien ADD COLUMN IF NOT EXISTS alamat TEXT DEFAULT '';
ALTER TABLE pasien ADD COLUMN IF NOT EXISTS no_hp TEXT DEFAULT '';

-- 2. Pastikan RLS policy mengizinkan INSERT untuk anon (jika RLS aktif)
-- Cek status RLS:
-- SELECT relrowsecurity FROM pg_class WHERE relname = 'pasien';

-- Jika RLS aktif dan belum ada policy, jalankan ini:
-- ALTER TABLE pasien ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "allow_all" ON pasien FOR ALL USING (true) WITH CHECK (true);

-- Atau nonaktifkan RLS (lebih simple untuk development):
-- ALTER TABLE pasien DISABLE ROW LEVEL SECURITY;
