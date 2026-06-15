"use client";
import { useState, useCallback } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";
import { UserPlus, ClipboardList, CheckCircle2, AlertCircle, X } from "lucide-react";

const KELUHAN_OPTIONS = [
  "Demam",
  "Batuk & Pilek",
  "Sakit Kepala",
  "Mual & Muntah",
  "Diare",
  "Kontrol Kehamilan",
  "Imunisasi",
  "KB",
  "PAP Smear",
  "Persalinan",
  "Lainnya",
];

type FormState = {
  nama: string;
  tanggal_lahir: string;
  jenis_kelamin: string;
  no_hp: string;
  alamat: string;
  keluhan: string;
  keluhan_lainnya: string;
};

type Errors = Partial<Record<keyof FormState, string>>;

const INITIAL_FORM: FormState = {
  nama: "",
  tanggal_lahir: "",
  jenis_kelamin: "Laki-laki",
  no_hp: "",
  alamat: "",
  keluhan: "",
  keluhan_lainnya: "",
};

function formatHP(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 13);
  if (digits.length <= 4) return digits;
  if (digits.length <= 8) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  return `${digits.slice(0, 4)}-${digits.slice(4, 8)}-${digits.slice(8)}`;
}

function validate(form: FormState): Errors {
  const errs: Errors = {};
  const namaClean = form.nama.trim();
  if (!namaClean) {
    errs.nama = "Nama wajib diisi.";
  } else if (namaClean.length < 3) {
    errs.nama = "Nama minimal 3 karakter.";
  } else if (!/^[a-zA-Z\s'.,-]+$/.test(namaClean)) {
    errs.nama = "Nama hanya boleh berisi huruf dan spasi.";
  }

  if (!form.tanggal_lahir) {
    errs.tanggal_lahir = "Tanggal lahir wajib diisi.";
  } else if (new Date(form.tanggal_lahir) > new Date()) {
    errs.tanggal_lahir = "Tanggal lahir tidak boleh di masa depan.";
  }

  const digits = form.no_hp.replace(/\D/g, "");
  if (!form.no_hp) {
    errs.no_hp = "No HP wajib diisi.";
  } else if (digits.length < 10) {
    errs.no_hp = "No HP minimal 10 digit.";
  } else if (digits.length > 13) {
    errs.no_hp = "No HP maksimal 13 digit.";
  }

  if (!form.alamat.trim()) {
    errs.alamat = "Alamat wajib diisi.";
  } else if (form.alamat.trim().length < 10) {
    errs.alamat = "Alamat minimal 10 karakter.";
  }

  if (!form.keluhan) {
    errs.keluhan = "Keluhan wajib dipilih.";
  } else if (form.keluhan === "Lainnya" && !form.keluhan_lainnya.trim()) {
    errs.keluhan_lainnya = "Mohon deskripsikan keluhan Anda.";
  }

  return errs;
}

export default function PasienPage() {
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [errors, setErrors] = useState<Errors>({});
  const [touched, setTouched] = useState<Partial<Record<keyof FormState, boolean>>>({});
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const showToast = useCallback((type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 5000);
  }, []);

  function touch(field: keyof FormState) {
    setTouched((t) => ({ ...t, [field]: true }));
    const errs = validate({ ...form });
    setErrors(errs);
  }

  function updateField<K extends keyof FormState>(field: K, value: FormState[K]) {
    const next = { ...form, [field]: value };
    setForm(next);
    if (touched[field]) {
      setErrors(validate(next));
    }
  }

  function handleHPChange(raw: string) {
    const formatted = formatHP(raw);
    updateField("no_hp", formatted);
  }

  const keluhanFinal = form.keluhan === "Lainnya"
    ? form.keluhan_lainnya.trim()
    : form.keluhan;

  const currentErrors = validate(form);
  const isValid = Object.keys(currentErrors).length === 0;

  async function handleSubmit() {
    // Touch all fields to show errors
    const allTouched: Partial<Record<keyof FormState, boolean>> = {};
    (Object.keys(INITIAL_FORM) as (keyof FormState)[]).forEach((k) => { allTouched[k] = true; });
    setTouched(allTouched);
    const errs = validate(form);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    try {
      const { data: lastData, error: seqError } = await supabase
        .from("pasien")
        .select("nomor_antrian")
        .order("nomor_antrian", { ascending: false })
        .limit(1);

      if (seqError) {
        console.error("[pasien] seq error:", seqError);
        showToast("error", `Gagal mengambil nomor antrian: ${seqError.message}`);
        return;
      }

      const nomorBaru = lastData && lastData.length > 0 ? lastData[0].nomor_antrian + 1 : 1;

      const payload = {
        nama: form.nama.trim(),
        keluhan: keluhanFinal,
        tanggal_lahir: form.tanggal_lahir,
        jenis_kelamin: form.jenis_kelamin,
        alamat: form.alamat.trim(),
        no_hp: form.no_hp.replace(/\D/g, ""),
        status: "Menunggu",
        nomor_antrian: nomorBaru,
        created_at: new Date().toISOString(),
      };

      console.log("[pasien] inserting:", payload);

      const { error } = await supabase.from("pasien").insert([payload]);

      if (error) {
        console.error("[pasien] insert error:", error);
        showToast("error", `Gagal menyimpan: ${error.message}`);
      } else {
        showToast("success", `Pasien ${form.nama.trim()} berhasil didaftarkan! (Antrian #${nomorBaru})`);
        setForm(INITIAL_FORM);
        setErrors({});
        setTouched({});
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <style>{`
        .form-input {
          width: 100%; background: var(--input-bg, #F0EFFF);
          border: 1px solid var(--border-color); border-radius: 10px;
          padding: 11px 14px; font-size: 13px; color: var(--text-primary);
          outline: none; transition: border 0.2s, background 0.2s;
          box-sizing: border-box; font-family: inherit; appearance: none;
        }
        .form-input::placeholder { color: var(--text-secondary); }
        .form-input:focus { border-color: var(--accent); background: var(--bg-card); }
        .form-input.has-error { border-color: #ef4444; background: rgba(239,68,68,0.04); }
        .submit-btn { transition: opacity 0.2s, transform 0.2s; }
        .submit-btn:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
        .submit-btn:disabled { opacity: 0.45; cursor: not-allowed; }
        .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .form-full { grid-column: 1 / -1; }
        .field-error { font-size: 11px; color: #ef4444; margin-top: 5px; display: flex; align-items: center; gap: 4px; }
        .keluhan-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
        .keluhan-option {
          display: flex; align-items: center; justify-content: center; text-align: center;
          padding: 10px 8px; border-radius: 10px; border: 1.5px solid var(--border-color);
          font-size: 12px; font-weight: 500; color: var(--text-secondary);
          cursor: pointer; transition: all 0.18s; background: var(--input-bg);
          user-select: none; line-height: 1.3;
        }
        .keluhan-option:hover { border-color: var(--accent); color: var(--accent); }
        .keluhan-option.selected {
          border-color: var(--accent); background: rgba(108,92,231,0.08);
          color: var(--accent); font-weight: 700;
        }
        .keluhan-option.has-error { border-color: #ef4444; }
        @media (max-width: 640px) {
          .form-grid { grid-template-columns: 1fr; }
          .form-full { grid-column: 1; }
          .keluhan-grid { grid-template-columns: repeat(2, 1fr); }
        }
        /* Toast */
        .toast-bar {
          position: fixed; top: 20px; right: 20px; z-index: 9999;
          border-radius: 12px; padding: 14px 18px; min-width: 280px; max-width: 380px;
          display: flex; align-items: flex-start; gap: 12px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.12);
          animation: slideInRight 0.28s ease;
        }
        .toast-bar.success { background: #fff; border-left: 4px solid #10b981; }
        .toast-bar.error { background: #fff; border-left: 4px solid #ef4444; }
        @keyframes slideInRight { from { opacity: 0; transform: translateX(60px); } to { opacity: 1; transform: translateX(0); } }
      `}</style>

      {/* Toast */}
      {toast && (
        <div className={`toast-bar ${toast.type}`}>
          {toast.type === "success"
            ? <CheckCircle2 size={18} color="#10b981" style={{ flexShrink: 0, marginTop: "1px" }} />
            : <AlertCircle size={18} color="#ef4444" style={{ flexShrink: 0, marginTop: "1px" }} />
          }
          <span style={{ fontSize: "13px", fontWeight: 500, color: "#1A1A2E", flex: 1, lineHeight: 1.5 }}>{toast.msg}</span>
          <button onClick={() => setToast(null)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", flexShrink: 0 }}>
            <X size={15} color="#8B8FA8" />
          </button>
        </div>
      )}

      {/* Page header */}
      <div style={{ marginBottom: "28px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>Registrasi Pasien</h1>
          <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: "4px 0 0" }}>Daftarkan pasien baru ke antrian</p>
        </div>
        <Link href="/pasien/daftar" style={{
          display: "inline-flex", alignItems: "center", gap: "7px",
          background: "var(--input-bg)", border: "1px solid var(--border-color)",
          borderRadius: "10px", padding: "9px 16px", fontSize: "13px",
          color: "var(--accent)", fontWeight: 600, textDecoration: "none",
        }}>
          <ClipboardList size={14} />
          Lihat Daftar Pasien →
        </Link>
      </div>

      <div style={{ maxWidth: "700px" }}>
        <div style={{ background: "var(--bg-card)", borderRadius: "16px", padding: "28px", border: "1px solid var(--border-color)", boxShadow: "var(--shadow)" }}>
          <div className="form-grid">

            {/* Nama */}
            <div>
              <label style={labelStyle}>Nama Pasien <Req /></label>
              <input
                className={`form-input${touched.nama && errors.nama ? " has-error" : ""}`}
                placeholder="Masukkan nama lengkap"
                value={form.nama}
                onChange={(e) => updateField("nama", e.target.value)}
                onBlur={() => touch("nama")}
              />
              <FieldError msg={touched.nama ? errors.nama : undefined} />
            </div>

            {/* Tanggal Lahir */}
            <div>
              <label style={labelStyle}>Tanggal Lahir <Req /></label>
              <input
                className={`form-input${touched.tanggal_lahir && errors.tanggal_lahir ? " has-error" : ""}`}
                type="date"
                max={new Date().toISOString().split("T")[0]}
                value={form.tanggal_lahir}
                onChange={(e) => updateField("tanggal_lahir", e.target.value)}
                onBlur={() => touch("tanggal_lahir")}
              />
              <FieldError msg={touched.tanggal_lahir ? errors.tanggal_lahir : undefined} />
            </div>

            {/* Jenis Kelamin */}
            <div>
              <label style={labelStyle}>Jenis Kelamin</label>
              <select
                className="form-input"
                value={form.jenis_kelamin}
                onChange={(e) => updateField("jenis_kelamin", e.target.value)}
                style={{ background: "var(--bg-card)", color: "var(--text-primary)", cursor: "pointer" }}
              >
                <option value="Laki-laki">Laki-laki</option>
                <option value="Perempuan">Perempuan</option>
              </select>
            </div>

            {/* No HP */}
            <div>
              <label style={labelStyle}>No. HP <Req /></label>
              <input
                className={`form-input${touched.no_hp && errors.no_hp ? " has-error" : ""}`}
                type="tel"
                inputMode="numeric"
                placeholder="08xx-xxxx-xxxx"
                value={form.no_hp}
                onChange={(e) => handleHPChange(e.target.value)}
                onBlur={() => touch("no_hp")}
              />
              <FieldError msg={touched.no_hp ? errors.no_hp : undefined} />
            </div>

            {/* Alamat */}
            <div className="form-full">
              <label style={labelStyle}>Alamat <Req /></label>
              <textarea
                className={`form-input${touched.alamat && errors.alamat ? " has-error" : ""}`}
                placeholder="Masukkan alamat lengkap (min. 10 karakter)"
                rows={3}
                value={form.alamat}
                onChange={(e) => updateField("alamat", e.target.value)}
                onBlur={() => touch("alamat")}
                style={{ resize: "none" }}
              />
              <FieldError msg={touched.alamat ? errors.alamat : undefined} />
            </div>

            {/* Keluhan */}
            <div className="form-full">
              <label style={labelStyle}>Keluhan <Req /></label>
              <div className={`keluhan-grid`} style={{ marginBottom: form.keluhan === "Lainnya" ? "10px" : "0" }}>
                {KELUHAN_OPTIONS.map((opt) => (
                  <div
                    key={opt}
                    className={`keluhan-option${form.keluhan === opt ? " selected" : ""}${touched.keluhan && errors.keluhan && !form.keluhan ? " has-error" : ""}`}
                    onClick={() => {
                      updateField("keluhan", opt);
                      setTouched((t) => ({ ...t, keluhan: true }));
                    }}
                  >
                    {opt}
                  </div>
                ))}
              </div>
              <FieldError msg={touched.keluhan ? errors.keluhan : undefined} />

              {form.keluhan === "Lainnya" && (
                <div style={{ marginTop: "10px" }}>
                  <textarea
                    className={`form-input${touched.keluhan_lainnya && errors.keluhan_lainnya ? " has-error" : ""}`}
                    placeholder="Deskripsikan keluhan secara detail..."
                    rows={3}
                    value={form.keluhan_lainnya}
                    onChange={(e) => updateField("keluhan_lainnya", e.target.value)}
                    onBlur={() => touch("keluhan_lainnya")}
                    style={{ resize: "none" }}
                  />
                  <FieldError msg={touched.keluhan_lainnya ? errors.keluhan_lainnya : undefined} />
                </div>
              )}
            </div>

            {/* Submit */}
            <div className="form-full">
              <button
                className="submit-btn"
                onClick={handleSubmit}
                disabled={loading}
                style={{
                  background: "var(--accent)", border: "none", borderRadius: "12px",
                  padding: "13px", color: "#fff", fontSize: "14px", fontWeight: 700,
                  cursor: "pointer", display: "flex", alignItems: "center",
                  justifyContent: "center", gap: "8px", width: "100%",
                }}
              >
                {loading ? (
                  <>
                    <span style={{ width: "16px", height: "16px", border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite", display: "inline-block" }} />
                    Mendaftarkan...
                  </>
                ) : (
                  <>
                    <UserPlus size={16} />
                    Daftarkan Pasien
                  </>
                )}
              </button>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  fontSize: "12px", fontWeight: 700, color: "var(--accent)",
  textTransform: "uppercase", letterSpacing: "0.06em",
  display: "block", marginBottom: "8px",
};

function Req() {
  return <span style={{ color: "#ef4444", marginLeft: "2px" }}>*</span>;
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <p className="field-error">
      <AlertCircle size={11} />
      {msg}
    </p>
  );
}
