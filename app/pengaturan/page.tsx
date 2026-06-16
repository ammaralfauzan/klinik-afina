"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { Settings, Save, CheckCircle2, Clock, Phone, MapPin, User, Building2, Banknote, Calendar, Map } from "lucide-react";
import { useTour } from "../components/AppTour";

type Pengaturan = {
  id: number; nama_klinik: string; alamat: string; telepon: string;
  jam_buka: string; jam_tutup: string; dokter_jaga: string;
  tarif_umum: string; tarif_bpjs: string; tarif_igd: string;
};

const DEFAULTS: Pengaturan = {
  id: 1, nama_klinik: "Klinik & RB Afina", alamat: "", telepon: "",
  jam_buka: "00:00", jam_tutup: "23:59", dokter_jaga: "dr. Umum",
  tarif_umum: "75000", tarif_bpjs: "0", tarif_igd: "150000",
};

const LS_KEY = "klinik_pengaturan";
const JADWAL_KEY = "klinik_jadwal";

const HARI_KEYS = ["senin", "selasa", "rabu", "kamis", "jumat", "sabtu", "minggu"];
const HARI_LABELS = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];

function loadLocal(): Partial<Pengaturan> {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || "{}"); } catch { return {}; }
}
function saveLocal(data: Pengaturan) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(data)); } catch { /* noop */ }
}
function fmtRupiah(v: string) {
  const n = parseInt(v.replace(/\D/g, "")) || 0;
  return n > 0 ? "Rp " + n.toLocaleString("id-ID") : "";
}

