-- ============================================================
-- JALANKAN DI: Supabase Dashboard -> SQL Editor -> New Query
-- LANGKAH 21: Manajemen Obat + Stok (modul Apotek) — increment 1
-- SYARAT: Langkah 13b (is_staff) sudah ada. Langkah 20 opsional (audit).
-- Aman dijalankan ulang (idempotent).
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
