"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { Settings, Save, CheckCircle2, Clock, Phone, MapPin, User, Building2 } from "lucide-react";

type Pengaturan = {
  id: number;
  nama_klinik: string;
  alamat: string;
  telepon: string;
  jam_buka: string;
  jam_tutup: string;
  dokter_jaga: string;
};

export default function PengaturanPage() {
  const [form, setForm] = useState<Pengaturan>({ id: 1, nama_klinik: "", alamat: "", telepon: "", jam_buka: "", jam_tutup: "", dokter_jaga: "" });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    supabase.from("pengaturan").select("*").eq("id", 1).single().then(({ data }) => {
      if (data) setForm(data);
    });
  }, []);

  async function handleSave() {
    setLoading(true); setSaved(false);
    await supabase.from("pengaturan").update({ ...form, updated_at: new Date().toISOString() }).eq("id", 1);
    setLoading(false); setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  const fields = [
    { key: "nama_klinik", label: "Nama Klinik", icon: Building2, placeholder: "Klinik Afina", type: "text" },
    { key: "alamat", label: "Alamat", icon: MapPin, placeholder: "Jl. Contoh No. 1, Kota", type: "text" },
    { key: "telepon", label: "Nomor Telepon", icon: Phone, placeholder: "08xx-xxxx-xxxx", type: "text" },
    { key: "dokter_jaga", label: "Dokter / Bidan Jaga", icon: User, placeholder: "Nama dokter atau bidan", type: "text" },
    { key: "jam_buka", label: "Jam Buka", icon: Clock, placeholder: "08:00", type: "time" },
    { key: "jam_tutup", label: "Jam Tutup", icon: Clock, placeholder: "17:00", type: "time" },
  ];

  return (
    <div>
      <style>{`
        .form-input {
          width: 100%; background: var(--input-bg, rgba(168,85,247,0.05));
          border: 1px solid var(--border-color); border-radius: 10px;
          padding: 11px 14px 11px 40px; font-size: 13px; color: var(--text-primary);
          outline: none; transition: all 0.2s; box-sizing: border-box;
        }
        .form-input::placeholder { color: var(--text-secondary); }
        .form-input:focus { border-color: rgba(168,85,247,0.6); box-shadow: 0 0 0 3px rgba(168,85,247,0.1); }
        .save-btn { transition: all 0.2s; }
        .save-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(168,85,247,0.35); }
        .save-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        input[type="time"]::-webkit-calendar-picker-indicator { filter: invert(0.6) sepia(1) saturate(3) hue-rotate(240deg); cursor: pointer; }
        @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>

      <div style={{ marginBottom: "28px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>Pengaturan</h1>
          <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: "4px 0 0" }}>Konfigurasi profil dan operasional klinik</p>
        </div>
        <Settings size={28} color="#a855f7" strokeWidth={1.5} style={{ animation: "spin-slow 10s linear infinite" }} />
      </div>

      {saved && (
        <div style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: "12px", padding: "14px 18px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
          <CheckCircle2 size={16} color="#059669" />
          <span style={{ fontSize: "13px", color: "#059669", fontWeight: 600 }}>Pengaturan berhasil disimpan!</span>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
        {fields.map((f) => {
          const Icon = f.icon;
          return (
            <div key={f.key}>
              <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: "8px" }}>
                {f.label}
              </label>
              <div style={{ position: "relative" }}>
                <div style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", display: "flex" }}>
                  <Icon size={15} color="#a855f7" strokeWidth={1.8} />
                </div>
                <input
                  className="form-input"
                  type={f.type}
                  placeholder={f.placeholder}
                  value={(form as any)[f.key] || ""}
                  onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: "28px", display: "flex", justifyContent: "flex-end" }}>
        <button className="save-btn" onClick={handleSave} disabled={loading} style={{
          background: "linear-gradient(135deg, #a855f7, #ec4899)",
          border: "none", borderRadius: "12px", padding: "13px 28px",
          color: "#fff", fontSize: "14px", fontWeight: 700, cursor: "pointer",
          display: "flex", alignItems: "center", gap: "8px",
          boxShadow: "0 4px 16px rgba(168,85,247,0.25)"
        }}>
          <Save size={16} />
          {loading ? "Menyimpan..." : "Simpan Pengaturan"}
        </button>
      </div>
    </div>
  );
}
