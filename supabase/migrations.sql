-- ============================================================
-- JALANKAN DI: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- LANGKAH 1: Tambah kolom yang dibutuhkan (skip jika sudah ada)
ALTER TABLE pasien ADD COLUMN IF NOT EXISTS tanggal_lahir DATE;
ALTER TABLE pasien ADD COLUMN IF NOT EXISTS jenis_kelamin TEXT DEFAULT 'Laki-laki';
ALTER TABLE pasien ADD COLUMN IF NOT EXISTS alamat TEXT DEFAULT '';
ALTER TABLE pasien ADD COLUMN IF NOT EXISTS no_hp TEXT DEFAULT '';

-- LANGKAH 2: Disable RLS agar data bisa masuk (untuk demo/development)
ALTER TABLE pasien DISABLE ROW LEVEL SECURITY;

-- Alternatif: Tambah policy yang allow semua operasi (untuk production)
-- ALTER TABLE pasien ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "allow_all" ON pasien FOR ALL USING (true) WITH CHECK (true);

-- LANGKAH 3: Jika ada tabel pengaturan
-- ALTER TABLE pengaturan DISABLE ROW LEVEL SECURITY;

-- Verifikasi kolom sudah ada:
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'pasien';

-- ============================================================
-- LANGKAH 4: Kolom kasir (biaya & status pembayaran)
-- ============================================================
ALTER TABLE pasien ADD COLUMN IF NOT EXISTS biaya INTEGER DEFAULT 0;
ALTER TABLE pasien ADD COLUMN IF NOT EXISTS status_bayar TEXT DEFAULT 'Belum Bayar';

