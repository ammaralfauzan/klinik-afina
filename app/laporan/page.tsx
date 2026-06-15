"use client";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "../../lib/supabase";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts";
import {
  Users, TrendingUp, Clock, Activity, BarChart3,
  FileDown, CalendarDays, Stethoscope,
} from "lucide-react";

type Pasien = {
  nama: string; keluhan: string; status: string;
  nomor_antrian: number; created_at: string;
  jenis_kelamin?: string; no_hp?: string;
};

type Periode = "hari" | "minggu" | "bulan" | "tahun";

const PERIODE_LABELS: Record<Periode, string> = {
  hari: "Hari Ini",
  minggu: "Minggu Ini",
  bulan: "Bulan Ini",
  tahun: "Tahun Ini",
};

const BULAN_ID = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Ags","Sep","Okt","Nov","Des"];
const HARI_ID = ["Min","Sen","Sel","Rab","Kam","Jum","Sab"];
const JAM_RANGE = Array.from({ length: 11 }, (_, i) => i + 7); // 07–17

function startOf(periode: Periode): Date {
  const now = new Date();
  if (periode === "hari") {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }
  if (periode === "minggu") {
    const day = now.getDay();
    const diff = day === 0 ? -6 : 1 - day; // Mon as start
    const mon = new Date(now);
    mon.setDate(now.getDate() + diff);
    return new Date(mon.getFullYear(), mon.getMonth(), mon.getDate());
  }
  if (periode === "bulan") {
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }
  return new Date(now.getFullYear(), 0, 1);
}

function filterByPeriode(list: Pasien[], periode: Periode): Pasien[] {
  const start = startOf(periode);
  const now = new Date();
  return list.filter((p) => {
    const d = new Date(p.created_at);
    return d >= start && d <= now;
  });
}

function buildChartData(list: Pasien[], periode: Periode) {
  if (periode === "hari") {
    return JAM_RANGE.map((jam) => ({
      label: `${String(jam).padStart(2, "0")}:00`,
      value: list.filter((p) => new Date(p.created_at).getHours() === jam).length,
    }));
  }
  if (periode === "minggu") {
    const start = startOf("minggu");
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const dayIdx = d.getDay();
      return {
        label: HARI_ID[dayIdx],
        value: list.filter((p) => {
          const pd = new Date(p.created_at);
          return pd.getDate() === d.getDate()
            && pd.getMonth() === d.getMonth()
            && pd.getFullYear() === d.getFullYear();
        }).length,
      };
    });
  }
  if (periode === "bulan") {
    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => ({
      label: String(i + 1),
      value: list.filter((p) => new Date(p.created_at).getDate() === i + 1).length,
    }));
  }
  // tahun
  return BULAN_ID.map((bln, idx) => ({
    label: bln,
    value: list.filter((p) => new Date(p.created_at).getMonth() === idx).length,
  }));
}

function hitungRataHari(list: Pasien[], periode: Periode): string {
  if (list.length === 0) return "0";
  if (periode === "hari") return String(list.length);
  const start = startOf(periode);
  const diffMs = Date.now() - start.getTime();
  const days = Math.max(1, Math.ceil(diffMs / 86400000));
  return (list.length / days).toFixed(1);
}

function jamTersibuk(list: Pasien[]): string {
  if (list.length === 0) return "-";
  const counts: Record<number, number> = {};
  list.forEach((p) => {
    const h = new Date(p.created_at).getHours();
    counts[h] = (counts[h] || 0) + 1;
  });
  const peak = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  return peak ? `${String(Number(peak[0])).padStart(2, "0")}:00` : "-";
}

function keluhanTerbanyak(list: Pasien[]): string {
  if (list.length === 0) return "-";
  const map: Record<string, number> = {};
  list.forEach((p) => { const k = p.keluhan || "Lainnya"; map[k] = (map[k] || 0) + 1; });
  return Object.entries(map).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "-";
}

// Custom tooltip for recharts
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "#fff", border: "1px solid rgba(0,0,0,0.08)", borderRadius: "10px",
      padding: "10px 14px", boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
    }}>
      <p style={{ fontSize: "12px", color: "#8B8FA8", margin: "0 0 4px" }}>{label}</p>
      <p style={{ fontSize: "15px", fontWeight: 700, color: "#6C5CE7", margin: 0 }}>
        {payload[0].value} pasien
      </p>
    </div>
  );
}

