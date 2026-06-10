"use client";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

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
    { label: "Pasien Hari Ini", value: pasienList.length, icon: "👥", color: "#9d174d", bg: "linear-gradient(135deg, #fdf2f8, #fce7f3)" },
    { label: "Antrian Menunggu", value: pasienList.filter(p => p.status === "Menunggu").length, icon: "⏳", color: "#6b21a8", bg: "linear-gradient(135deg, #f5f0ff, #ede9fe)" },
    { label: "Sedang Diperiksa", value: pasienList.filter(p => p.status === "Sedang Diperiksa").length, icon: "🩺", color: "#0e7490", bg: "linear-gradient(135deg, #ecfeff, #cffafe)" },
    { label: "Selesai", value: pasienList.filter(p => p.status === "Selesai").length, icon: "✅", color: "#065f46", bg: "linear-gradient(135deg, #ecfdf5, #d1fae5)" },
  ];

  return (
    <div>
      {/* Page Title */}
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#4a1272", margin: 0 }}>Dashboard</h1>
        <p style={{ fontSize: "13px", color: "#9ca3af", margin: "4px 0 0" }}>Ringkasan aktivitas klinik hari ini</p>
      </div>

      {/* Stats Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "24px" }}>
        {stats.map((s) => (
          <div key={s.label} style={{
            background: s.bg, borderRadius: "16px", padding: "20px",
            border: "1px solid rgba(0,0,0,0.05)", boxShadow: "0 2px 12px rgba(107,33,168,0.07)"
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
              <span style={{ fontSize: "22px" }}>{s.icon}</span>
              <span style={{
                fontSize: "11px", fontWeight: 600, color: s.color,
                background: "rgba(255,255,255,0.7)", padding: "2px 8px", borderRadius: "10px"
              }}>Hari ini</span>
            </div>
            <p style={{ fontSize: "32px", fontWeight: 800, color: s.color, margin: 0, lineHeight: 1 }}>{s.value}</p>
            <p style={{ fontSize: "12px", color: "#6b7280", margin: "6px 0 0" }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{
        background: "#fff", borderRadius: "16px", padding: "24px",
        boxShadow: "0 2px 12px rgba(107,33,168,0.07)", border: "1px solid #f0e6f6"
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
          <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#4a1272", margin: 0 }}>Antrian Pasien</h3>
          <span style={{
            fontSize: "11px", background: "linear-gradient(135deg, #9d174d, #6b21a8)",
            color: "#fff", padding: "4px 12px", borderRadius: "20px", fontWeight: 600
          }}>{pasienList.length} Pasien</span>
        </div>
        {pasienList.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px", color: "#d1a3d8" }}>
            <div style={{ fontSize: "40px", marginBottom: "8px" }}>🏥</div>
            <p style={{ fontSize: "14px" }}>Belum ada pasien hari ini</p>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr style={{ background: "linear-gradient(135deg, #fdf2f8, #f5f0ff)" }}>
                {["No", "Nama Pasien", "Keluhan", "Status"].map(h => (
                  <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: "11px", fontWeight: 700, color: "#6b21a8", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pasienList.map((p, i) => (
                <tr key={p.nomor_antrian} style={{ borderBottom: "1px solid #fdf2f8", background: i % 2 === 0 ? "#fff" : "#fefcff" }}>
                  <td style={{ padding: "12px 16px", fontWeight: 700, color: "#9d174d" }}>{p.nomor_antrian}</td>
                  <td style={{ padding: "12px 16px", fontWeight: 600, color: "#1f2937" }}>{p.nama}</td>
                  <td style={{ padding: "12px 16px", color: "#6b7280" }}>{p.keluhan}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{
                      padding: "4px 12px", borderRadius: "20px", fontSize: "11px", fontWeight: 600,
                      background: p.status === "Selesai" ? "#d1fae5" : p.status === "Sedang Diperiksa" ? "#dbeafe" : "#fce7f3",
                      color: p.status === "Selesai" ? "#065f46" : p.status === "Sedang Diperiksa" ? "#1e40af" : "#9d174d"
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
