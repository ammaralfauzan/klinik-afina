"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { PhoneCall, CheckCircle2, Clock, Users } from "lucide-react";

type Pasien = { nama: string; keluhan: string; status: string; nomor_antrian: number; };

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

  return (
    <div>
      <style>{`
        .action-btn { transition: all 0.2s; cursor: pointer; }
        .action-btn:hover { transform: translateY(-1px); filter: brightness(1.1); }
        .table-row:hover { background: var(--table-hover) !important; }
        .table-wrapper { overflow-x: auto; -webkit-overflow-scrolling: touch; }
        .table-wrapper table { min-width: 500px; }
      `}</style>

      <div style={{ marginBottom: "28px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>Manajemen Antrian</h1>
          <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: "4px 0 0" }}>Kelola antrian pasien secara realtime</p>
        </div>
        <div style={{ background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.3)", borderRadius: "12px", padding: "10px 18px", display: "flex", alignItems: "center", gap: "8px" }}>
          <Users size={15} color="#a855f7" />
          <span style={{ fontSize: "13px", color: "#a855f7", fontWeight: 600 }}>{pasienList.length} Pasien</span>
        </div>
      </div>

      <div style={{ background: "var(--bg-card)", borderRadius: "16px", border: "1px solid var(--border-color)", overflow: "hidden", boxShadow: "var(--shadow)" }}>
        <div className="table-wrapper">
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-color)", background: "var(--table-header-bg)" }}>
                {["No", "Nama Pasien", "Keluhan", "Status", "Aksi"].map(h => (
                  <th key={h} style={{ padding: "14px 18px", textAlign: "left", fontSize: "11px", fontWeight: 700, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pasienList.length === 0 ? (
                <tr><td colSpan={5} style={{ padding: "48px", textAlign: "center", color: "var(--text-secondary)" }}>
                  <Clock size={36} style={{ margin: "0 auto 12px", display: "block", opacity: 0.5 }} />
                  <p style={{ margin: 0 }}>Belum ada antrian hari ini</p>
                </td></tr>
              ) : pasienList.map((p) => (
                <tr key={p.nomor_antrian} className="table-row" style={{ borderBottom: "1px solid var(--border-color)", transition: "background 0.15s" }}>
                  <td style={{ padding: "16px 18px", fontWeight: 700, color: "var(--accent)" }}>{p.nomor_antrian}</td>
                  <td style={{ padding: "16px 18px", fontWeight: 600, color: "var(--text-primary)" }}>{p.nama}</td>
                  <td style={{ padding: "16px 18px", color: "var(--text-secondary)" }}>{p.keluhan}</td>
                  <td style={{ padding: "16px 18px" }}>
                    <span style={{
                      padding: "5px 14px", borderRadius: "20px", fontSize: "11px", fontWeight: 700,
                      background: p.status === "Selesai" ? "rgba(16,185,129,0.12)" : p.status === "Sedang Diperiksa" ? "rgba(14,165,233,0.12)" : "rgba(245,158,11,0.12)",
                      color: p.status === "Selesai" ? "#059669" : p.status === "Sedang Diperiksa" ? "#0284c7" : "#d97706",
                      border: `1px solid ${p.status === "Selesai" ? "rgba(16,185,129,0.3)" : p.status === "Sedang Diperiksa" ? "rgba(14,165,233,0.3)" : "rgba(245,158,11,0.3)"}`,
                    }}>{p.status}</span>
                  </td>
                  <td style={{ padding: "16px 18px" }}>
                    {p.status === "Menunggu" && (
                      <button className="action-btn" onClick={() => updateStatus(p.nomor_antrian, "Sedang Diperiksa")} style={{ background: "rgba(14,165,233,0.12)", border: "1px solid rgba(14,165,233,0.4)", color: "#0284c7", borderRadius: "8px", padding: "7px 14px", fontSize: "12px", fontWeight: 600, display: "flex", alignItems: "center", gap: "6px" }}>
                        <PhoneCall size={13} /> Panggil
                      </button>
                    )}
                    {p.status === "Sedang Diperiksa" && (
                      <button className="action-btn" onClick={() => updateStatus(p.nomor_antrian, "Selesai")} style={{ background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.4)", color: "#059669", borderRadius: "8px", padding: "7px 14px", fontSize: "12px", fontWeight: 600, display: "flex", alignItems: "center", gap: "6px" }}>
                        <CheckCircle2 size={13} /> Selesai
                      </button>
                    )}
                    {p.status === "Selesai" && (
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#059669", fontSize: "12px", fontWeight: 600 }}>
                        <CheckCircle2 size={13} /> Done
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
