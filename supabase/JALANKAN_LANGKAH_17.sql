-- ============================================================
-- JALANKAN DI: Supabase Dashboard -> SQL Editor -> New Query
-- LANGKAH 17: Billing — metode bayar, nomor invoice, rincian item
-- Aman dijalankan ulang (idempotent).
-- ============================================================

ALTER TABLE pasien ADD COLUMN IF NOT EXISTS metode_bayar  text  DEFAULT '';
ALTER TABLE pasien ADD COLUMN IF NOT EXISTS nomor_invoice text  DEFAULT '';
ALTER TABLE pasien ADD COLUMN IF NOT EXISTS rincian       jsonb DEFAULT '[]'::jsonb;

-- Verifikasi:
-- SELECT nomor_antrian, biaya, metode_bayar, nomor_invoice, rincian
--   FROM pasien WHERE nomor_invoice <> '' LIMIT 5;
