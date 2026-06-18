-- ============================================================
-- JALANKAN DI: Supabase Dashboard -> SQL Editor -> New Query
-- LANGKAH 18: RME terstruktur (SOAP) + finalisasi/kunci
-- Aman dijalankan ulang (idempotent).
-- ============================================================

ALTER TABLE rekam_medis ADD COLUMN IF NOT EXISTS anamnesa          text        DEFAULT '';
ALTER TABLE rekam_medis ADD COLUMN IF NOT EXISTS pemeriksaan_fisik text        DEFAULT '';
ALTER TABLE rekam_medis ADD COLUMN IF NOT EXISTS finalized         boolean     DEFAULT false;
ALTER TABLE rekam_medis ADD COLUMN IF NOT EXISTS finalized_at      timestamptz;

-- (Opsional, lapisan keras) Cegah perubahan rekam medis yang SUDAH difinalisasi
-- di tingkat database — addendum/koreksi harus lewat catatan baru, bukan edit.
CREATE OR REPLACE FUNCTION cegah_edit_rm_terkunci()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.finalized = true THEN
    RAISE EXCEPTION 'Rekam medis sudah difinalisasi dan tidak dapat diubah.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_rm_terkunci ON rekam_medis;
CREATE TRIGGER trg_rm_terkunci
  BEFORE UPDATE ON rekam_medis
  FOR EACH ROW
  WHEN (OLD.finalized = true)
  EXECUTE FUNCTION cegah_edit_rm_terkunci();

-- Verifikasi:
-- SELECT nomor_antrian, pasien_nama, finalized, finalized_at FROM rekam_medis WHERE finalized;
