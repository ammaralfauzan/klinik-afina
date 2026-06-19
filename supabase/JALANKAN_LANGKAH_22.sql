-- ============================================================
-- JALANKAN DI: Supabase Dashboard -> SQL Editor -> New Query
-- LANGKAH 22: e-resep terhubung ke stok & billing (increment 2)
-- Saat RME difinalisasi: stok obat dipotong + biaya masuk rincian kasir.
-- SYARAT: Langkah 17 (rincian), 18 (finalisasi RME), 21 (obat).
-- Aman dijalankan ulang (idempotent).
-- ============================================================

-- Simpan resep terstruktur di rekam medis (selain teks obat untuk cetak).
ALTER TABLE rekam_medis ADD COLUMN IF NOT EXISTS resep jsonb DEFAULT '[]'::jsonb;

-- Dispense: potong stok tiap item + tambahkan biayanya ke rincian & total
-- pasien hari ini (dicocokkan via nomor_antrian + rentang hari WIB).
-- p_resep: array of { obat_id, nama, qty, harga }
CREATE OR REPLACE FUNCTION dispense_resep(p_nomor_antrian int, p_resep jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  item       jsonb;
  v_total    int := 0;
  v_items    jsonb := '[]'::jsonb;
  v_qty      int;
  v_harga    int;
  srv_start  timestamptz := date_trunc('day', now() AT TIME ZONE 'Asia/Jakarta') AT TIME ZONE 'Asia/Jakarta';
  srv_end    timestamptz := date_trunc('day', now() AT TIME ZONE 'Asia/Jakarta') AT TIME ZONE 'Asia/Jakarta' + interval '1 day' - interval '1 microsecond';
BEGIN
  IF NOT is_staff() THEN
    RETURN jsonb_build_object('error', 'Akses ditolak.');
  END IF;
  IF p_resep IS NULL OR jsonb_typeof(p_resep) <> 'array' OR jsonb_array_length(p_resep) = 0 THEN
    RETURN jsonb_build_object('ok', true, 'total', 0);
  END IF;

  FOR item IN SELECT * FROM jsonb_array_elements(p_resep) LOOP
    v_qty   := coalesce((item->>'qty')::int, 0);
    v_harga := coalesce((item->>'harga')::int, 0);
    IF v_qty <= 0 THEN CONTINUE; END IF;

    -- Potong stok (tidak boleh minus).
    IF (item->>'obat_id') IS NOT NULL AND (item->>'obat_id') <> '' THEN
      UPDATE obat
         SET stok = greatest(0, stok - v_qty), updated_at = now()
       WHERE id = (item->>'obat_id')::uuid;
    END IF;

    v_total := v_total + v_harga * v_qty;
    v_items := v_items || jsonb_build_object(
      'nama', coalesce(item->>'nama','Obat') || ' x' || v_qty,
      'harga', v_harga * v_qty
    );
  END LOOP;

  -- Tambahkan ke rincian + total biaya pasien hari ini.
  UPDATE pasien
     SET rincian = coalesce(rincian, '[]'::jsonb) || v_items,
         biaya   = coalesce(biaya, 0) + v_total
   WHERE nomor_antrian = p_nomor_antrian
     AND created_at >= srv_start AND created_at <= srv_end;

  RETURN jsonb_build_object('ok', true, 'total', v_total);
END;
$$;
GRANT EXECUTE ON FUNCTION dispense_resep(int, jsonb) TO authenticated;

-- Verifikasi:
-- SELECT nama, stok FROM obat ORDER BY updated_at DESC LIMIT 5;
