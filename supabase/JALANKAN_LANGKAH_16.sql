-- ============================================================
-- JALANKAN DI: Supabase Dashboard -> SQL Editor -> New Query
-- LANGKAH 16: Pindahkan jadwal dokter & tarif dari localStorage ke DB
-- Agar konfigurasi tersinkron antar perangkat & ikut ter-backup.
-- Aman dijalankan ulang (idempotent).
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
