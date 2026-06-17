-- ============================================================
-- JALANKAN DI: Supabase Dashboard -> SQL Editor -> New Query
-- LANGKAH 15: Kurangi kolom yang bisa dibaca anon
-- Buang 'keluhan' (DATA KESEHATAN) & 'jenis_kelamin' dari hak baca publik.
-- Display antrian hanya butuh nomor + nama + status.
-- Aman dijalankan ulang (idempotent).
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
