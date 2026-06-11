"use client";
import { BarChart3, Clock } from "lucide-react";

export default function LaporanPage() {
  return (
    <div>
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 800, color: "#f1e6ff", margin: 0 }}>Laporan</h1>
        <p style={{ fontSize: "13px", color: "#6b7280", margin: "4px 0 0" }}>Statistik dan laporan aktivitas klinik</p>
      </div>
      <div style={{
        background: "rgba(255,255,255,0.03)", borderRadius: "16px", padding: "60px 24px",
        border: "1px solid rgba(168,85,247,0.15)", textAlign: "center",
        boxShadow: "0 4px 24px rgba(0,0,0,0.3)"
      }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "16px" }}>
          <div style={{ position: "relative" }}>
            <BarChart3 size={48} color="#a855f7" strokeWidth={1.2} />
            <div style={{ position: "absolute", top: "-4px", right: "-4px", width: "12px", height: "12px", borderRadius: "50%", background: "#ec4899", boxShadow: "0 0 8px #ec4899" }} />
          </div>
        </div>
        <h3 style={{ color: "#e9d5ff", fontSize: "16px", fontWeight: 700, margin: "0 0 8px" }}>Fitur Segera Hadir</h3>
        <p style={{ color: "#6b7280", fontSize: "13px", margin: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
          <Clock size={13} /> Laporan kunjungan & statistik pasien sedang dalam pengembangan
        </p>
      </div>
    </div>
  );
}
