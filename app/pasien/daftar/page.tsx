"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../../lib/supabase";
import { Users, ArrowLeft } from "lucide-react";

type Pasien = {
  id?: number;
  nomor_antrian: number;
  nama: string;
  jenis_kelamin?: string;
  no_hp?: string;
  keluhan: string;
  status: string;
  created_at: string;
};

export default function DaftarPasienPage() {
  const [pasienList, setPasienList] = useState<Pasien[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPasien() {
      const { data } = await supabase.from("pasien").select("*").order("created_at", { ascending: false });
      if (data) setPasienList(data);
      setLoading(false);
    }
    fetchPasien();
  }, []);

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
  }

  function getStatusStyle(status: string) {
    if (status === "Selesai") return { bg: "rgba(16,185,129,0.12)", color: "#059669", border: "rgba(16,185,129,0.3)" };
    if (status === "Sedang Diperiksa") return { bg: "rgba(14,165,233,0.12)", color: "#0284c7", border: "rgba(14,165,233,0.3)" };
    return { bg: "rgba(245,158,11,0.12)", color: "#d97706", border: "rgba(245,158,11,0.3)" };
  }

  return (
    <div>
      <style>{`
        .table-row:hover { background: var(--table-hover) !important; }
        .table-wrapper { overflow-x: auto; -webkit-overflow-scrolling: touch; }
        .table-wrapper table { min-width: 680px; }
      `}</style>

      <div style={{ marginBottom: "28px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
            <Link href="/pasien" style={{
              display: "inline-flex", alignItems: "center", gap: "5px",
              fontSize: "12px", color: "var(--text-secondary)", textDecoration: "none",
              background: "var(--bg-card)", border: "1px solid var(--border-color)",
              borderRadius: "8px", padding: "5px 10px", transition: "all 0.2s",
            }}>
              <ArrowLeft size={13} /> Kembali
            </Link>
          </div>
          <h1 style={{ fontSize: "24px", fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>Daftar Pasien</h1>
          <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: "4px 0 0" }}>Riwayat seluruh pasien klinik</p>
        </div>
        <div style={{ background: "rgba(123,97,255,0.08)", border: "1px solid rgba(123,97,255,0.2)", borderRadius: "12px", padding: "10px 18px", display: "flex", alignItems: "center", gap: "8px" }}>
          <Users size={15} color="#7B61FF" />
          <span style={{ fontSize: "13px", color: "#7B61FF", fontWeight: 600 }}>{pasienList.length} Total Pasien</span>
        </div>
      </div>

      <div style={{ background: "var(--bg-card)", borderRadius: "16px", border: "1px solid var(--border-color)", overflow: "hidden", boxShadow: "var(--shadow)" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px", color: "var(--text-secondary)" }}>
            <p>Memuat data...</p>
          </div>
        ) : pasienList.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px", color: "var(--text-secondary)" }}>
            <Users size={48} strokeWidth={1} style={{ margin: "0 auto 16px", display: "block", opacity: 0.4 }} />
            <p style={{ fontSize: "15px", fontWeight: 600, marginBottom: "6px", color: "var(--text-primary)" }}>Belum ada data pasien</p>
            <p style={{ fontSize: "13px" }}>Daftarkan pasien pertama dari halaman registrasi.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-color)", background: "var(--table-header-bg)" }}>
                  {["No Antrian", "Nama", "Jenis Kelamin", "No HP", "Keluhan", "Status", "Tanggal Daftar"].map(h => (
                    <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: "11px", fontWeight: 700, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pasienList.map((p) => {
                  const st = getStatusStyle(p.status);
                  return (
                    <tr key={p.nomor_antrian} className="table-row" style={{ borderBottom: "1px solid var(--border-color)", transition: "background 0.15s" }}>
                      <td style={{ padding: "14px 16px", fontWeight: 700, color: "var(--accent)" }}>#{p.nomor_antrian}</td>
                      <td style={{ padding: "14px 16px", fontWeight: 600, color: "var(--text-primary)", whiteSpace: "nowrap" }}>{p.nama}</td>
                      <td style={{ padding: "14px 16px", color: "var(--text-secondary)" }}>{p.jenis_kelamin || "-"}</td>
                      <td style={{ padding: "14px 16px", color: "var(--text-secondary)", whiteSpace: "nowrap" }}>{p.no_hp || "-"}</td>
                      <td style={{ padding: "14px 16px", color: "var(--text-secondary)", maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.keluhan}</td>
                      <td style={{ padding: "14px 16px" }}>
                        <span style={{
                          padding: "5px 12px", borderRadius: "20px", fontSize: "11px", fontWeight: 700,
                          background: st.bg, color: st.color, border: `1px solid ${st.border}`,
                          whiteSpace: "nowrap",
                        }}>{p.status}</span>
                      </td>
                      <td style={{ padding: "14px 16px", color: "var(--text-secondary)", whiteSpace: "nowrap", fontSize: "12px" }}>{formatDate(p.created_at)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
