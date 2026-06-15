"use client";
import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { UserPlus, CheckCircle2 } from "lucide-react";

export default function PasienPage() {
  const [form, setForm] = useState({ nama: "", keluhan: "" });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit() {
    setLoading(true); setSuccess(false);
    const { data: lastData } = await supabase.from("pasien").select("nomor_antrian").order("nomor_antrian", { ascending: false }).limit(1);
    const nomorBaru = lastData && lastData.length > 0 ? lastData[0].nomor_antrian + 1 : 1;
    const { error } = await supabase.from("pasien").insert([{ nama: form.nama, keluhan: form.keluhan, status: "Menunggu", nomor_antrian: nomorBaru, created_at: new Date().toISOString() }]);
    setLoading(false);
    if (!error) { setSuccess(true); setForm({ nama: "", keluhan: "" }); }
  }

  return (
    <div>
      <style>{`
        .form-input {
          width: 100%; background: var(--input-bg, rgba(168,85,247,0.05));
          border: 1px solid var(--border-color); border-radius: 10px;
          padding: 11px 14px; font-size: 13px; color: var(--text-primary);
          outline: none; transition: all 0.2s; box-sizing: border-box;
        }
        .form-input::placeholder { color: var(--text-secondary); }
        .form-input:focus { border-color: rgba(168,85,247,0.6); }
        .submit-btn { transition: all 0.2s; }
        .submit-btn:hover:not(:disabled) { transform: translateY(-1px); }
        .submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }
      `}</style>

      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>Registrasi Pasien</h1>
        <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: "4px 0 0" }}>Daftarkan pasien baru ke antrian</p>
      </div>

      <div style={{ maxWidth: "520px" }}>
        {success && (
          <div style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: "12px", padding: "14px 18px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
            <CheckCircle2 size={16} color="#059669" />
            <span style={{ fontSize: "13px", color: "#059669", fontWeight: 600 }}>Pasien berhasil didaftarkan!</span>
          </div>
        )}
        <div style={{ background: "var(--bg-card)", borderRadius: "16px", padding: "28px", border: "1px solid var(--border-color)", boxShadow: "var(--shadow)", display: "flex", flexDirection: "column", gap: "20px" }}>
          <div>
            <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: "8px" }}>Nama Pasien</label>
            <input className="form-input" placeholder="Masukkan nama lengkap pasien" value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} />
          </div>
          <div>
            <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: "8px" }}>Keluhan</label>
            <textarea className="form-input" placeholder="Deskripsikan keluhan pasien" rows={4} value={form.keluhan} onChange={(e) => setForm({ ...form, keluhan: e.target.value })} style={{ resize: "none" }} />
          </div>
          <button className="submit-btn" onClick={handleSubmit} disabled={loading || !form.nama || !form.keluhan} style={{ background: "linear-gradient(135deg, #ec4899, #a855f7)", border: "none", borderRadius: "12px", padding: "13px", color: "#fff", fontSize: "14px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
            <UserPlus size={16} />
            {loading ? "Mendaftarkan..." : "Daftarkan Pasien"}
          </button>
        </div>
      </div>
    </div>
  );
}