-- ============================================================
-- LANGKAH 5: Tabel rekam medis
-- ============================================================
CREATE TABLE IF NOT EXISTS rekam_medis (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nomor_antrian INTEGER,
  visit_date DATE NOT NULL,
  pasien_nama TEXT NOT NULL,
  pasien_keluhan TEXT DEFAULT '',
  diagnosa TEXT DEFAULT '',
  tindakan TEXT DEFAULT '',
  obat TEXT DEFAULT '',
  catatan TEXT DEFAULT '',
  dokter TEXT DEFAULT 'dr. Umum',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE rekam_medis DISABLE ROW LEVEL SECURITY;

-- Verifikasi:
-- SELECT * FROM rekam_medis LIMIT 5;

-- ============================================================
-- LANGKAH 6: Nomor RM permanen + kolom BPJS / Asuransi
-- ============================================================
ALTER TABLE pasien ADD COLUMN IF NOT EXISTS nomor_rm TEXT DEFAULT '';
ALTER TABLE pasien ADD COLUMN IF NOT EXISTS jenis_pembayaran TEXT DEFAULT 'Umum';
ALTER TABLE pasien ADD COLUMN IF NOT EXISTS nomor_bpjs TEXT DEFAULT '';
ALTER TABLE pasien ADD COLUMN IF NOT EXISTS nama_asuransi TEXT DEFAULT '';

-- ============================================================
-- LANGKAH 7a: Kolom Vital Signs di rekam_medis
-- ============================================================
ALTER TABLE rekam_medis ADD COLUMN IF NOT EXISTS td TEXT DEFAULT '';
ALTER TABLE rekam_medis ADD COLUMN IF NOT EXISTS suhu TEXT DEFAULT '';
ALTER TABLE rekam_medis ADD COLUMN IF NOT EXISTS berat TEXT DEFAULT '';
ALTER TABLE rekam_medis ADD COLUMN IF NOT EXISTS tinggi TEXT DEFAULT '';
ALTER TABLE rekam_medis ADD COLUMN IF NOT EXISTS saturasi TEXT DEFAULT '';

-- ============================================================
-- LANGKAH 7b: Aktifkan RLS (Row Level Security) — PRODUCTION
-- Jalankan ini setelah membuat user di Supabase Auth Dashboard
-- ============================================================

-- Aktifkan RLS pada tabel pasien
ALTER TABLE pasien ENABLE ROW LEVEL SECURITY;

-- Hapus policy lama jika ada, lalu buat ulang
DROP POLICY IF EXISTS "authenticated_all_pasien" ON pasien;
CREATE POLICY "authenticated_all_pasien"
  ON pasien FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Aktifkan RLS pada tabel rekam_medis
ALTER TABLE rekam_medis ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated_all_rekam_medis" ON rekam_medis;
CREATE POLICY "authenticated_all_rekam_medis"
  ON rekam_medis FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Aktifkan RLS pada tabel pengaturan (jika ada)
-- ALTER TABLE pengaturan ENABLE ROW LEVEL SECURITY;
-- DROP POLICY IF EXISTS "authenticated_all_pengaturan" ON pengaturan;
-- CREATE POLICY "authenticated_all_pengaturan"
--   ON pengaturan FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- LANGKAH 8: Registrasi pasien ATOMIK (anti race-condition)
-- Mencegah dua pasien dapat nomor antrian yang sama saat
-- mendaftar bersamaan (terutama via pendaftaran online).
-- Memakai advisory lock agar perhitungan nomor + insert
-- berjalan serial per-hari.
-- ============================================================
CREATE OR REPLACE FUNCTION daftar_pasien(data jsonb)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  no_baru      int;
  day_start    timestamptz := (data->>'day_start')::timestamptz;
  day_end      timestamptz := (data->>'day_end')::timestamptz;
  inserted     pasien;
BEGIN
  -- Serialkan registrasi untuk hari yang sama
  PERFORM pg_advisory_xact_lock(hashtext('antrian:' || day_start::text));

  SELECT COALESCE(MAX(nomor_antrian), 0) + 1
    INTO no_baru
    FROM pasien
   WHERE created_at >= day_start AND created_at <= day_end;

  INSERT INTO pasien (
    nomor_antrian, nama, keluhan, tanggal_lahir, jenis_kelamin,
    alamat, no_hp, jenis_pembayaran, nomor_bpjs, nama_asuransi,
    nomor_rm, status, created_at
  ) VALUES (
    no_baru,
    data->>'nama',
    data->>'keluhan',
    NULLIF(data->>'tanggal_lahir', '')::date,
    COALESCE(data->>'jenis_kelamin', 'Laki-laki'),
    COALESCE(data->>'alamat', ''),
    COALESCE(data->>'no_hp', ''),
    COALESCE(data->>'jenis_pembayaran', 'Umum'),
    COALESCE(data->>'nomor_bpjs', ''),
    COALESCE(data->>'nama_asuransi', ''),
    COALESCE(data->>'nomor_rm', ''),
    COALESCE(data->>'status', 'Menunggu'),
    COALESCE(NULLIF(data->>'created_at', '')::timestamptz, now())
  )
  RETURNING * INTO inserted;

  RETURN to_jsonb(inserted);
END;
$$;

-- Beri akses ke role yang dipakai aplikasi
GRANT EXECUTE ON FUNCTION daftar_pasien(jsonb) TO anon, authenticated;

-- ============================================================
-- LANGKAH 9: Kolom NIK + index dedup + perbarui RPC
-- Jalankan setelah Langkah 8.
-- ============================================================
ALTER TABLE pasien ADD COLUMN IF NOT EXISTS nomor_nik TEXT DEFAULT '';

-- Index supaya cek dedup NIK per-hari cepat
CREATE INDEX IF NOT EXISTS idx_pasien_nomor_nik ON pasien(nomor_nik);

-- Perbarui RPC agar menyimpan nomor_nik
CREATE OR REPLACE FUNCTION daftar_pasien(data jsonb)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  no_baru      int;
  day_start    timestamptz := (data->>'day_start')::timestamptz;
  day_end      timestamptz := (data->>'day_end')::timestamptz;
  inserted     pasien;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('antrian:' || day_start::text));

  SELECT COALESCE(MAX(nomor_antrian), 0) + 1
    INTO no_baru
    FROM pasien
   WHERE created_at >= day_start AND created_at <= day_end;

  INSERT INTO pasien (
    nomor_antrian, nama, keluhan, tanggal_lahir, jenis_kelamin,
    alamat, no_hp, nomor_nik, jenis_pembayaran, nomor_bpjs, nama_asuransi,
    nomor_rm, status, created_at
  ) VALUES (
    no_baru,
    data->>'nama',
    data->>'keluhan',
    NULLIF(data->>'tanggal_lahir', '')::date,
    COALESCE(data->>'jenis_kelamin', 'Laki-laki'),
    COALESCE(data->>'alamat', ''),
    COALESCE(data->>'no_hp', ''),
    COALESCE(data->>'nomor_nik', ''),
    COALESCE(data->>'jenis_pembayaran', 'Umum'),
    COALESCE(data->>'nomor_bpjs', ''),
    COALESCE(data->>'nama_asuransi', ''),
    COALESCE(data->>'nomor_rm', ''),
    COALESCE(data->>'status', 'Menunggu'),
    COALESCE(NULLIF(data->>'created_at', '')::timestamptz, now())
  )
  RETURNING * INTO inserted;

  RETURN to_jsonb(inserted);
