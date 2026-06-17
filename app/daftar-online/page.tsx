"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { getTodayRange } from "../../lib/utils";
import { validateNoHp, validateNIK, validateNomorBPJS, normalizeName } from "../../lib/validation";
import {
  CheckCircle, Clock, Users, ChevronRight,
  Phone, User, Calendar, AlertCircle, Share2, CreditCard, Pencil,
} from "lucide-react";

const KELUHAN_CHIPS = [
  "Demam", "Batuk & Pilek", "Sakit Kepala", "Sakit Perut / Mual",
  "Diare", "Sesak Napas", "Nyeri Dada", "Nyeri Sendi / Otot",
  "Luka / Cedera", "Alergi / Gatal-gatal", "Kontrol Rutin", "Imunisasi / Vaksin",
  "Pemeriksaan Kehamilan", "Lainnya",
];

type Step = "form" | "submitting" | "success";

type ExistingReg = {
  nomor_antrian: number;
  status: string;
  nama: string;
  keluhan: string;
  no_hp: string;
  jenis_pembayaran: string;
  nomor_bpjs: string;
  nama_asuransi: string;
};

function padNo(n: number) { return String(n).padStart(3, "0"); }

function formatHP(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 13);
  if (digits.length <= 4) return digits;
  if (digits.length <= 8) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  return `${digits.slice(0, 4)}-${digits.slice(4, 8)}-${digits.slice(8)}`;
}

const COOLDOWN_SECS = 30;

