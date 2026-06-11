"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { BarChart3, TrendingUp, Users, CheckCircle2, Clock, Activity } from "lucide-react";

type Pasien = { nama: string; keluhan: string; status: string; nomor_antrian: number; created_at: string; };

export default function LaporanPage() {
  const [pasienList, setPasienList] = useState<Pasien[]>([]);

  useEffect(() => {
    supabase.from("pasien").select("*").then(({ data }) => { if (data) setPasienList(data); });
  }, []);

  const total = pasienList.length;
  const selesai = pasienList.filter(p => p.status === "Selesai").length;
  const menunggu = pasienList.filter(p => p.status === "Menunggu").length;
  const diperiksa = pasienList.filter(p => p.status === "Sedang Diperiksa").length;
  const selesaiPct = total > 0 ? Math.round((selesai / total) * 100) : 0;

  const keluhanMap: Record<string, number> = {};
  pasienList.forEach(p => { const k = p.keluhan || "Lainnya"; keluhanMap[k] = (keluhanMap[k] || 0) + 1; });
  const topKeluhan = Object.entries(keluhanMap).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const maxKeluhan = topKeluhan[0]?.[1] || 1;

  const stats = [
    { label: "Total Pasien", value: total, icon: Users, color: "#a855f7", bg: "rgba(168,85,247,0.1)", border: "rgba(168,85,247,0.3)" },
    { label: "Selesai", value: selesai, icon: CheckCircle2, color: "#10b981", bg: "rgba(16,185,129,0.1)", border: "rgba(16,185,129,0.3)" },
    { label: "Menunggu", value: menunggu, icon: Clock, color: "#f59e0b", bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.3)" },
    { label: "Diperiksa", value: diperiksa, icon: Activity, color: "#0ea5e9", bg: "rgba(14,165,233,0.1)", border: "rgba(14,165,233,0.3)" },
  ];

  return (
    <div>
      <style>{`
        @keyframes bar-grow { from { width: 0%; } to { width: var(--tw); } }
        .bar-fill { animation: bar-grow 1s ease-out forwards; }
      `}</style>

      <div style={{ marginBottom: "28px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>Laporan</h1>
          <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: "4px 0 0" }}>Statistik dan laporan aktivitas klinik</p>
        </div>
        <div style={{ background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.3)", borderRadius: "12px", padding: "10px 18px", display: "flex", alignItems: "center", gap: "8px" }}>
          <TrendingUp size={15} color="#a855f7" />
          <span style={{ fontSize: "13px", color: "#a855f7", fontWeight: 600 }}>Tingkat selesai: {selesaiPct}%</span>
        </div>
      </div>

      <div className="laporan-stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "24px" }}>
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} style={{ background: s.bg, borderRadius: "16px", padding: "20px", border: `1px solid ${s.border}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                <Icon size={18} color={s.color} strokeWidth={1.8} />
                <span style={{ fontSize: "11px", fontWeight: 700, color: s.color, textTransform: "uppercase", letterSpacing: "0.06em" }}>{s.label}</span>
              </div>
              <p style={{ fontSize: "32px", fontWeight: 900, color: s.color, margin: 0 }}>{s.value}</p>
            </div>
          );
        })}
      </div>

      <div className="laporan-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
        <div style={{ background: "var(--bg-card)", borderRadius: "16px", padding: "24px", border: "1px solid var(--border-color)", boxShadow: "var(--shadow)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px" }}>
            <BarChart3 size={18} color="#a855f7" />
            <h3 style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>Status Pasien</h3>
          </div>
          {[
            { label: "Selesai", value: selesai, color: "#10b981" },
            { label: "Sedang Diperiksa", value: diperiksa, color: "#0ea5e9" },
            { label: "Menunggu", value: menunggu, color: "#f59e0b" },
          ].map((item) => {
            const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
            return (
              <div key={item.label} style={{ marginBottom: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                  <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-primary)" }}>{item.label}</span>
                  <span style={{ fontSize: "12px", fontWeight: 700, color: item.color }}>{item.value} ({pct}%)</span>
                </div>
                <div style={{ height: "8px", background: "var(--border-color)", borderRadius: "4px", overflow: "hidden" }}>
                  <div className="bar-fill" style={{ height: "100%", borderRadius: "4px", background: item.color, ["--tw" as string]: `${pct}%`, width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ background: "var(--bg-card)", borderRadius: "16px", padding: "24px", border: "1px solid var(--border-color)", boxShadow: "var(--shadow)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px" }}>
            <Activity size={18} color="#ec4899" />
            <h3 style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>Keluhan Terbanyak</h3>
          </div>
          {topKeluhan.length === 0 ? (
            <p style={{ color: "var(--text-secondary)", fontSize: "13px", textAlign: "center", padding: "20px 0" }}>Belum ada data</p>
          ) : topKeluhan.map(([keluhan, count]) => (
            <div key={keluhan} style={{ marginBottom: "14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-primary)" }}>{keluhan}</span>
                <span style={{ fontSize: "12px", fontWeight: 700, color: "#ec4899" }}>{count}x</span>
              </div>
              <div style={{ height: "8px", background: "var(--border-color)", borderRadius: "4px", overflow: "hidden" }}>
                <div className="bar-fill" style={{ height: "100%", borderRadius: "4px", background: "linear-gradient(90deg, #ec4899, #a855f7)", ["--tw" as string]: `${Math.round((count / maxKeluhan) * 100)}%`, width: `${Math.round((count / maxKeluhan) * 100)}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
