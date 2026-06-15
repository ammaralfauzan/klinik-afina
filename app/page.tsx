"use client";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { Users, Clock, Stethoscope, CheckCircle, User, TrendingUp, Wallet } from "lucide-react";
import { useAudio } from "./components/AudioNotif";
import Toast from "./components/Toast";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

type Pasien = {
  nama: string; keluhan: string; status: string; nomor_antrian: number;
  biaya?: number; status_bayar?: string; created_at: string;
};

function getTodayRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end   = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  return { start: start.toISOString(), end: end.toISOString() };
}

function padNo(n: number) { return String(n).padStart(3, "0"); }

export default function Home() {
  const [pasienList, setPasienList] = useState<Pasien[]>([]);
  const [toast, setToast] = useState({ visible: false, message: "" });
  const [weekData, setWeekData] = useState<{ day: string; count: number }[]>([]);
  const [dokterHariIni, setDokterHariIni] = useState("");
  const { playDing } = useAudio();

  const fetchPasien = useCallback(async () => {
    const { start, end } = getTodayRange();
    const { data } = await supabase.from("pasien").select("*")
      .gte("created_at", start).lte("created_at", end)
      .order("nomor_antrian", { ascending: true });
    if (data) setPasienList(data);
  }, []);

  useEffect(() => {
    fetchPasien();

    // Load dokter hari ini dari jadwal localStorage
    try {
      const jadwal = JSON.parse(localStorage.getItem("klinik_jadwal") || "{}");
      const days = ["minggu", "senin", "selasa", "rabu", "kamis", "jumat", "sabtu"];
      const today = days[new Date().getDay()];
      const fromJadwal = jadwal[today];
      if (fromJadwal) {
        setDokterHariIni(fromJadwal);
      } else {
        const pg = JSON.parse(localStorage.getItem("klinik_pengaturan") || "{}");
        if (pg.dokter_jaga) setDokterHariIni(pg.dokter_jaga);
      }
    } catch { /* noop */ }

    // Fetch data 7 hari
    const fetchWeek = async () => {
      const now = new Date();
      const days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(now);
        d.setDate(d.getDate() - (6 - i));
        return d;
      });
      const weekStart = new Date(days[0].getFullYear(), days[0].getMonth(), days[0].getDate()).toISOString();
      const { data } = await supabase.from("pasien").select("created_at").gte("created_at", weekStart);
      const result = days.map(d => {
        const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
        const dayEnd   = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999).getTime();
        const count = (data || []).filter(r => {
          const t = new Date(r.created_at).getTime();
          return t >= dayStart && t <= dayEnd;
        }).length;
        return { day: d.toLocaleDateString("id-ID", { weekday: "short" }), count };
      });
      setWeekData(result);
    };
    fetchWeek();

    const channel = supabase.channel("realtime-pasien")
      .on("postgres_changes", { event: "*", schema: "public", table: "pasien" }, (payload) => {
        if (payload.eventType === "INSERT") {
          playDing();
          const newPatient = payload.new as Pasien;
          setToast({ visible: true, message: `Pasien baru: ${newPatient.nama}` });
        }
        fetchPasien();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchPasien, playDing]);

  const belumBayar = pasienList.filter(p => p.status === "Selesai" && p.status_bayar !== "Lunas").length;

  const stats = [
    { label: "Pasien Hari Ini", value: pasienList.length, icon: Users, color: "#7B61FF", bg: "rgba(123,97,255,0.1)" },
    { label: "Antrian Menunggu", value: pasienList.filter(p => p.status === "Menunggu").length, icon: Clock, color: "#F5A623", bg: "rgba(245,166,35,0.1)" },
    { label: "Sedang Diperiksa", value: pasienList.filter(p => p.status === "Sedang Diperiksa").length, icon: Stethoscope, color: "#0ea5e9", bg: "rgba(14,165,233,0.1)" },
    { label: "Selesai", value: pasienList.filter(p => p.status === "Selesai").length, icon: CheckCircle, color: "#10b981", bg: "rgba(16,185,129,0.1)" },
    { label: "Belum Bayar", value: belumBayar, icon: Wallet, color: "#ef4444", bg: "rgba(239,68,68,0.1)" },
    { label: "Tingkat Selesai", value: pasienList.length > 0 ? `${Math.round((pasienList.filter(p => p.status === "Selesai").length / pasienList.length) * 100)}%` : "0%", icon: TrendingUp, color: "#8b5cf6", bg: "rgba(139,92,246,0.1)" },
  ];

  return (
    <div>
      <Toast message={toast.message} visible={toast.visible} onClose={() => setToast({ ...toast, visible: false })} />

      <style>{`
        @keyframes icon-pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.15); } }
        .stat-icon { animation: icon-pulse 2.5s ease-in-out infinite; }
        .table-row:hover { background: var(--table-hover) !important; }
        .table-wrapper { overflow-x: auto; -webkit-overflow-scrolling: touch; }
        .table-wrapper table { min-width: 480px; }
        .recharts-tooltip-wrapper { font-size: 12px !important; }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 14px;
          margin-bottom: 24px;
        }
        .dash-main-grid {
          display: grid;
          grid-template-columns: 1fr 360px;
          gap: 20px;
          margin-bottom: 20px;
          min-width: 0;
        }
        .dash-chart-wrap { width: 100%; min-width: 0; overflow: hidden; }
        .dash-main-grid > * { min-width: 0; }
        .stats-grid > * { min-width: 0; }

        @media (max-width: 900px) {
          .stats-grid { grid-template-columns: repeat(3, 1fr); }
          .dash-main-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 600px) {
          .stats-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 400px) {
          .stats-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div style={{ marginBottom: "28px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>Dashboard</h1>
          <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: "4px 0 0" }}>Ringkasan aktivitas klinik hari ini</p>
        </div>
        {dokterHariIni && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "rgba(123,97,255,0.08)", border: "1px solid rgba(123,97,255,0.2)", borderRadius: "24px", padding: "8px 16px" }}>
            <User size={14} color="#7B61FF" />
            <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Dokter Jaga:</span>
            <span style={{ fontSize: "13px", fontWeight: 700, color: "#7B61FF" }}>{dokterHariIni}</span>
          </div>
        )}
      </div>

      <div data-tour="dashboard-stats" className="stats-grid">
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={s.label} style={{ background: "var(--bg-card)", borderRadius: "16px", padding: "18px", border: "1px solid var(--border-color)", boxShadow: "var(--shadow)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span className="stat-icon" style={{ display: "flex", animationDelay: `${i * 0.4}s` }}>
                    <Icon size={18} color={s.color} strokeWidth={1.8} />
                  </span>
                </div>
              </div>
              <p style={{ fontSize: "28px", fontWeight: 800, color: "var(--text-primary)", margin: 0, lineHeight: 1 }}>{s.value}</p>
              <p style={{ fontSize: "11px", color: "var(--text-secondary)", margin: "6px 0 0", fontWeight: 500, lineHeight: 1.3 }}>{s.label}</p>
            </div>
          );
        })}
      </div>

      <div className="dash-main-grid">
        {/* Antrian table */}
        <div style={{ background: "var(--bg-card)", borderRadius: "16px", padding: "24px", border: "1px solid var(--border-color)", boxShadow: "var(--shadow)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
            <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>Antrian Pasien</h3>
            <span style={{ fontSize: "11px", background: "rgba(123,97,255,0.1)", color: "#7B61FF", padding: "4px 14px", borderRadius: "20px", fontWeight: 700, border: "1px solid rgba(123,97,255,0.2)" }}>{pasienList.length} Pasien</span>
          </div>
          {pasienList.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px", color: "var(--text-secondary)" }}>
              <Users size={40} color="var(--text-secondary)" strokeWidth={1} style={{ margin: "0 auto 12px", display: "block" }} />
              <p style={{ fontSize: "14px" }}>Belum ada pasien hari ini</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
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
                      <td style={{ padding: "12px 16px", fontWeight: 700, color: "var(--accent)" }}>{padNo(p.nomor_antrian)}</td>
                      <td style={{ padding: "12px 16px", fontWeight: 600, color: "var(--text-primary)" }}>{p.nama}</td>
                      <td style={{ padding: "12px 16px", color: "var(--text-secondary)" }}>{p.keluhan}</td>
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{
                          padding: "5px 12px", borderRadius: "20px", fontSize: "11px", fontWeight: 700,
                          background: p.status === "Selesai" ? "rgba(16,185,129,0.12)" : p.status === "Sedang Diperiksa" ? "rgba(14,165,233,0.12)" : "rgba(245,158,11,0.12)",
                          color: p.status === "Selesai" ? "#059669" : p.status === "Sedang Diperiksa" ? "#0284c7" : "#d97706",
                          border: `1px solid ${p.status === "Selesai" ? "rgba(16,185,129,0.3)" : p.status === "Sedang Diperiksa" ? "rgba(14,165,233,0.3)" : "rgba(245,158,11,0.3)"}`,
                        }}>{p.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 7-day chart */}
        <div data-tour="dashboard-chart" style={{ background: "var(--bg-card)", borderRadius: "16px", padding: "24px", border: "1px solid var(--border-color)", boxShadow: "var(--shadow)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px" }}>
            <TrendingUp size={16} color="#7B61FF" />
            <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>7 Hari Terakhir</h3>
          </div>
          {weekData.length > 0 ? (
            <div className="dash-chart-wrap">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={weekData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: "var(--text-secondary)" }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: "var(--text-secondary)" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "10px", fontSize: "12px", color: "var(--text-primary)" }}
                  cursor={{ fill: "rgba(123,97,255,0.06)" }}
                  formatter={(v: unknown) => [`${v} pasien`, "Kunjungan"]}
                />
                <Bar dataKey="count" fill="#7B61FF" radius={[6, 6, 0, 0]} maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
            </div>
          ) : (
            <div style={{ height: "220px", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-secondary)", fontSize: "13px" }}>
              Memuat grafik...
            </div>
          )}
          <div style={{ marginTop: "16px", padding: "12px", background: "var(--bg-main)", borderRadius: "10px", display: "flex", justifyContent: "space-between" }}>
            <div>
              <p style={{ fontSize: "10px", color: "var(--text-secondary)", margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Total 7 Hari</p>
              <p style={{ fontSize: "20px", fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>{weekData.reduce((s, d) => s + d.count, 0)}</p>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ fontSize: "10px", color: "var(--text-secondary)", margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Rata-rata/Hari</p>
              <p style={{ fontSize: "20px", fontWeight: 800, color: "var(--accent)", margin: 0 }}>
                {weekData.length > 0 ? Math.round(weekData.reduce((s, d) => s + d.count, 0) / 7) : 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Link daftar online */}
      <div style={{ background: "var(--bg-card)", borderRadius: "12px", padding: "14px 18px", border: "1px solid var(--border-color)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "rgba(123,97,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Users size={15} color="#7B61FF" />
          </div>
          <div>
            <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>Link Antrian Online Pasien</p>
            <p style={{ fontSize: "11px", color: "var(--text-secondary)", margin: "1px 0 0" }}>Bagikan ke pasien agar bisa daftar mandiri tanpa antre di loket</p>
          </div>
        </div>
        <button
          onClick={() => { navigator.clipboard.writeText(window.location.origin + "/daftar-online"); }}
          style={{ background: "rgba(123,97,255,0.1)", border: "1px solid rgba(123,97,255,0.2)", borderRadius: "8px", padding: "8px 14px", fontSize: "12px", fontWeight: 600, color: "#7B61FF", cursor: "pointer" }}
        >
          Salin Link
        </button>
      </div>
    </div>
  );
}
