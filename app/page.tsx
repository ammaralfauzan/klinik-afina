"use client";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { Users, Clock, Stethoscope, CheckCircle } from "lucide-react";

type Pasien = {
  nama: string;
  keluhan: string;
  status: string;
  nomor_antrian: number;
};

const stats = (list: Pasien[]) => [
  { label: "Pasien Hari Ini", value: list.length, icon: Users, color: "#f472b6", border: "rgba(244,114,182,0.3)", bg: "rgba(244,114,182,0.08)" },
  { label: "Antrian Menunggu", value: list.filter(p => p.status === "Menunggu").length, icon: Clock, color: "#a78bfa", border: "rgba(167,139,250,0.3)", bg: "rgba(167,139,250,0.08)" },
  { label: "Sedang Diperiksa", value: list.filter(p => p.status === "Sedang Diperiksa").length, icon: Stethoscope, color: "#38bdf8", border: "rgba(56,189,248,0.3)", bg: "rgba(56,189,248,0.08)" },
  { label: "Selesai", value: list.filter(p => p.status === "Selesai").length, icon: CheckCircle, color: "#4ade80", border: "rgba(74,222,128,0.3)", bg: "rgba(74,222,128,0.08)" },
];

export default function Home() {
  const [pasienList, setPasienList] = useState<Pasien[]>([]);

  useEffect(() => {
    fetchPasien();
    const channel = supabase.channel("realtime-pasien")
      .on("postgres_changes", { event: "*", schema: "public", table: "pasien" }, fetchPasien)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  async function fetchPasien() {
    const { data } = await supabase.from("pasien").select("*").order("nomor_antrian", { ascending: true });
    if (data) setPasienList(data);
  }

  return (
    <div>
      <style>{`
        @keyframes icon-pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.15); opacity: 0.8; }
        }
        .stat-icon { animation: icon-pulse 2.5s ease-in-out infinite; }
        .stat-icon:nth-child(1) { animation-delay: 0s; }
        .stat-icon:nth-child(2) { animation-delay: 0.5s; }
        .stat-icon:nth-child(3) { animation-delay: 1s; }
        .stat-icon:nth-child(4) { animation-delay: 1.5s; }
        .table-row:hover { background: rgba(168,85,247,0.06) !important; }
      `}</style>

      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 800, color: "#f1e6ff", margin: 0, letterSpacing: "-0.01em" }}>Dashboard</h1>
        <p style={{ fontSize: "13px", color: "#6b7280", margin: "4px 0 0" }}>Ringkasan aktivitas klinik hari ini</p>
      </div>

      {/* Stat Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "24px" }}>
        {stats(pasienList).map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} style={{
              background: s.bg, borderRadius: "16px", padding: "22px",
              border: `1px solid ${s.border}`,
              boxShadow: `0 4px 20px ${s.border}`,
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                <div className="stat-icon" style={{ display: "flex" }}>
                  <Icon size={22} color={s.color} strokeWidth={1.8} />
                </div>
                <span style={{ fontSize: "10px", fontWeight: 700, color: s.color, letterSpacing: "0.08em", textTransform: "uppercase", opacity: 0.8 }}>Hari ini</span>
              </div>
              <p style={{ fontSize: "36px", fontWeight: 900, color: "#f1e6ff", margin: 0, lineHeight: 1 }}>{s.value}</p>
              <p style={{ fontSize: "12px", color: "#9ca3af", margin: "8px 0 0", fontWeight: 500 }}>{s.label}</p>
            </div>
          );
        })}
      </div>

      {/* Table */}
      <div style={{
        background: "rgba(255,255,255,0.03)", borderRadius: "16px", padding: "24px",
        border: "1px solid rgba(168,85,247,0.15)",
        boxShadow: "0 4px 24px rgba(0,0,0,0.3)"
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
          <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#e9d5ff", margin: 0 }}>Antrian Pasien</h3>
          <span style={{
            fontSize: "11px", background: "linear-gradient(135deg, #ec4899, #a855f7)",
            color: "#fff", padding: "4px 14px", borderRadius: "20px", fontWeight: 700,
            boxShadow: "0 0 12px rgba(236,72,153,0.3)"
          }}>{pasienList.length} Pasien</span>
        </div>

        {pasienList.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px", color: "#4b5563" }}>
            <Users size={40} color="#374151" strokeWidth={1} style={{ margin: "0 auto 12px" }} />
            <p style={{ fontSize: "14px" }}>Belum ada pasien hari ini</p>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(168,85,247,0.2)" }}>
                {["No", "Nama Pasien", "Keluhan", "Status"].map(h => (
                  <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: "11px", fontWeight: 700, color: "#7c3aed", textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pasienList.map((p, i) => (
                <tr key={p.nomor_antrian} className="table-row" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", transition: "background 0.15s" }}>
                  <td style={{ padding: "14px 16px", fontWeight: 700, color: "#a855f7" }}>{p.nomor_antrian}</td>
                  <td style={{ padding: "14px 16px", fontWeight: 600, color: "#f1e6ff" }}>{p.nama}</td>
                  <td style={{ padding: "14px 16px", color: "#9ca3af" }}>{p.keluhan}</td>
                  <td style={{ padding: "14px 16px" }}>
                    <span style={{
                      padding: "5px 14px", borderRadius: "20px", fontSize: "11px", fontWeight: 700,
                      background: p.status === "Selesai" ? "rgba(74,222,128,0.12)" : p.status === "Sedang Diperiksa" ? "rgba(56,189,248,0.12)" : "rgba(251,191,36,0.12)",
                      color: p.status === "Selesai" ? "#4ade80" : p.status === "Sedang Diperiksa" ? "#38bdf8" : "#fbbf24",
                      border: `1px solid ${p.status === "Selesai" ? "rgba(74,222,128,0.3)" : p.status === "Sedang Diperiksa" ? "rgba(56,189,248,0.3)" : "rgba(251,191,36,0.3)"}`,
                    }}>{p.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
