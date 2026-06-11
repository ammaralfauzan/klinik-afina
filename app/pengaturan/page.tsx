"use client";
import { Settings, Clock } from "lucide-react";

export default function PengaturanPage() {
  return (
    <div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>Pengaturan</h1>
        <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: "4px 0 0" }}>Konfigurasi sistem klinik</p>
      </div>
      <div style={{ background: "var(--bg-card)", borderRadius: "16px", padding: "60px 24px", border: "1px solid var(--border-color)", textAlign: "center", boxShadow: "var(--shadow)" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "16px", position: "relative" }}>
          <Settings size={48} color="#a855f7" strokeWidth={1.2} style={{ animation: "spin 8s linear infinite" }} />
          <div style={{ position: "absolute", top: "-4px", right: "calc(50% - 28px)", width: "10px", height: "10px", borderRadius: "50%", background: "#ec4899", boxShadow: "0 0 8px #ec4899" }} />
        </div>
        <h3 style={{ color: "var(--text-primary)", fontSize: "16px", fontWeight: 700, margin: "0 0 8px" }}>Fitur Segera Hadir</h3>
        <p style={{ color: "var(--text-secondary)", fontSize: "13px", margin: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
          <Clock size={13} /> Pengaturan profil & sistem sedang dikembangkan
        </p>
      </div>
    </div>
  );
}