export default function LaporanPage() {
  const [allPasien, setAllPasien] = useState<Pasien[]>([]);
  const [loading, setLoading] = useState(true);
  const [periode, setPeriode] = useState<Periode>("hari");

  useEffect(() => {
    supabase.from("pasien").select("*").order("created_at", { ascending: true })
      .then(({ data }) => { if (data) setAllPasien(data); setLoading(false); });
  }, []);

  const filtered = useMemo(() => filterByPeriode(allPasien, periode), [allPasien, periode]);
  const chartData = useMemo(() => buildChartData(filtered, periode), [filtered, periode]);

  const total = filtered.length;
  const selesai = filtered.filter(p => p.status === "Selesai").length;
  const menunggu = filtered.filter(p => p.status === "Menunggu").length;
  const diperiksa = filtered.filter(p => p.status === "Sedang Diperiksa").length;
  const selesaiPct = total > 0 ? Math.round((selesai / total) * 100) : 0;

  // Keluhan ranking
  const keluhanMap: Record<string, number> = {};
  filtered.forEach(p => { const k = p.keluhan || "Lainnya"; keluhanMap[k] = (keluhanMap[k] || 0) + 1; });
  const keluhanRanking = Object.entries(keluhanMap).sort((a, b) => b[1] - a[1]);
  const maxKeluhan = keluhanRanking[0]?.[1] || 1;

  const stats = [
    {
      label: "Total Pasien", value: total,
      icon: Users, color: "#6C5CE7", bg: "rgba(108,92,231,0.1)",
      sub: `${PERIODE_LABELS[periode]}`,
    },
    {
      label: "Rata-rata / Hari", value: hitungRataHari(filtered, periode),
      icon: TrendingUp, color: "#10b981", bg: "rgba(16,185,129,0.1)",
      sub: "pasien per hari",
    },
    {
      label: "Keluhan Terbanyak", value: keluhanTerbanyak(filtered),
      icon: Stethoscope, color: "#F5A623", bg: "rgba(245,166,35,0.1)",
      sub: `${keluhanMap[keluhanTerbanyak(filtered)] || 0} kasus`,
      small: true,
    },
    {
      label: "Jam Tersibuk", value: jamTersibuk(filtered),
      icon: Clock, color: "#0ea5e9", bg: "rgba(14,165,233,0.1)",
      sub: "puncak kunjungan",
    },
  ];

  const maxChart = Math.max(...chartData.map(d => d.value), 1);

  function handleExportPDF() {
    window.print();
  }

  return (
    <div>
      <style>{`
        @keyframes bar-grow { from { width: 0%; } to { width: var(--bw); } }
        .bar-fill { animation: bar-grow 0.8s ease-out forwards; }
        .periode-btn {
          padding: 8px 16px; border-radius: 8px; font-size: 13px; font-weight: 500;
          cursor: pointer; border: 1px solid var(--border-color);
          background: transparent; color: var(--text-secondary);
          transition: all 0.18s; font-family: inherit;
        }
        .periode-btn:hover { background: var(--input-bg); color: var(--text-primary); }
        .periode-btn.active {
          background: var(--accent); color: #fff; border-color: var(--accent); font-weight: 700;
        }
        .laporan-stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
        .laporan-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        @media (max-width: 900px) { .laporan-stats-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 640px) {
          .laporan-stats-grid { grid-template-columns: repeat(2, 1fr); }
          .laporan-grid { grid-template-columns: 1fr; }
        }

        /* Print styles */
        @media print {
          body * { visibility: hidden; }
          #laporan-print, #laporan-print * { visibility: visible; }
          #laporan-print { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
          .print-header { display: block !important; }
        }
        .print-header { display: none; }
      `}</style>

      <div id="laporan-print">

        {/* Print header */}
        <div className="print-header" style={{ marginBottom: "24px", textAlign: "center", borderBottom: "2px solid #6C5CE7", paddingBottom: "16px" }}>
          <h1 style={{ fontSize: "20px", fontWeight: 800, color: "#1A1A2E", margin: "0 0 4px" }}>Klinik & RB Afina — Laporan Klinik</h1>
          <p style={{ fontSize: "12px", color: "#8B8FA8", margin: 0 }}>
            {PERIODE_LABELS[periode]} · Dicetak: {new Date().toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>

        {/* PAGE HEADER */}
        <div style={{ marginBottom: "24px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }} className="no-print">
          <div>
            <h1 style={{ fontSize: "24px", fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>Laporan</h1>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: "4px 0 0" }}>Statistik dan analitik aktivitas klinik</p>
          </div>
          <button
            onClick={handleExportPDF}
            style={{
              display: "flex", alignItems: "center", gap: "7px",
              background: "var(--accent)", color: "#fff", border: "none",
              borderRadius: "10px", padding: "10px 18px", fontSize: "13px",
              fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
              transition: "opacity 0.18s",
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = "0.88")}
            onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
          >
            <FileDown size={15} />
            Export PDF
          </button>
        </div>

        {/* PERIODE FILTER */}
        <div className="no-print" style={{ display: "flex", gap: "6px", marginBottom: "24px", flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: "6px", background: "var(--bg-card)", padding: "5px", borderRadius: "12px", border: "1px solid var(--border-color)", boxShadow: "var(--shadow)" }}>
            {(Object.keys(PERIODE_LABELS) as Periode[]).map((p) => (
              <button
                key={p}
                className={`periode-btn${periode === p ? " active" : ""}`}
                onClick={() => setPeriode(p)}
              >
                {PERIODE_LABELS[p]}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "60px", color: "var(--text-secondary)" }}>
            <p>Memuat data laporan...</p>
          </div>
        ) : (
          <>
            {/* STAT CARDS */}
            <div className="laporan-stats-grid" style={{ marginBottom: "24px" }}>
              {stats.map((s) => {
                const Icon = s.icon;
                return (
                  <div key={s.label} style={{
                    background: "var(--bg-card)", borderRadius: "16px", padding: "20px",
                    border: "1px solid var(--border-color)", boxShadow: "var(--shadow)",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
                      <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <Icon size={16} color={s.color} strokeWidth={1.8} />
                      </div>
                      <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{s.label}</span>
                    </div>
                    <p style={{ fontSize: s.small ? "16px" : "30px", fontWeight: 800, color: "var(--text-primary)", margin: "0 0 4px", lineHeight: 1.2, wordBreak: "break-word" }}>{s.value}</p>
                    <p style={{ fontSize: "11px", color: "var(--text-secondary)", margin: 0, fontWeight: 500 }}>{s.sub}</p>
                  </div>
                );
              })}
            </div>

            {/* GRAFIK KUNJUNGAN */}
            <div style={{ background: "var(--bg-card)", borderRadius: "16px", padding: "24px", border: "1px solid var(--border-color)", boxShadow: "var(--shadow)", marginBottom: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "rgba(108,92,231,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <BarChart3 size={16} color="#6C5CE7" />
                  </div>
                  <div>
                    <h3 style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
                      Grafik Kunjungan
                    </h3>
                    <p style={{ fontSize: "11px", color: "var(--text-secondary)", margin: 0 }}>
                      {periode === "hari" && "Per jam (07:00–17:00)"}
                      {periode === "minggu" && "Per hari (Senin–Minggu)"}
                      {periode === "bulan" && "Per tanggal"}
                      {periode === "tahun" && "Per bulan (Jan–Des)"}
                    </p>
                  </div>
                </div>
                <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--accent)" }}>
                  {total} kunjungan
                </div>
              </div>

              {total === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-secondary)" }}>
                  <CalendarDays size={36} strokeWidth={1} style={{ margin: "0 auto 12px", display: "block", opacity: 0.4 }} />
                  <p style={{ fontSize: "13px" }}>Tidak ada data untuk periode ini</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false} />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11, fill: "#8B8FA8" }}
                      axisLine={false}
                      tickLine={false}
                      interval={periode === "bulan" ? 4 : 0}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "#8B8FA8" }}
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                      domain={[0, maxChart + 1]}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(108,92,231,0.06)", radius: 6 }} />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={40}>
                      {chartData.map((entry, index) => (
                        <Cell
                          key={index}
                          fill={entry.value === maxChart && entry.value > 0 ? "#6C5CE7" : "rgba(108,92,231,0.2)"}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* BOTTOM GRID: Status + Keluhan */}
            <div className="laporan-grid">

              {/* Status Pasien */}
              <div style={{ background: "var(--bg-card)", borderRadius: "16px", padding: "24px", border: "1px solid var(--border-color)", boxShadow: "var(--shadow)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px" }}>
                  <Activity size={16} color="#6C5CE7" />
                  <h3 style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>Status Pasien</h3>
                  <span style={{ marginLeft: "auto", fontSize: "12px", fontWeight: 600, color: "#10b981" }}>{selesaiPct}% selesai</span>
                </div>
                {total === 0 ? (
                  <p style={{ fontSize: "13px", color: "var(--text-secondary)", textAlign: "center", padding: "16px 0" }}>Belum ada data</p>
                ) : (
                  [
                    { label: "Selesai", value: selesai, color: "#10b981" },
                    { label: "Sedang Diperiksa", value: diperiksa, color: "#0ea5e9" },
                    { label: "Menunggu", value: menunggu, color: "#F5A623" },
                  ].map((item) => {
                    const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
                    return (
                      <div key={item.label} style={{ marginBottom: "16px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "7px" }}>
                          <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-primary)" }}>{item.label}</span>
                          <span style={{ fontSize: "12px", fontWeight: 700, color: item.color }}>{item.value} ({pct}%)</span>
                        </div>
                        <div style={{ height: "8px", background: "var(--input-bg)", borderRadius: "4px", overflow: "hidden" }}>
                          <div
                            className="bar-fill"
                            style={{ height: "100%", borderRadius: "4px", background: item.color, ["--bw" as string]: `${pct}%`, width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Ranking Keluhan */}
              <div style={{ background: "var(--bg-card)", borderRadius: "16px", padding: "24px", border: "1px solid var(--border-color)", boxShadow: "var(--shadow)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px" }}>
                  <Stethoscope size={16} color="#F5A623" />
                  <h3 style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>Ranking Keluhan</h3>
                  <span style={{ marginLeft: "auto", fontSize: "12px", color: "var(--text-secondary)" }}>{keluhanRanking.length} jenis</span>
                </div>
                {keluhanRanking.length === 0 ? (
                  <p style={{ fontSize: "13px", color: "var(--text-secondary)", textAlign: "center", padding: "16px 0" }}>Belum ada data</p>
                ) : (
                  <div>
                    {/* Header row */}
                    <div style={{ display: "grid", gridTemplateColumns: "auto 1fr 48px 44px", gap: "10px", alignItems: "center", padding: "0 0 8px", borderBottom: "1px solid var(--border-color)", marginBottom: "10px" }}>
                      <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em" }}>#</span>
                      <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Keluhan</span>
                      <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em", textAlign: "right" }}>Jumlah</span>
                      <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em", textAlign: "right" }}>%</span>
                    </div>
                    {keluhanRanking.map(([keluhan, count], idx) => {
                      const pct = Math.round((count / total) * 100);
                      const barPct = Math.round((count / maxKeluhan) * 100);
                      const rankColor = idx === 0 ? "#F5A623" : idx === 1 ? "#8B8FA8" : idx === 2 ? "#b45309" : "var(--text-secondary)";
                      return (
                        <div key={keluhan} style={{ marginBottom: "12px" }}>
                          <div style={{ display: "grid", gridTemplateColumns: "auto 1fr 48px 44px", gap: "10px", alignItems: "center", marginBottom: "5px" }}>
                            <span style={{ fontSize: "12px", fontWeight: 800, color: rankColor, width: "18px" }}>{idx + 1}</span>
                            <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{keluhan}</span>
                            <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--accent)", textAlign: "right" }}>{count}</span>
                            <span style={{ fontSize: "11px", color: "var(--text-secondary)", textAlign: "right" }}>{pct}%</span>
                          </div>
                          <div style={{ marginLeft: "28px", height: "5px", background: "var(--input-bg)", borderRadius: "3px", overflow: "hidden" }}>
                            <div
                              className="bar-fill"
                              style={{ height: "100%", borderRadius: "3px", background: "linear-gradient(90deg, #6C5CE7, #A594FF)", ["--bw" as string]: `${barPct}%`, width: `${barPct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>
          </>
        )}
      </div>
    </div>
  );
}
