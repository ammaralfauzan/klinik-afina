-- ============================================================
-- JALANKAN DI: Supabase Dashboard -> SQL Editor -> New Query
-- LANGKAH 20: Audit Log — catat otomatis siapa mengubah apa & kapan
-- SYARAT: Langkah 19 sudah dijalankan (butuh fungsi staff_role()).
-- Aman dijalankan ulang (idempotent).
-- ============================================================

CREATE TABLE IF NOT EXISTS audit_log (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  ts          timestamptz DEFAULT now(),
  actor_email text DEFAULT '',
  aksi        text,           -- INSERT / UPDATE / DELETE
  tabel       text,
  ref         text DEFAULT '',-- penanda baris (nomor_antrian / id)
  ringkas     text DEFAULT '' -- ringkasan (nama / status / dll)
);
CREATE INDEX IF NOT EXISTS idx_audit_ts ON audit_log(ts DESC);

-- RLS: hanya staf ber-peran 'admin' yang boleh BACA. Tak ada yang boleh
-- tulis/ubah/hapus langsung (hanya trigger SECURITY DEFINER).
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON audit_log FROM anon, authenticated;
GRANT SELECT ON audit_log TO authenticated;
DROP POLICY IF EXISTS "admin_read_audit" ON audit_log;
CREATE POLICY "admin_read_audit" ON audit_log FOR SELECT TO authenticated
  USING ( staff_role() = 'admin' );

-- Fungsi trigger generik: ambil aktor dari email JWT + ringkasan baris.
CREATE OR REPLACE FUNCTION audit_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  actor text := coalesce(nullif(current_setting('request.jwt.claims', true)::jsonb ->> 'email', ''), 'publik/sistem');
  v     jsonb := to_jsonb(coalesce(NEW, OLD));
BEGIN
  INSERT INTO audit_log (actor_email, aksi, tabel, ref, ringkas)
  VALUES (
    actor, TG_OP, TG_TABLE_NAME,
    coalesce(v->>'nomor_antrian', v->>'id', v->>'email', ''),
    nullif(concat_ws(' · ',
      nullif(v->>'nama', ''), nullif(v->>'pasien_nama', ''),
      nullif(v->>'status', ''), nullif(v->>'status_bayar', ''),
      nullif(v->>'diagnosa', ''), nullif(v->>'nama_klinik', ''),
      nullif(v->>'role', '')
    ), '')
  );
  RETURN coalesce(NEW, OLD);
END;
$$;

-- Pasang trigger di tabel-tabel penting.
DROP TRIGGER IF EXISTS trg_audit_pasien ON pasien;
CREATE TRIGGER trg_audit_pasien AFTER INSERT OR UPDATE OR DELETE ON pasien
  FOR EACH ROW EXECUTE FUNCTION audit_trigger();

DROP TRIGGER IF EXISTS trg_audit_rm ON rekam_medis;
CREATE TRIGGER trg_audit_rm AFTER INSERT OR UPDATE OR DELETE ON rekam_medis
  FOR EACH ROW EXECUTE FUNCTION audit_trigger();

DROP TRIGGER IF EXISTS trg_audit_pengaturan ON pengaturan;
CREATE TRIGGER trg_audit_pengaturan AFTER INSERT OR UPDATE OR DELETE ON pengaturan
  FOR EACH ROW EXECUTE FUNCTION audit_trigger();

DROP TRIGGER IF EXISTS trg_audit_staff ON staff;
CREATE TRIGGER trg_audit_staff AFTER INSERT OR UPDATE OR DELETE ON staff
  FOR EACH ROW EXECUTE FUNCTION audit_trigger();

-- Verifikasi:
-- SELECT ts, actor_email, aksi, tabel, ref, ringkas FROM audit_log ORDER BY ts DESC LIMIT 20;