END;
$$;

GRANT EXECUTE ON FUNCTION daftar_pasien(jsonb) TO anon, authenticated;

-- ============================================================
-- LANGKAH 10: edit_pendaftaran — anon edit pendaftaran miliknya
-- (versi resmi, version-controlled. Sebelumnya hanya ada di DB.)
-- SECURITY DEFINER + gate: NIK harus cocok dengan baris nomor_antrian
-- hari ini, dan status masih "Menunggu".
-- ============================================================
CREATE OR REPLACE FUNCTION edit_pendaftaran(
  p_nomor_nik        text,
  p_nomor_antrian    int,
  p_keluhan          text,
  p_no_hp            text,
  p_jenis_pembayaran text,
  p_nomor_bpjs       text,
  p_nama_asuransi    text,
  p_day_start        timestamptz,
  p_day_end          timestamptz
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target  pasien;
BEGIN
  -- Cari baris milik NIK ini, di nomor antrian ini, hari ini
  SELECT * INTO target
    FROM pasien
   WHERE nomor_antrian = p_nomor_antrian
     AND nomor_nik     = p_nomor_nik
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
    AND created_at >= p_day_start AND created_at <= p_day_end
  RETURNING * INTO target;

  RETURN to_jsonb(target);
END;
$$;

GRANT EXECUTE ON FUNCTION edit_pendaftaran(
  text, int, text, text, text, text, text, timestamptz, timestamptz
) TO anon, authenticated;

-- ============================================================
-- LANGKAH 11: AKTIFKAN RLS DENGAN BENAR (anti kebocoran data pasien)
-- Setelah langkah ini, anon (publik) TIDAK bisa lagi membaca NIK,
-- alamat, no HP, atau BPJS pasien lain. Pendaftaran online tetap
-- jalan lewat RPC SECURITY DEFINER di bawah.
-- ============================================================

-- 11a. daftar_pasien: jadikan SECURITY DEFINER + dedup NIK atomik
--      (cek duplikat di dalam lock agar 2 request NIK sama tak lolos).
CREATE OR REPLACE FUNCTION daftar_pasien(data jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  no_baru      int;
  day_start    timestamptz := (data->>'day_start')::timestamptz;
  day_end      timestamptz := (data->>'day_end')::timestamptz;
  nik_in       text        := COALESCE(data->>'nomor_nik', '');
  inserted     pasien;
  dup          pasien;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('antrian:' || day_start::text));

  -- Dedup: 1 NIK per hari (hanya jika NIK diisi)
  IF nik_in <> '' THEN
    SELECT * INTO dup
      FROM pasien
     WHERE nomor_nik = nik_in
       AND created_at >= day_start AND created_at <= day_end
     LIMIT 1;
    IF dup IS NOT NULL THEN
      RETURN jsonb_build_object(
        'error', 'NIK sudah terdaftar hari ini',
        'nomor_antrian', dup.nomor_antrian,
        'status', dup.status
      );
    END IF;
  END IF;

  SELECT COALESCE(MAX(nomor_antrian), 0) + 1
    INTO no_baru
    FROM pasien
   WHERE created_at >= day_start AND created_at <= day_end;

  INSERT INTO pasien (
    nomor_antrian, nama, keluhan, tanggal_lahir, jenis_kelamin,
    alamat, no_hp, nomor_nik, jenis_pembayaran, nomor_bpjs, nama_asuransi,
    nomor_rm, status, created_at
  ) VALUES (
    no_baru,
    data->>'nama',
    data->>'keluhan',
    NULLIF(data->>'tanggal_lahir', '')::date,
    COALESCE(data->>'jenis_kelamin', 'Laki-laki'),
    COALESCE(data->>'alamat', ''),
    COALESCE(data->>'no_hp', ''),
    nik_in,
    COALESCE(data->>'jenis_pembayaran', 'Umum'),
    COALESCE(data->>'nomor_bpjs', ''),
    COALESCE(data->>'nama_asuransi', ''),
    COALESCE(data->>'nomor_rm', ''),
    COALESCE(data->>'status', 'Menunggu'),
    COALESCE(NULLIF(data->>'created_at', '')::timestamptz, now())
  )
  RETURNING * INTO inserted;

  RETURN to_jsonb(inserted);
END;
$$;

GRANT EXECUTE ON FUNCTION daftar_pasien(jsonb) TO anon, authenticated;

-- 11b. cek_pendaftaran_nik: anon ambil pendaftarannya sendiri (untuk
--      pre-isi form mode edit). Di-gate NIK + tanggal lahir agar orang
--      tidak bisa menebak NIK acak untuk mengintip data orang lain.
CREATE OR REPLACE FUNCTION cek_pendaftaran_nik(
  p_nomor_nik     text,
  p_tanggal_lahir date,
  p_day_start     timestamptz,
  p_day_end       timestamptz
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  row pasien;
BEGIN
  SELECT * INTO row
    FROM pasien
   WHERE nomor_nik = p_nomor_nik
     AND tanggal_lahir IS NOT DISTINCT FROM p_tanggal_lahir
     AND created_at >= p_day_start AND created_at <= p_day_end
   LIMIT 1;

  IF row IS NULL THEN
    RETURN NULL;
  END IF;

  RETURN jsonb_build_object(
    'nomor_antrian',    row.nomor_antrian,
    'status',           row.status,
    'nama',             row.nama,
    'keluhan',          row.keluhan,
    'no_hp',            row.no_hp,
    'jenis_pembayaran', row.jenis_pembayaran,
    'nomor_bpjs',       row.nomor_bpjs,
    'nama_asuransi',    row.nama_asuransi
  );
END;
$$;

GRANT EXECUTE ON FUNCTION cek_pendaftaran_nik(
  text, date, timestamptz, timestamptz
) TO anon, authenticated;

-- 11c. Aktifkan RLS + kunci akses langsung anon ke tabel.
ALTER TABLE pasien        ENABLE ROW LEVEL SECURITY;
ALTER TABLE rekam_medis   ENABLE ROW LEVEL SECURITY;

-- Admin (login) = akses penuh
DROP POLICY IF EXISTS "authenticated_all_pasien" ON pasien;
CREATE POLICY "authenticated_all_pasien"
  ON pasien FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_all_rekam_medis" ON rekam_medis;
CREATE POLICY "authenticated_all_rekam_medis"
  ON rekam_medis FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Publik (anon): hanya boleh BACA antrian HARI INI (untuk TV display &
-- penghitung antrian online). Realtime ikut pakai policy ini.
DROP POLICY IF EXISTS "anon_select_today_pasien" ON pasien;
CREATE POLICY "anon_select_today_pasien"
  ON pasien FOR SELECT TO anon
  USING (created_at >= date_trunc('day', now() AT TIME ZONE 'Asia/Jakarta') AT TIME ZONE 'Asia/Jakarta');

-- Batasi KOLOM yang bisa dibaca anon — sembunyikan NIK, alamat, no HP, BPJS.
REVOKE ALL ON pasien FROM anon;
GRANT SELECT (nomor_antrian, nama, status, keluhan, created_at, jenis_kelamin) ON pasien TO anon;
-- anon TIDAK punya INSERT/UPDATE/DELETE langsung — semua lewat RPC di atas.

-- rekam_medis: anon tidak punya akses sama sekali (tak ada policy anon).
REVOKE ALL ON rekam_medis FROM anon;

-- Verifikasi (opsional):
-- SET ROLE anon; SELECT nomor_nik FROM pasien LIMIT 1;  -- harus ERROR/permission denied
-- RESET ROLE;

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
