-- ============================================================
-- JALANKAN DI: Supabase Dashboard -> SQL Editor -> New Query
-- LANGKAH 19: Multi-user + peran (role) per staf
-- Aman dijalankan ulang (idempotent).
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
