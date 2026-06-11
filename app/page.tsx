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

  const stats = [
    { label: "Pasien Hari Ini", value: pasienList.length, icon: Users, color: "#ec4899", border: "rgba(236,72,153,0.3)", bg: "rgba(236,72,153,0.08)" },
    { label: "Antrian Menunggu", value: pasienList.filter(p => p.status === "Menunggu").length, icon: Clock, color: "#a855f7", border: "rgba(168,85,247,0.3)", bg: "rgba(168,85,247,0.08)" },
    { label: "Sedang Diperiksa", value: pasienList.filter(p => p.status === "Sedang Diperiksa").length, icon: Stethoscope, color: "#0ea5e9", border: "rgba(14,165,233,0.3)", bg: "rgba(14,165,233,0.08)" },
    { label: "Selesai", value: pasienList.filter(p => p.status === "Selesai").length, icon: CheckCircle, color: "#10b981", border: "rgba(16,185,129,0.3)", bg: "rgba(16,185,129,0.08)" },
  ];

  return (
    <div>
      <style>{`
        @keyframes icon-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.15); }
        }
        .stat-icon { animation: icon-pulse 2.5s ease-in-out infinite; }
        .table-row:hover { background: var(--table-hover) !important; }
      `}</style>

      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>Dashboard</h1>
        <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: "4px 0 0" }}>Ringkasan aktivitas klinik hari ini</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px", marginBottom: "24px" }}>
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={s.label} style={{
              background: s.bg, borderRadius: "16px", padding: "22px",
              border: `1px solid ${s.border}`, boxShadow: `0 4px 20px ${s.border}`,
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                <span className="stat-icon" style={{ display: "flex", animationDelay: `${i * 0.4}s` }}>
                  <Icon size={22} color={s.color} strokeWidth={1.8} />
                </span>
                <span style={{ fontSize: "10px", fontWeight: 700, color: s.color, letterSpacing: "0.08em", textTransform: "uppercase" }}>Hari ini</span>
              </div>
              <p style={{ fontSize: "36px", fontWeight: 900, color: s.color, margin: 0, lineHeight: 1 }}>{s.value}</p>
              <p style={{ fontSize: "12px", color: "var(--text-primary)", margin: "8px 0 0", fontWeight: 600, opacity: 0.8 }}>{s.label}</p>
            </div>
          );
        })}
      </div>

      <div style={{
        background: "var(--bg-card)", borderRadius: "16px", padding: "24px",
        border: "1px solid var(--border-color)", boxShadow: "var(--shadow)"
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
          <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>Antrian Pasien</h3>
          <span style={{
            fontSize: "11px", background: "linear-gradient(135deg, #ec4899, #a855f7)",
            color: "#fff", padding: "4px 14px", borderRadius: "20px", fontWeight: 700,
            boxShadow: "0 0 12px rgba(236,72,153,0.3)"
          }}>{pasienList.length} Pasien</span>
        </div>
        {pasienList.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px", color: "var(--text-secondary)" }}>
            <Users size={40} color="var(--text-secondary)" strokeWidth={1} style={{ margin: "0 auto 12px", display: "block" }} />
            <p style={{ fontSize: "14px" }}>Belum ada pasien hari ini</p>
          </div>
        ) : (
          <div className="table-wrapper"><table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <div className="table-wrapper">
  <table ...>
  ...
  </table>
</div>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-color)", background: "var(--table-header-bg)" }}>
                {["No", "Nama Pasien", "Keluhan", "Status"].map(h => (
                  <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: "11px", fontWeight: 700, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pasienList.map((p) => (
                <tr key={p.nomor_antrian} className="table-row" style={{ borderBottom: "1px solid var(--border-color)", transition: "background 0.15s" }}>
                  <td style={{ padding: "14px 16px", fontWeight: 700, color: "var(--accent)" }}>{p.nomor_antrian}</td>
                  <td style={{ padding: "14px 16px", fontWeight: 600, color: "var(--text-primary)" }}>{p.nama}</td>
                  <td style={{ padding: "14px 16px", color: "var(--text-secondary)" }}>{p.keluhan}</td>
                  <td style={{ padding: "14px 16px" }}>
                    <span style={{
                      padding: "5px 14px", borderRadius: "20px", fontSize: "11px", fontWeight: 700,
                      background: p.status === "Selesai" ? "rgba(16,185,129,0.12)" : p.status === "Sedang Diperiksa" ? "rgba(14,165,233,0.12)" : "rgba(245,158,11,0.12)",
                      color: p.status === "Selesai" ? "#059669" : p.status === "Sedang Diperiksa" ? "#0284c7" : "#d97706",
                      border: `1px solid ${p.status === "Selesai" ? "rgba(16,185,129,0.3)" : p.status === "Sedang Diperiksa" ? "rgba(14,165,233,0.3)" : "rgba(245,158,11,0.3)"}`,
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
