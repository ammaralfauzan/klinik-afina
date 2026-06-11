"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { PhoneCall, CheckCircle2, Clock, Stethoscope, Users } from "lucide-react";

type Pasien = {
  nama: string;
  keluhan: string;
  status: string;
  nomor_antrian: number;
};

export default function AntrianPage() {
  const [pasienList, setPasienList] = useState<Pasien[]>([]);

  useEffect(() => {
    fetchPasien();
    const channel = supabase.channel("realtime-antrian")
      .on("postgres_changes", { event: "*", schema: "public", table: "pasien" }, fetchPasien)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  async function fetchPasien() {
    const { data } = await supabase.from("pasien").select("*").order("nomor_antrian", { ascending: true });
    if (data) setPasienList(data);
  }

  async function updateStatus(nomor: number, status: string) {
    await supabase.from("pasien").update({ status }).eq("nomor_antrian", nomor);
    fetchPasien();
  }

  const statusConfig: Record<string, { color: string; bg: string; border: string }> = {
    "Menunggu":        { color: "#fbbf24", bg: "rgba(251,191,36,0.1)",   border: "rgba(251,191,36,0.3)" },
    "Sedang Diperiksa":{ color: "#38bdf8", bg: "rgba(56,189,248,0.1)",   border: "rgba(56,189,248,0.3)" },
    "Selesai":         { color: "#4ade80", bg: "rgba(74,222,128,0.1)",   border: "rgba(74,222,128,0.3)" },
  };

  return (
    <div>
      <style>{`
        .action-btn { transition: all 0.2s; }
        .action-btn:hover { transform: translateY(-1px); filter: brightness(1.15); }
        .table-row:hover { background: rgba(168,85,247,0.05) !important; }
      `}</style>

      <div style={{ marginBottom: "28px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 800, color: "#f1e6ff", margin: 0 }}>Manajemen Antrian</h1>
          <p style={{ fontSize: "13px", color: "#6b7280", margin: "4px 0 0" }}>Kelola antrian pasien secara realtime</p>
        </div>
        <div style={{
          background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.3)",
          borderRadius: "12px", padding: "10px 18px", display: "flex", alignItems: "center", gap: "8px"
        }}>
          <Users size={15} color="#a855f7" />
          <span style={{ fontSize: "13px", color: "#c084fc", fontWeight: 600 }}>{pasienList.length} Pasien</span>
        </div>
      </div>

      <div style={{
        background: "rgba(255,255,255,0.03)", borderRadius: "16px",
        border: "1px solid rgba(168,85,247,0.15)", overflow: "hidden",
        boxShadow: "0 4px 24px rgba(0,0,0,0.3)"
      }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(168,85,247,0.2)", background: "rgba(168,85,247,0.06)" }}>
              {["No", "Nama Pasien", "Keluhan", "Status", "Aksi"].map(h => (
                <th key={h} style={{ padding: "14px 18px", textAlign: "left", fontSize: "11px", fontWeight: 700, color: "#7c3aed", textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pasienList.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: "48px", textAlign: "center", color: "#4b5563" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
                    <Clock size={36} color="#374151" strokeWidth={1} />
                    <p style={{ margin: 0, fontSize: "14px" }}>Belum ada antrian hari ini</p>
                  </div>
                </td>
              </tr>
            ) : pasienList.map((p) => {
              const s = statusConfig[p.status] || statusConfig["Menunggu"];
              return (
                <tr key={p.nomor_antrian} className="table-row" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", transition: "background 0.15s" }}>
                  <td style={{ padding: "16px 18px", fontWeight: 700, color: "#a855f7", fontSize: "14px" }}>{p.nomor_antrian}</td>
                  <td style={{ padding: "16px 18px", fontWeight: 600, color: "#f1e6ff" }}>{p.nama}</td>
                  <td style={{ padding: "16px 18px", color: "#9ca3af" }}>{p.keluhan}</td>
                  <td style={{ padding: "16px 18px" }}>
                    <span style={{ padding: "5px 14px", borderRadius: "20px", fontSize: "11px", fontWeight: 700, background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
                      {p.status}
                    </span>
                  </td>
                  <td style={{ padding: "16px 18px" }}>
                    {p.status === "Menunggu" && (
                      <button className="action-btn" onClick={() => updateStatus(p.nomor_antrian, "Sedang Diperiksa")} style={{
                        background: "rgba(56,189,248,0.15)", border: "1px solid rgba(56,189,248,0.4)",
                        color: "#38bdf8", borderRadius: "8px", padding: "7px 14px", fontSize: "12px",
                        fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px"
                      }}>
                        <PhoneCall size={13} /> Panggil
                      </button>
                    )}
                    {p.status === "Sedang Diperiksa" && (
                      <button className="action-btn" onClick={() => updateStatus(p.nomor_antrian, "Selesai")} style={{
                        background: "rgba(74,222,128,0.15)", border: "1px solid rgba(74,222,128,0.4)",
                        color: "#4ade80", borderRadius: "8px", padding: "7px 14px", fontSize: "12px",
                        fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px"
                      }}>
                        <CheckCircle2 size={13} /> Selesai
                      </button>
                    )}
                    {p.status === "Selesai" && (
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#4ade80", fontSize: "12px", fontWeight: 600 }}>
                        <CheckCircle2 size={13} /> Done
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
