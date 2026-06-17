-- ============================================================
-- JALANKAN DI: Supabase Dashboard -> SQL Editor -> New Query
-- LANGKAH 14: Amankan tabel 'pengaturan' (config klinik)
-- Sebelumnya anon bisa BACA & TULIS config (nama/alamat/telepon/jam).
-- Penyerang bisa mengganti nomor telepon klinik jadi nomor penipu.
-- Tabel ini hanya dipakai halaman admin -> kunci total ke staf.
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
