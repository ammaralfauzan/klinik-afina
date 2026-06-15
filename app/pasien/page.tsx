"use client";
import { useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";
import { UserPlus, CheckCircle2, ClipboardList } from "lucide-react";

export default function PasienPage() {
  const [form, setForm] = useState({
    nama: "",
    keluhan: "",
    tanggal_lahir: "",
    jenis_kelamin: "Laki-laki",
    alamat: "",
    no_hp: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit() {
    setLoading(true); setSuccess(false);
    const { data: lastData } = await supabase.from("pasien").select("nomor_antrian").order("nomor_antrian", { ascending: false }).limit(1);
    const nomorBaru = lastData && lastData.length > 0 ? lastData[0].nomor_antrian + 1 : 1;
    const { error } = await supabase.from("pasien").insert([{
      nama: form.nama,
      keluhan: form.keluhan,
      tanggal_lahir: form.tanggal_lahir || null,
      jenis_kelamin: form.jenis_kelamin,
      alamat: form.alamat,
      no_hp: form.no_hp,
      status: "Menunggu",
      nomor_antrian: nomorBaru,
      created_at: new Date().toISOString(),
    }]);
    setLoading(false);
    if (!error) {
      setSuccess(true);
      setForm({ nama: "", keluhan: "", tanggal_lahir: "", jenis_kelamin: "Laki-laki", alamat: "", no_hp: "" });
    }
  }

  return (
    <div>
      <style>{`
        .form-input {
          width: 100%; background: var(--input-bg, #F0EFFF);
          border: 1px solid var(--border-color); border-radius: 10px;
          padding: 11px 14px; font-size: 13px; color: var(--text-primary);
          outline: none; transition: all 0.2s; box-sizing: border-box;
          font-family: inherit;
        }
        .form-input::placeholder { color: var(--text-secondary); }
        .form-input:focus { border-color: var(--accent); background: var(--bg-card); }
        .submit-btn { transition: all 0.2s; }
        .submit-btn:hover:not(:disabled) { transform: translateY(-1px); }
        .submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .form-full { grid-column: 1 / -1; }
        @media (max-width: 640px) { .form-grid { grid-template-columns: 1fr; } .form-full { grid-column: 1; } }
      `}</style>

      <div style={{ marginBottom: "28px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>Registrasi Pasien</h1>
          <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: "4px 0 0" }}>Daftarkan pasien baru ke antrian</p>
        </div>
        <Link href="/pasien/daftar" style={{
          display: "inline-flex", alignItems: "center", gap: "7px",
          background: "var(--input-bg)", border: "1px solid var(--border-color)",
          borderRadius: "10px", padding: "9px 16px", fontSize: "13px",
          color: "var(--accent)", fontWeight: 600, textDecoration: "none", transition: "all 0.2s",
        }}>
          <ClipboardList size={14} />
          Lihat Daftar Pasien →
        </Link>
      </div>

      <div style={{ maxWidth: "680px" }}>
        {success && (
          <div style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: "12px", padding: "14px 18px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
            <CheckCircle2 size={16} color="#059669" />
            <span style={{ fontSize: "13px", color: "#059669", fontWeight: 600 }}>Pasien berhasil didaftarkan!</span>
          </div>
        )}
        <div style={{ background: "var(--bg-card)", borderRadius: "16px", padding: "28px", border: "1px solid var(--border-color)", boxShadow: "var(--shadow)" }}>
          <div className="form-grid">
            {/* Nama Pasien */}
            <div>
              <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: "8px" }}>Nama Pasien</label>
              <input className="form-input" placeholder="Masukkan nama lengkap" value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} />
            </div>

            {/* Tanggal Lahir */}
            <div>
              <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: "8px" }}>Tanggal Lahir</label>
              <input className="form-input" type="date" value={form.tanggal_lahir} onChange={(e) => setForm({ ...form, tanggal_lahir: e.target.value })} />
            </div>

            {/* Jenis Kelamin */}
            <div>
              <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: "8px" }}>Jenis Kelamin</label>
              <select
                className="form-input"
                value={form.jenis_kelamin}
                onChange={(e) => setForm({ ...form, jenis_kelamin: e.target.value })}
                style={{ background: "var(--bg-card)", color: "var(--text-primary)", cursor: "pointer" }}
              >
                <option value="Laki-laki">Laki-laki</option>
                <option value="Perempuan">Perempuan</option>
              </select>
            </div>

            {/* No. HP */}
            <div>
              <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: "8px" }}>No. HP</label>
              <input className="form-input" type="tel" placeholder="08xx-xxxx-xxxx" value={form.no_hp} onChange={(e) => setForm({ ...form, no_hp: e.target.value })} />
            </div>

            {/* Alamat */}
            <div className="form-full">
              <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: "8px" }}>Alamat</label>
              <textarea className="form-input" placeholder="Masukkan alamat lengkap" rows={3} value={form.alamat} onChange={(e) => setForm({ ...form, alamat: e.target.value })} style={{ resize: "none" }} />
            </div>

            {/* Keluhan */}
            <div className="form-full">
              <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: "8px" }}>Keluhan</label>
              <textarea className="form-input" placeholder="Deskripsikan keluhan pasien" rows={4} value={form.keluhan} onChange={(e) => setForm({ ...form, keluhan: e.target.value })} style={{ resize: "none" }} />
            </div>

            {/* Submit */}
            <div className="form-full">
              <button className="submit-btn" onClick={handleSubmit} disabled={loading || !form.nama || !form.keluhan || !form.no_hp || !form.alamat} style={{ background: "var(--accent)", border: "none", borderRadius: "12px", padding: "13px", color: "#fff", fontSize: "14px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", width: "100%" }}>
                <UserPlus size={16} />
                {loading ? "Mendaftarkan..." : "Daftarkan Pasien"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