export default function PengaturanPage() {
  const { startTour, active: tourActive } = useTour();
  const [form, setForm] = useState<Pengaturan>({ ...DEFAULTS, ...loadLocal() });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
  const [useDB, setUseDB] = useState<boolean | null>(null);
  const [jadwal, setJadwal] = useState<Record<string, string>>({});

  // Try to load from Supabase; fall back to localStorage silently
  useEffect(() => {
    supabase.from("pengaturan").select("*").eq("id", 1).single().then(({ data, error }) => {
      if (data && !error) {
        setForm(f => ({ ...f, ...data }));
        setUseDB(true);
      } else {
        setUseDB(false);
        setForm(f => ({ ...f, ...loadLocal() }));
      }
    });
    try {
      const saved = JSON.parse(localStorage.getItem(JADWAL_KEY) || "{}");
      setJadwal(saved);
    } catch { /* noop */ }
  }, []);

  async function handleSave() {
    setLoading(true); setStatus("idle");
    saveLocal(form); // always save locally
    try { localStorage.setItem(JADWAL_KEY, JSON.stringify(jadwal)); } catch { /* noop */ }

    if (useDB) {
      const { error } = await supabase.from("pengaturan")
        .upsert({ ...form, updated_at: new Date().toISOString() }).eq("id", 1);
      if (error) {
        // fallback: only local was saved
        saveLocal(form);
      }
    }
    setLoading(false); setStatus("saved");
    setTimeout(() => setStatus("idle"), 3000);
  }

  const generalFields = [
    { key: "nama_klinik", label: "Nama Klinik", icon: Building2, placeholder: "Klinik & RB Afina", type: "text" },
    { key: "alamat", label: "Alamat", icon: MapPin, placeholder: "Jl. Contoh No. 1, Kota", type: "text" },
    { key: "telepon", label: "Nomor Telepon", icon: Phone, placeholder: "08xx-xxxx-xxxx", type: "text" },
    { key: "dokter_jaga", label: "Dokter / Bidan Jaga", icon: User, placeholder: "Nama dokter atau bidan", type: "text" },
    { key: "jam_buka", label: "Jam Buka", icon: Clock, placeholder: "08:00", type: "time" },
    { key: "jam_tutup", label: "Jam Tutup", icon: Clock, placeholder: "17:00", type: "time" },
  ] as const;

  const tarifFields = [
    { key: "tarif_umum", label: "Tarif Pasien Umum", placeholder: "75000" },
    { key: "tarif_bpjs", label: "Tarif Pasien BPJS", placeholder: "0" },
    { key: "tarif_igd", label: "Tarif IGD / Emergency", placeholder: "150000" },
  ] as const;

  return (
    <div>
      <style>{`
        .form-input { width: 100%; background: var(--input-bg, #F0EFFF); border: 1px solid var(--border-color); border-radius: 10px; padding: 11px 14px 11px 40px; font-size: 13px; color: var(--text-primary); outline: none; transition: all 0.2s; box-sizing: border-box; font-family: inherit; }
        .form-input-plain { padding-left: 14px; }
        .form-input::placeholder { color: var(--text-secondary); }
        .form-input:focus { border-color: var(--accent); background: var(--bg-card); }
        .save-btn { transition: all 0.2s; }
        .save-btn:hover:not(:disabled) { transform: translateY(-1px); opacity: 0.92; }
        .save-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        input[type="time"]::-webkit-calendar-picker-indicator { filter: invert(0.6) sepia(1) saturate(3) hue-rotate(240deg); cursor: pointer; }
        .jadwal-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 12px; }
        @media (max-width: 900px) { .jadwal-grid { grid-template-columns: repeat(4, 1fr); } }
        @media (max-width: 480px) { .jadwal-grid { grid-template-columns: repeat(3, 1fr); } }
        .section-title { font-size: 12px; font-weight: 800; color: var(--accent); text-transform: uppercase; letter-spacing: 0.08em; margin: 0 0 16px; display: flex; align-items: center; gap: 8px; }
        @media (max-width: 640px) { .form-grid { grid-template-columns: 1fr !important; } }
      `}</style>

      <div style={{ marginBottom: "28px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>Pengaturan</h1>
          <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: "4px 0 0" }}>
            Konfigurasi profil dan operasional klinik
            {useDB === false && <span style={{ color: "#d97706", marginLeft: "8px" }}>· Tersimpan lokal</span>}
          </p>
        </div>
        <Settings size={28} color="#7B61FF" strokeWidth={1.5} style={{ animation: "spin-slow 10s linear infinite" }} />
      </div>

      {status === "saved" && (
        <div style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: "12px", padding: "14px 18px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
          <CheckCircle2 size={16} color="#059669" />
          <span style={{ fontSize: "13px", color: "#059669", fontWeight: 600 }}>
            Pengaturan berhasil disimpan{useDB ? " ke database" : " (lokal)"}!
          </span>
        </div>
      )}

      {/* Info Klinik */}
      <div style={{ background: "var(--bg-card)", borderRadius: "16px", padding: "24px", border: "1px solid var(--border-color)", boxShadow: "var(--shadow)", marginBottom: "20px" }}>
        <p className="section-title"><Building2 size={13} /> Informasi Klinik</p>
        <div className="form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
          {generalFields.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.key}>
                <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: "8px" }}>{f.label}</label>
                <div style={{ position: "relative" }}>
                  <div style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", display: "flex" }}>
                    <Icon size={15} color="#7B61FF" strokeWidth={1.8} />
                  </div>
                  <input className="form-input" type={f.type} placeholder={f.placeholder} value={form[f.key] || ""} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tarif */}
      <div style={{ background: "var(--bg-card)", borderRadius: "16px", padding: "24px", border: "1px solid var(--border-color)", boxShadow: "var(--shadow)", marginBottom: "24px" }}>
        <p className="section-title"><Banknote size={13} /> Tarif Default (dipakai sebagai preset di Kasir)</p>
        <div className="form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "20px" }}>
          {tarifFields.map(f => (
            <div key={f.key}>
              <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: "8px" }}>{f.label}</label>
              <input
                className="form-input form-input-plain"
                type="text" inputMode="numeric"
                placeholder={f.placeholder}
                value={form[f.key] || ""}
                onChange={(e) => setForm({ ...form, [f.key]: e.target.value.replace(/\D/g, "") })}
              />
              {form[f.key] && (
                <p style={{ fontSize: "11px", color: "var(--text-secondary)", margin: "4px 0 0" }}>{fmtRupiah(form[f.key])}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Jadwal Dokter per Hari */}
      <div style={{ background: "var(--bg-card)", borderRadius: "16px", padding: "24px", border: "1px solid var(--border-color)", boxShadow: "var(--shadow)", marginBottom: "24px" }}>
        <p className="section-title"><Calendar size={13} /> Jadwal Dokter per Hari</p>
        <div className="jadwal-grid">
          {HARI_KEYS.map((key, i) => (
            <div key={key}>
              <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: "7px" }}>{HARI_LABELS[i]}</label>
              <input
                className="form-input form-input-plain"
                placeholder="Nama dokter"
                value={jadwal[key] || ""}
                onChange={e => setJadwal(j => ({ ...j, [key]: e.target.value }))}
              />
            </div>
          ))}
        </div>
        <p style={{ fontSize: "11px", color: "var(--text-secondary)", margin: "12px 0 0" }}>
          Jadwal ini akan ditampilkan di Dashboard sebagai &quot;Dokter Jaga Hari Ini&quot;. Kosongkan jika klinik tutup/off di hari tersebut.
        </p>
      </div>

      {/* Panduan Aplikasi */}
      <div style={{ background: "var(--bg-card)", borderRadius: "16px", padding: "24px", border: "1px solid var(--border-color)", boxShadow: "var(--shadow)", marginBottom: "24px" }}>
        <p className="section-title"><Map size={13} /> Panduan Aplikasi</p>
        <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: "0 0 16px", lineHeight: 1.6 }}>
          Mulai tur interaktif untuk mengenal fitur-fitur utama aplikasi manajemen klinik ini.
        </p>
        <button
          onClick={startTour}
          disabled={tourActive}
          style={{
            background: "linear-gradient(135deg, #7B61FF, #9B8AFF)",
            border: "none", borderRadius: "12px", padding: "12px 24px",
            color: "#fff", fontSize: "13px", fontWeight: 700,
            cursor: tourActive ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", gap: "8px",
            opacity: tourActive ? 0.6 : 1, transition: "all 0.2s",
          }}
        >
          <Map size={15} />
          {tourActive ? "Tur sedang berjalan..." : "Mulai Tur Aplikasi"}
        </button>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button className="save-btn" onClick={handleSave} disabled={loading}
          style={{ background: "linear-gradient(135deg, #7B61FF, #9B8AFF)", border: "none", borderRadius: "12px", padding: "13px 28px", color: "#fff", fontSize: "14px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}>
          <Save size={16} />
          {loading ? "Menyimpan..." : "Simpan Pengaturan"}
        </button>
      </div>
    </div>
  );
}
