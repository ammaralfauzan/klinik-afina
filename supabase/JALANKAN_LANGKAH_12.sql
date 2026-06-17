-- ============================================================
-- JALANKAN DI: Supabase Dashboard -> SQL Editor -> New Query
-- Hardening keamanan tahap 2. Jalankan SETELAH deploy Vercel live.
-- Aman dijalankan ulang (idempotent).
-- ============================================================

-- LANGKAH 12: HARDENING RPC ANON (anti penyalahgunaan & kebocoran PII)
-- Menutup 2 celah:
--  (1) edit_pendaftaran mengembalikan seluruh baris (PII) & hanya di-gate
--      NIK+nomor_antrian → bisa dipakai mencuri data/ubah data orang lain.
--  (2) daftar_pasien (anon) bisa memaksa status/created_at/nomor_rm,
--      tanpa validasi panjang & tanpa batas volume → spam/DoS/poisoning.
-- ============================================================

-- 12a. edit_pendaftaran: tambah gate tanggal lahir + JANGAN balikan PII.
DROP FUNCTION IF EXISTS edit_pendaftaran(text, int, text, text, text, text, text, timestamptz, timestamptz);

CREATE OR REPLACE FUNCTION edit_pendaftaran(
  p_nomor_nik        text,
  p_nomor_antrian    int,
  p_keluhan          text,
  p_no_hp            text,
  p_jenis_pembayaran text,
  p_nomor_bpjs       text,
  p_nama_asuransi    text,
  p_day_start        timestamptz,
  p_day_end          timestamptz,
  p_tanggal_lahir    date DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target pasien;
BEGIN
  IF length(coalesce(p_keluhan,'')) > 500
     OR length(coalesce(p_no_hp,'')) > 20
     OR length(coalesce(p_nomor_bpjs,'')) > 25
     OR length(coalesce(p_nama_asuransi,'')) > 120 THEN
    RETURN jsonb_build_object('error', 'Input terlalu panjang.');
  END IF;

  -- Gate: NIK + nomor antrian + TANGGAL LAHIR harus cocok (anti enumerasi).
  SELECT * INTO target
    FROM pasien
   WHERE nomor_antrian = p_nomor_antrian
     AND nomor_nik     = p_nomor_nik
     AND tanggal_lahir IS NOT DISTINCT FROM p_tanggal_lahir
     AND created_at >= p_day_start AND created_at <= p_day_end
   LIMIT 1;

  IF target IS NULL THEN
    RETURN jsonb_build_object('error', 'Data pendaftaran tidak ditemukan.');
  END IF;

  IF target.status <> 'Menunggu' THEN
    RETURN jsonb_build_object('error', 'Pendaftaran sudah diproses, tidak bisa diubah.');
  END IF;

  UPDATE pasien SET
    keluhan          = p_keluhan,
    no_hp            = p_no_hp,
    jenis_pembayaran = p_jenis_pembayaran,
    nomor_bpjs       = p_nomor_bpjs,
    nama_asuransi    = p_nama_asuransi
  WHERE nomor_antrian = p_nomor_antrian
    AND nomor_nik     = p_nomor_nik
    AND created_at >= p_day_start AND created_at <= p_day_end;

  -- JANGAN kembalikan baris (mengandung PII). Cukup tanda sukses.
  RETURN jsonb_build_object('ok', true);
END;
$$;

GRANT EXECUTE ON FUNCTION edit_pendaftaran(
  text, int, text, text, text, text, text, timestamptz, timestamptz, date
) TO anon, authenticated;

-- 12b. daftar_pasien: sadar-peran. Anon dipaksa nilai aman + validasi + kuota.
CREATE OR REPLACE FUNCTION daftar_pasien(data jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  no_baru    int;
  day_start  timestamptz := (data->>'day_start')::timestamptz;
  day_end    timestamptz := (data->>'day_end')::timestamptz;
  nik_in     text := coalesce(data->>'nomor_nik','');
  v_role     text := coalesce(current_setting('request.jwt.claims', true)::jsonb ->> 'role', 'anon');
  v_status   text;
  v_created  timestamptz;
  v_nomor_rm text;
  v_count    int;
  inserted   pasien;
  dup        pasien;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('antrian:' || day_start::text));

  IF v_role <> 'authenticated' THEN
    -- ====== Jalur PUBLIK (anon): ketat ======
    IF nik_in !~ '^[0-9]{16}$' THEN
      RETURN jsonb_build_object('error', 'NIK harus 16 digit angka.');
    END IF;
    IF length(coalesce(data->>'nama','')) > 100
       OR length(coalesce(data->>'keluhan','')) > 500
       OR length(coalesce(data->>'alamat','')) > 300
       OR length(coalesce(data->>'no_hp','')) > 20 THEN
      RETURN jsonb_build_object('error', 'Input terlalu panjang.');
    END IF;
    -- Kuota harian (anti spam/DoS). Klinik nyata jauh di bawah ini.
    SELECT count(*) INTO v_count FROM pasien
      WHERE created_at >= day_start AND created_at <= day_end;
    IF v_count >= 300 THEN
      RETURN jsonb_build_object('error', 'Kuota pendaftaran online hari ini penuh. Hubungi klinik.');
    END IF;
    -- Abaikan input berbahaya — paksa default aman.
    v_status   := 'Menunggu';
    v_created  := now();
    v_nomor_rm := '';
  ELSE
    -- ====== Jalur ADMIN (login): percayai input ======
    v_status   := coalesce(data->>'status', 'Menunggu');
    v_created  := coalesce(nullif(data->>'created_at','')::timestamptz, now());
    v_nomor_rm := coalesce(data->>'nomor_rm','');
  END IF;

  -- Dedup 1 NIK per hari (atomik dalam lock)
  IF nik_in <> '' THEN
    SELECT * INTO dup FROM pasien
      WHERE nomor_nik = nik_in AND created_at >= day_start AND created_at <= day_end
      LIMIT 1;
    IF dup IS NOT NULL THEN
      RETURN jsonb_build_object('error','NIK sudah terdaftar hari ini',
                                'nomor_antrian',dup.nomor_antrian,'status',dup.status);
    END IF;
  END IF;

  SELECT coalesce(max(nomor_antrian),0)+1 INTO no_baru FROM pasien
    WHERE created_at >= day_start AND created_at <= day_end;

  INSERT INTO pasien (
    nomor_antrian, nama, keluhan, tanggal_lahir, jenis_kelamin,
    alamat, no_hp, nomor_nik, jenis_pembayaran, nomor_bpjs, nama_asuransi,
    nomor_rm, status, created_at
  ) VALUES (
    no_baru,
    data->>'nama',
    data->>'keluhan',
    nullif(data->>'tanggal_lahir','')::date,
    coalesce(data->>'jenis_kelamin','Laki-laki'),
    coalesce(data->>'alamat',''),
    coalesce(data->>'no_hp',''),
    nik_in,
    coalesce(data->>'jenis_pembayaran','Umum'),
    coalesce(data->>'nomor_bpjs',''),
    coalesce(data->>'nama_asuransi',''),
    v_nomor_rm,
    v_status,
    v_created
  )
  RETURNING * INTO inserted;

  RETURN to_jsonb(inserted);
END;
$$;

GRANT EXECUTE ON FUNCTION daftar_pasien(jsonb) TO anon, authenticated;