export default function DaftarOnlinePage() {
  const [step, setStep]               = useState<Step>("form");
  const [menunggu, setMenunggu]       = useState(0);
  const [nomorTerakhir, setNomorTerakhir] = useState(0);
  const [error, setError]             = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [cooldown, setCooldown]       = useState(0);
  const [editMode, setEditMode]       = useState(false);
  const [existingReg, setExistingReg] = useState<ExistingReg | null>(null);
  const [successType, setSuccessType] = useState<"baru" | "edit">("baru");

  const [form, setForm] = useState({
    nama: "", no_hp: "", nomor_nik: "",
    tanggal_lahir: "", jenis_kelamin: "Perempuan",
    keluhan: "", keluhan_custom: "",
    jenis_pembayaran: "Umum", nomor_bpjs: "", nama_asuransi: "",
  });
  const [result, setResult] = useState<{ nomor: number; nama: string } | null>(null);

  useEffect(() => {
    fetchStatus();
    const channel = supabase
      .channel("online-daftar-status")
      .on("postgres_changes", { event: "*", schema: "public", table: "pasien" }, fetchStatus)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  async function fetchStatus() {
    const { start, end } = getTodayRange();
    const { data } = await supabase
      .from("pasien")
      .select("nomor_antrian, status")
      .gte("created_at", start)
      .lte("created_at", end)
      .order("nomor_antrian", { ascending: false });
    if (data) {
      setNomorTerakhir(data[0]?.nomor_antrian || 0);
      setMenunggu(data.filter(p => p.status === "Menunggu").length);
    }
  }

  function runValidation(): Record<string, string> {
    const errs: Record<string, string> = {};
    if (!form.nama.trim()) errs.nama = "Nama wajib diisi";
    else if (form.nama.trim().length < 3) errs.nama = "Nama minimal 3 karakter";

    if (!form.tanggal_lahir) {
      errs.tanggal_lahir = "Tanggal lahir wajib diisi untuk verifikasi NIK";
    } else if (new Date(form.tanggal_lahir) > new Date()) {
      errs.tanggal_lahir = "Tanggal lahir tidak boleh di masa depan";
    }

    const nikErr = validateNIK(form.nomor_nik, form.tanggal_lahir);
    if (nikErr) errs.nomor_nik = nikErr;

    const hpErr = validateNoHp(form.no_hp);
    if (hpErr) errs.no_hp = hpErr;

    const keluhanFinal = form.keluhan === "Lainnya" ? form.keluhan_custom.trim() : form.keluhan;
    if (!keluhanFinal) errs.keluhan = "Pilih keluhan utama";
    if (form.keluhan === "Lainnya" && !form.keluhan_custom.trim()) errs.keluhan_custom = "Deskripsikan keluhan Anda";

    if (form.jenis_pembayaran === "BPJS") {
      const bpjsErr = validateNomorBPJS(form.nomor_bpjs);
      if (bpjsErr) errs.nomor_bpjs = bpjsErr;
    }
    if (form.jenis_pembayaran === "Asuransi Swasta" && !form.nama_asuransi.trim()) {
      errs.nama_asuransi = "Nama asuransi & nomor polis wajib diisi";
    }

    return errs;
  }

  function runEditValidation(): Record<string, string> {
    const errs: Record<string, string> = {};
    const hpErr = validateNoHp(form.no_hp);
    if (hpErr) errs.no_hp = hpErr;
    const keluhanFinal = form.keluhan === "Lainnya" ? form.keluhan_custom.trim() : form.keluhan;
    if (!keluhanFinal) errs.keluhan = "Pilih keluhan utama";
    if (form.keluhan === "Lainnya" && !form.keluhan_custom.trim()) errs.keluhan_custom = "Deskripsikan keluhan Anda";
    if (form.jenis_pembayaran === "BPJS") {
      const bpjsErr = validateNomorBPJS(form.nomor_bpjs);
      if (bpjsErr) errs.nomor_bpjs = bpjsErr;
    }
    if (form.jenis_pembayaran === "Asuransi Swasta" && !form.nama_asuransi.trim()) {
      errs.nama_asuransi = "Nama asuransi & nomor polis wajib diisi";
    }
    return errs;
  }

  async function handleSubmit() {
    const errs = runValidation();
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      setError("Mohon periksa kembali data yang diisi.");
      return;
    }
    setFieldErrors({});
    setError("");
    setStep("submitting");

    const { start, end } = getTodayRange();
    const nikClean = form.nomor_nik.replace(/\D/g, "");

    // Dedup: 1 NIK per hari — cek apakah sudah ada pendaftaran
    const { data: dupNIK } = await supabase
      .from("pasien")
      .select("nomor_antrian, status, nama, keluhan, no_hp, jenis_pembayaran, nomor_bpjs, nama_asuransi")
      .eq("nomor_nik", nikClean)
      .gte("created_at", start)
      .lte("created_at", end)
      .limit(1);

    if (dupNIK && dupNIK.length > 0) {
      const existing = dupNIK[0] as ExistingReg;
      if (existing.status !== "Menunggu") {
        // Sudah dipanggil/selesai — tidak bisa edit
        setError(
          `NIK ini sudah terdaftar hari ini — No. Antrian ${padNo(existing.nomor_antrian)} ` +
          `(status: ${existing.status}). Hubungi petugas klinik jika ada kesalahan.`
        );
        setStep("form");
        return;
      }
      // Masih menunggu — tawarkan edit
      setExistingReg(existing);
      setEditMode(true);
      setForm(f => ({
        ...f,
        nama: existing.nama,
        keluhan: KELUHAN_CHIPS.includes(existing.keluhan) ? existing.keluhan : "Lainnya",
        keluhan_custom: KELUHAN_CHIPS.includes(existing.keluhan) ? "" : existing.keluhan,
        no_hp: formatHP(existing.no_hp),
        jenis_pembayaran: (existing.jenis_pembayaran || "Umum") as "Umum" | "BPJS" | "Asuransi Swasta",
        nomor_bpjs: existing.nomor_bpjs || "",
        nama_asuransi: existing.nama_asuransi || "",
      }));
      setFieldErrors({});
      setError("");
      setStep("form");
      return;
    }

    // Belum ada — daftar baru
    const keluhanFinal = form.keluhan === "Lainnya" ? form.keluhan_custom.trim() : form.keluhan;

    const { data: todayData } = await supabase
      .from("pasien")
      .select("nomor_antrian")
      .gte("created_at", start)
      .lte("created_at", end)
      .order("nomor_antrian", { ascending: false })
      .limit(1);
    const nomorFallback = (todayData?.[0]?.nomor_antrian || 0) + 1;

    const payload = {
      nama:             normalizeName(form.nama),
      no_hp:            form.no_hp.replace(/\D/g, ""),
      nomor_nik:        nikClean,
      tanggal_lahir:    form.tanggal_lahir || null,
      jenis_kelamin:    form.jenis_kelamin,
      keluhan:          keluhanFinal,
      status:           "Menunggu",
      jenis_pembayaran: form.jenis_pembayaran,
      nomor_bpjs:       form.jenis_pembayaran === "BPJS" ? form.nomor_bpjs.replace(/\D/g, "") : "",
      nama_asuransi:    form.jenis_pembayaran === "Asuransi Swasta" ? form.nama_asuransi.trim() : "",
      nomor_rm:         "",
    };

    let nomor = nomorFallback;
    let err: { message: string; code?: string } | null = null;

    const { data: rpcRow, error: rpcErr } = await supabase.rpc("daftar_pasien", {
      data: { ...payload, day_start: start, day_end: end },
    });

    if (rpcErr) {
      const fnMissing = rpcErr.code === "PGRST202" || /function .*does not exist/i.test(rpcErr.message || "");
      if (fnMissing) {
        const ins = await supabase.from("pasien").insert([{ ...payload, nomor_antrian: nomorFallback }]);
        err = ins.error;
      } else {
        err = rpcErr;
      }
    } else if (rpcRow && typeof (rpcRow as { nomor_antrian?: number }).nomor_antrian === "number") {
      nomor = (rpcRow as { nomor_antrian: number }).nomor_antrian;
    }

    if (err) {
      setError("Gagal mendaftar, coba lagi: " + err.message);
      setStep("form");
    } else {
      setResult({ nomor, nama: form.nama.trim() });
      setSuccessType("baru");
      setStep("success");
      setCooldown(COOLDOWN_SECS);
      fetchStatus();
    }
  }

  async function handleUpdate() {
    if (!existingReg) return;
    const errs = runEditValidation();
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      setError("Mohon periksa kembali data yang diisi.");
      return;
    }
    setFieldErrors({});
    setError("");
    setStep("submitting");

    const { start, end } = getTodayRange();
    const keluhanFinal = form.keluhan === "Lainnya" ? form.keluhan_custom.trim() : form.keluhan;

    // Gunakan RPC SECURITY DEFINER agar anon bisa update baris miliknya
    const { data: rpcResult, error: rpcErr } = await supabase.rpc("edit_pendaftaran", {
      p_nomor_nik:        form.nomor_nik.replace(/\D/g, ""),
      p_nomor_antrian:    existingReg.nomor_antrian,
      p_keluhan:          keluhanFinal,
      p_no_hp:            form.no_hp.replace(/\D/g, ""),
      p_jenis_pembayaran: form.jenis_pembayaran,
      p_nomor_bpjs:       form.jenis_pembayaran === "BPJS" ? form.nomor_bpjs.replace(/\D/g, "") : "",
      p_nama_asuransi:    form.jenis_pembayaran === "Asuransi Swasta" ? form.nama_asuransi.trim() : "",
      p_day_start:        start,
      p_day_end:          end,
    });

    const rpcError = (rpcResult as { error?: string } | null)?.error;
    if (rpcErr || rpcError) {
      setError("Gagal memperbarui: " + (rpcErr?.message || rpcError || "Data tidak ditemukan"));
      setStep("form");
    } else {
      setResult({ nomor: existingReg.nomor_antrian, nama: existingReg.nama });
      setSuccessType("edit");
      setStep("success");
      setEditMode(false);
      setExistingReg(null);
      fetchStatus();
    }
  }

  function shareWA() {
    if (!result) return;
    const msg =
      `Halo, saya ${result.nama} sudah mendaftar online di Klinik & RB Afina.\n` +
      `📋 No. Antrian: *${padNo(result.nomor)}*\n\nSaya akan segera datang ke klinik.`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
  }

  function daftarLagi() {
    setForm({ nama: "", no_hp: "", nomor_nik: "", tanggal_lahir: "", jenis_kelamin: "Perempuan", keluhan: "", keluhan_custom: "", jenis_pembayaran: "Umum", nomor_bpjs: "", nama_asuransi: "" });
    setFieldErrors({});
    setError("");
    setResult(null);
    setEditMode(false);
    setExistingReg(null);
    setStep("form");
  }

  function clearErr(field: string) {
    setFieldErrors(fe => { const next = { ...fe }; delete next[field]; return next; });
  }

  function FieldErr({ field }: { field: string }) {
    const msg = fieldErrors[field];
    if (!msg) return null;
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "5px", marginTop: "5px" }}>
        <AlertCircle size={11} color="#ef4444" />
        <span style={{ fontSize: "11px", color: "#ef4444", fontWeight: 500 }}>{msg}</span>
      </div>
    );
  }

  const isDisabled = step === "submitting" || cooldown > 0;
  const lockedStyle: React.CSSProperties = { background: "#F0F0F0", color: "#999", cursor: "not-allowed" };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(160deg, #1A1A2E 0%, #2D1B69 60%, #1A1A2E 100%)",
      display: "flex", flexDirection: "column", alignItems: "center",
      padding: "20px 16px 40px",
    }}>
      <style>{`
        * { box-sizing: border-box; }
        .dol-card { background: rgba(255,255,255,0.97); border-radius: 20px; padding: 28px 24px; width: 100%; max-width: 480px; box-shadow: 0 20px 60px rgba(0,0,0,0.35); }
        .dol-input { width: 100%; background: #F5F4FF; border: 1.5px solid #E0DFFF; border-radius: 12px; padding: 12px 16px 12px 42px; font-size: 14px; color: #1A1A2E; outline: none; transition: border 0.2s; font-family: inherit; }
        .dol-input:focus:not([readonly]) { border-color: #7B61FF; background: #fff; }
        .dol-input::placeholder { color: #aaa; }
        .dol-input-plain { padding-left: 16px; }
        .dol-input.err { border-color: #ef4444; background: rgba(239,68,68,0.04); }
        .dol-label { font-size: 11px; font-weight: 700; color: #7B61FF; text-transform: uppercase; letter-spacing: 0.07em; display: block; margin-bottom: 7px; }
        .dol-chip { border: 1.5px solid #E0DFFF; background: #F8F7FF; border-radius: 20px; padding: 7px 14px; font-size: 12px; font-weight: 600; color: #555; cursor: pointer; transition: all 0.15s; font-family: inherit; }
        .dol-chip:hover { border-color: #7B61FF; color: #7B61FF; background: #EDE9FF; }
        .dol-chip.active { border-color: #7B61FF; background: #7B61FF; color: #fff; }
        .dol-chip.keluhan-err { border-color: #ef4444; }
        .dol-submit { width: 100%; background: linear-gradient(135deg, #7B61FF, #9B8AFF); border: none; border-radius: 14px; padding: 15px; font-size: 15px; font-weight: 700; color: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.2s; margin-top: 8px; font-family: inherit; }
        .dol-submit:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(123,97,255,0.45); }
        .dol-submit:disabled { opacity: 0.65; cursor: not-allowed; transform: none !important; box-shadow: none !important; }
        .dol-submit.edit-mode { background: linear-gradient(135deg, #059669, #10b981); }
        .dol-submit.edit-mode:hover:not(:disabled) { box-shadow: 0 6px 20px rgba(16,185,129,0.45); }
        .gender-btn { flex: 1; border: 1.5px solid #E0DFFF; background: #F8F7FF; border-radius: 10px; padding: 10px; font-size: 13px; font-weight: 600; color: #555; cursor: pointer; transition: all 0.15s; font-family: inherit; }
        .gender-btn.active { border-color: #7B61FF; background: #EDE9FF; color: #7B61FF; }
        @keyframes popIn { from { opacity: 0; transform: scale(0.85); } to { opacity: 1; transform: scale(1); } }
        .pop-in { animation: popIn 0.5s cubic-bezier(0.34,1.56,0.64,1); }
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 0.8s linear infinite; }
        .cdbar { height: 3px; background: #E0DFFF; border-radius: 2px; overflow: hidden; margin-top: 8px; }
        .cdbar-fill { height: 100%; background: #7B61FF; transition: width 1s linear; border-radius: 2px; }
      `}</style>

      {/* Brand header */}
      <div style={{ textAlign: "center", marginBottom: "24px", marginTop: "16px" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "14px", background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px" }}>🏥</div>
          <div style={{ textAlign: "left" }}>
            <p style={{ fontSize: "18px", fontWeight: 800, color: "#fff", margin: 0 }}>Klinik &amp; RB Afina</p>
            <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.6)", margin: 0 }}>Pendaftaran Antrian Online</p>
          </div>
        </div>
      </div>

      {/* Status bar */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px", width: "100%", maxWidth: "480px" }}>
        <div style={{ flex: 1, background: "rgba(255,255,255,0.1)", borderRadius: "12px", padding: "12px 16px", display: "flex", alignItems: "center", gap: "8px" }}>
          <Clock size={15} color="rgba(255,255,255,0.7)" />
          <div>
            <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.6)", margin: 0, textTransform: "uppercase", letterSpacing: "0.06em" }}>Menunggu</p>
            <p style={{ fontSize: "18px", fontWeight: 800, color: "#fff", margin: 0 }}>{menunggu}</p>
          </div>
        </div>
        <div style={{ flex: 1, background: "rgba(255,255,255,0.1)", borderRadius: "12px", padding: "12px 16px", display: "flex", alignItems: "center", gap: "8px" }}>
          <Users size={15} color="rgba(255,255,255,0.7)" />
          <div>
            <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.6)", margin: 0, textTransform: "uppercase", letterSpacing: "0.06em" }}>No. Terakhir</p>
            <p style={{ fontSize: "18px", fontWeight: 800, color: "#fff", margin: 0 }}>{nomorTerakhir > 0 ? padNo(nomorTerakhir) : "—"}</p>
          </div>
        </div>
      </div>

      {/* Success screen */}
      {step === "success" && result && (
        <div className="dol-card pop-in">
          <div style={{ textAlign: "center", padding: "8px 0 20px" }}>
            <div style={{ width: "72px", height: "72px", borderRadius: "50%", background: "rgba(16,185,129,0.1)", border: "2px solid rgba(16,185,129,0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <CheckCircle size={36} color="#10b981" strokeWidth={1.5} />
            </div>
            <p style={{ fontSize: "14px", color: "#6b7280", margin: "0 0 4px" }}>
              {successType === "edit" ? "Pendaftaran Diperbarui!" : "Pendaftaran Berhasil!"}
            </p>
            <p style={{ fontSize: "28px", fontWeight: 800, color: "#1A1A2E", margin: "0 0 4px" }}>{result.nama}</p>
            <p style={{ fontSize: "13px", color: "#6b7280", margin: 0 }}>Nomor Antrian Anda</p>
          </div>

          <div style={{ background: "linear-gradient(135deg, #7B61FF, #9B8AFF)", borderRadius: "16px", padding: "24px", textAlign: "center", marginBottom: "20px" }}>
            <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.7)", margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.08em" }}>No. Antrian</p>
            <p style={{ fontSize: "72px", fontWeight: 900, color: "#fff", margin: 0, lineHeight: 1, letterSpacing: "-2px" }}>{padNo(result.nomor)}</p>
          </div>

          <div style={{ background: "#FFF9ED", border: "1px solid #FDE68A", borderRadius: "12px", padding: "14px 16px", marginBottom: "20px", display: "flex", alignItems: "flex-start", gap: "10px" }}>
            <AlertCircle size={15} color="#d97706" style={{ flexShrink: 0, marginTop: 1 }} />
            <p style={{ fontSize: "12px", color: "#92400e", margin: 0, lineHeight: 1.5 }}>
              {successType === "edit"
                ? "Data pendaftaran Anda telah diperbarui. Nomor antrian tidak berubah."
                : "Silakan datang ke klinik dan tunjukkan nomor antrian ini kepada petugas. Antrian hangus jika tidak hadir."}
            </p>
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <button onClick={shareWA} style={{ flex: 1, background: "#25D366", border: "none", borderRadius: "12px", padding: "13px", color: "#fff", fontSize: "13px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "7px", fontFamily: "inherit" }}>
              <Share2 size={14} /> Bagikan ke WA
            </button>
            <button
              onClick={daftarLagi}
              disabled={cooldown > 0}
              style={{ flex: 1, background: "#F5F4FF", border: "1.5px solid #E0DFFF", borderRadius: "12px", padding: "13px", color: cooldown > 0 ? "#aaa" : "#7B61FF", fontSize: "13px", fontWeight: 700, cursor: cooldown > 0 ? "not-allowed" : "pointer", fontFamily: "inherit" }}
            >
              {cooldown > 0 ? `Tunggu ${cooldown}d` : "Daftar Lagi"}
            </button>
          </div>
          {cooldown > 0 && (
            <div className="cdbar">
              <div className="cdbar-fill" style={{ width: `${(cooldown / COOLDOWN_SECS) * 100}%` }} />
            </div>
          )}
        </div>
      )}

      {/* Form */}
      {(step === "form" || step === "submitting") && (
        <div className="dol-card">
          <h2 style={{ fontSize: "18px", fontWeight: 800, color: "#1A1A2E", margin: "0 0 4px" }}>
            {editMode ? "Edit Pendaftaran" : "Formulir Pendaftaran"}
          </h2>
          <p style={{ fontSize: "12px", color: "#888", margin: "0 0 20px" }}>
            {editMode && existingReg
              ? `No. Antrian ${padNo(existingReg.nomor_antrian)} — ubah data yang perlu diperbaiki`
              : "Data diverifikasi menggunakan NIK — 1 antrian per orang per hari"}
          </p>

          {/* Edit mode banner */}
          {editMode && existingReg && (
            <div style={{ background: "#EDE9FF", border: "1px solid #C4B5FD", borderRadius: "10px", padding: "10px 14px", marginBottom: "16px", display: "flex", alignItems: "flex-start", gap: "8px" }}>
              <Pencil size={14} color="#7B61FF" style={{ flexShrink: 0, marginTop: 2 }} />
              <p style={{ fontSize: "12px", color: "#5B21B6", margin: 0, lineHeight: 1.6 }}>
                <strong>Mode Edit</strong> — Nama, NIK, dan tanggal lahir tidak dapat diubah.
                Nomor antrian tetap <strong>{padNo(existingReg.nomor_antrian)}</strong>.
              </p>
            </div>
          )}

          {error && (
            <div style={{ background: "#FEE2E2", border: "1px solid #FCA5A5", borderRadius: "10px", padding: "10px 14px", marginBottom: "16px", display: "flex", alignItems: "flex-start", gap: "8px" }}>
              <AlertCircle size={14} color="#ef4444" style={{ flexShrink: 0, marginTop: 1 }} />
              <p style={{ fontSize: "13px", color: "#dc2626", margin: 0, lineHeight: 1.5 }}>{error}</p>
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

            {/* Nama */}
            <div>
              <label className="dol-label">
                Nama Lengkap *
                {editMode && <span style={{ fontWeight: 400, color: "#aaa", marginLeft: 6, textTransform: "none", letterSpacing: 0 }}>🔒</span>}
              </label>
              <div style={{ position: "relative" }}>
                <User size={15} color="#aaa" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                <input
                  className={`dol-input${fieldErrors.nama ? " err" : ""}`}
                  placeholder="Nama sesuai KTP"
                  value={form.nama}
                  readOnly={editMode}
                  style={editMode ? lockedStyle : undefined}
                  onChange={e => { if (!editMode) { setForm(f => ({ ...f, nama: e.target.value })); clearErr("nama"); } }}
                />
              </div>
              <FieldErr field="nama" />
            </div>

            {/* Tanggal Lahir */}
            <div>
              <label className="dol-label">
                Tanggal Lahir *{" "}
                {editMode
                  ? <span style={{ fontWeight: 400, color: "#aaa", textTransform: "none", letterSpacing: 0 }}>🔒</span>
                  : <span style={{ fontSize: "10px", fontWeight: 500, color: "#999", textTransform: "none", letterSpacing: 0 }}>(wajib untuk verifikasi NIK)</span>
                }
              </label>
              <div style={{ position: "relative" }}>
                <Calendar size={15} color="#aaa" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                <input
                  className={`dol-input${fieldErrors.tanggal_lahir ? " err" : ""}`}
                  type="date"
                  max={new Date().toISOString().split("T")[0]}
                  value={form.tanggal_lahir}
                  readOnly={editMode}
                  style={editMode ? lockedStyle : undefined}
                  onChange={e => {
                    if (editMode) return;
                    setForm(f => ({ ...f, tanggal_lahir: e.target.value }));
                    clearErr("tanggal_lahir");
                    clearErr("nomor_nik");
                  }}
                />
              </div>
              <FieldErr field="tanggal_lahir" />
            </div>

            {/* NIK */}
            <div>
              <label className="dol-label">
                NIK (Nomor KTP) *
                {editMode && <span style={{ fontWeight: 400, color: "#aaa", marginLeft: 6, textTransform: "none", letterSpacing: 0 }}>🔒</span>}
              </label>
              <div style={{ position: "relative" }}>
                <CreditCard size={15} color="#aaa" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                <input
                  className={`dol-input${fieldErrors.nomor_nik ? " err" : ""}`}
                  placeholder="Masukkan NIK yang sesuai"
                  inputMode="numeric"
                  maxLength={16}
                  value={form.nomor_nik}
                  readOnly={editMode}
                  style={editMode ? lockedStyle : undefined}
                  onChange={e => {
                    if (editMode) return;
                    const v = e.target.value.replace(/\D/g, "").slice(0, 16);
                    setForm(f => ({ ...f, nomor_nik: v }));
                    clearErr("nomor_nik");
                  }}
                />
              </div>
              <FieldErr field="nomor_nik" />
              {!editMode && (
                <p style={{ fontSize: "10px", color: "#aaa", margin: "4px 0 0" }}>
                  Anak &lt; 17 tahun: gunakan NIK dari Kartu Keluarga (KK), atau NIK orang tua
                </p>
              )}
            </div>

            {/* No HP */}
            <div>
              <label className="dol-label">Nomor HP / WA *</label>
              <div style={{ position: "relative" }}>
                <Phone size={15} color="#aaa" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                <input
                  className={`dol-input${fieldErrors.no_hp ? " err" : ""}`}
                  type="tel"
                  placeholder="08xx-xxxx-xxxx"
                  value={form.no_hp}
                  onChange={e => { setForm(f => ({ ...f, no_hp: formatHP(e.target.value) })); clearErr("no_hp"); }}
                />
              </div>
              <FieldErr field="no_hp" />
            </div>

            {/* Jenis Kelamin — sembunyikan di edit mode (tidak perlu diubah) */}
            {!editMode && (
              <div>
                <label className="dol-label">Jenis Kelamin</label>
                <div style={{ display: "flex", gap: "8px" }}>
                  {(["Laki-laki", "Perempuan"] as const).map(g => (
                    <button
                      key={g}
                      className={`gender-btn${form.jenis_kelamin === g ? " active" : ""}`}
                      onClick={() => setForm(f => ({ ...f, jenis_kelamin: g }))}
                    >
                      {g === "Laki-laki" ? "👨 Laki-laki" : "👩 Perempuan"}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Keluhan */}
            <div>
              <label className="dol-label">Keluhan Utama *</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "7px" }}>
                {KELUHAN_CHIPS.map(k => (
                  <button
                    key={k}
                    className={`dol-chip${form.keluhan === k ? " active" : ""}${fieldErrors.keluhan && !form.keluhan ? " keluhan-err" : ""}`}
                    onClick={() => { setForm(f => ({ ...f, keluhan: k })); clearErr("keluhan"); }}
                  >
                    {k}
                  </button>
                ))}
              </div>
              <FieldErr field="keluhan" />
              {form.keluhan === "Lainnya" && (
                <>
                  <input
                    className={`dol-input dol-input-plain${fieldErrors.keluhan_custom ? " err" : ""}`}
                    placeholder="Ceritakan keluhan Anda..."
                    value={form.keluhan_custom}
                    onChange={e => { setForm(f => ({ ...f, keluhan_custom: e.target.value })); clearErr("keluhan_custom"); }}
                    style={{ marginTop: "10px" }}
                  />
                  <FieldErr field="keluhan_custom" />
                </>
              )}
            </div>

            {/* Jenis Pembayaran */}
            <div>
              <label className="dol-label">Jenis Pembayaran</label>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {(["Umum", "BPJS", "Asuransi Swasta"] as const).map(opt => (
                  <button
                    key={opt}
                    className="gender-btn"
                    style={{
                      flex: "none",
                      borderColor: form.jenis_pembayaran === opt ? "#7B61FF" : "#E0DFFF",
                      background: form.jenis_pembayaran === opt ? "#EDE9FF" : "#F8F7FF",
                      color: form.jenis_pembayaran === opt ? "#7B61FF" : "#555",
                    }}
                    onClick={() => { setForm(f => ({ ...f, jenis_pembayaran: opt, nomor_bpjs: "", nama_asuransi: "" })); clearErr("nomor_bpjs"); clearErr("nama_asuransi"); }}
                  >
                    {opt === "Umum" ? "👤 Umum" : opt === "BPJS" ? "🏥 BPJS" : "📋 Asuransi Swasta"}
                  </button>
                ))}
              </div>

              {form.jenis_pembayaran === "BPJS" && (
                <div style={{ marginTop: "10px" }}>
                  <input
                    className={`dol-input dol-input-plain${fieldErrors.nomor_bpjs ? " err" : ""}`}
                    placeholder="Masukkan Nomor BPJS yang sesuai"
                    inputMode="numeric"
                    maxLength={13}
                    value={form.nomor_bpjs}
                    onChange={e => { setForm(f => ({ ...f, nomor_bpjs: e.target.value.replace(/\D/g, "").slice(0, 13) })); clearErr("nomor_bpjs"); }}
                  />
                  <FieldErr field="nomor_bpjs" />
                </div>
              )}

              {form.jenis_pembayaran === "Asuransi Swasta" && (
                <div style={{ marginTop: "10px" }}>
                  <input
                    className={`dol-input dol-input-plain${fieldErrors.nama_asuransi ? " err" : ""}`}
                    placeholder="Contoh: Prudential - POL123456789"
                    value={form.nama_asuransi}
                    onChange={e => { setForm(f => ({ ...f, nama_asuransi: e.target.value })); clearErr("nama_asuransi"); }}
                  />
                  <FieldErr field="nama_asuransi" />
                </div>
              )}
            </div>

          </div>

          <button
            className={`dol-submit${editMode ? " edit-mode" : ""}`}
            onClick={editMode ? handleUpdate : handleSubmit}
            disabled={isDisabled}
          >
            {step === "submitting" ? (
              <>
                <span className="spin" style={{ width: "16px", height: "16px", border: "2.5px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", display: "inline-block" }} />
                {editMode ? "Memperbarui..." : "Mendaftarkan..."}
              </>
            ) : cooldown > 0 ? (
              `Tunggu ${cooldown} detik...`
            ) : editMode ? (
              <>Perbarui Pendaftaran <ChevronRight size={16} /></>
            ) : (
              <>Ambil Nomor Antrian <ChevronRight size={16} /></>
            )}
          </button>

          {cooldown > 0 && (
            <div className="cdbar">
              <div className="cdbar-fill" style={{ width: `${(cooldown / COOLDOWN_SECS) * 100}%` }} />
            </div>
          )}

          {editMode && (
            <button
              onClick={daftarLagi}
              style={{ width: "100%", background: "none", border: "none", color: "#aaa", fontSize: "12px", marginTop: "10px", cursor: "pointer", fontFamily: "inherit", padding: "4px" }}
            >
              Batal edit
            </button>
          )}

          <p style={{ fontSize: "11px", color: "#aaa", textAlign: "center", margin: "12px 0 0", lineHeight: 1.5 }}>
            Data disimpan untuk keperluan rekam medis dan tidak dibagikan ke pihak lain.
          </p>
        </div>
      )}

      <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)", marginTop: "24px", textAlign: "center" }}>
        Klinik &amp; RB Afina · Sistem Antrian Online
      </p>
    </div>
  );
}
