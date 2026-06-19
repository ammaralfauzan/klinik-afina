"use client";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "../../lib/supabase";
import { ShieldCheck, Clock, AlertTriangle, RefreshCw } from "lucide-react";

type Log = {
  id: string; ts: string; actor_email: string;
  aksi: string; tabel: string; ref: string; ringkas: string;
};

const AKSI_WARNA: Record<string, { bg: string; color: string }> = {
  INSERT: { bg: "rgba(16,185,129,0.12)", color: "#059669" },
  UPDATE: { bg: "rgba(14,165,233,0.12)", color: "#0284c7" },
  DELETE: { bg: "rgba(239,68,68,0.12)", color: "#dc2626" },
};
const TABEL_LABEL: Record<string, string> = {
  pasien: "Pasien", rekam_medis: "Rekam Medis", pengaturan: "Pengaturan", staff: "Staf/Peran",
};

export default function AuditPage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [tableOk, setTableOk] = useState<boolean | null>(null);
  const [fTabel, setFTabel] = useState("");
  const [fAksi, setFAksi] = useState("");

  async function fetchLogs() {
    setLoading(true);
    const { data, error } = await supabase.from("audit_log")
      .select("*").order("ts", { ascending: false }).limit(300);
    if (error) setTableOk(false);
    else { setTableOk(true); setLogs(data || []); }
    setLoading(false);
  }

  useEffect(() => { fetchLogs(); }, []);

  const filtered = useMemo(() => logs.filter(l =>
    (!fTabel || l.tabel === fTabel) && (!fAksi || l.aksi === fAksi)
  ), [logs, fTabel, fAksi]);

  const todayStr = new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "24px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 800, color: "var(--text-primary)", margin: 0, display: "flex", alignItems: "center", gap: "9px" }}>
            <ShieldCheck size={22} color="var(--accent)" /> Log Aktivitas
          </h1>
          <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: "4px 0 0" }}>Jejak audit — siapa mengubah apa & kapan · {todayStr}</p>
        </div>
        <button onClick={fetchLogs} className="audit-btn"
          style={{ display: "flex", alignItems: "center", gap: "7px", padding: "9px 14px", borderRadius: "10px", border: "1px solid var(--border-color)", background: "var(--input-bg)", color: "var(--text-secondary)", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
          <RefreshCw size={14} /> Muat ulang
        </button>
      </div>

      {tableOk === false && (
        <div style={{ background: "rgba(245,166,35,0.06)", border: "1px solid rgba(245,166,35,0.35)", borderRadius: "16px", padding: "20px", display: "flex", gap: "10px", alignItems: "flex-start" }}>
          <AlertTriangle size={16} color="#d97706" style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <p style={{ fontSize: "13px", fontWeight: 700, color: "#92400e", margin: 0 }}>Tabel audit_log belum ada</p>
            <p style={{ fontSize: "12px", color: "#b45309", margin: "3px 0 0" }}>Jalankan <strong>Langkah 20</strong> di Supabase SQL Editor (perlu Langkah 19 lebih dulu).</p>
          </div>
        </div>
      )}

      {tableOk && (
        <>
          {/* Filter */}
          <div style={{ display: "flex", gap: "10px", marginBottom: "16px", flexWrap: "wrap" }}>
            <select value={fTabel} onChange={e => setFTabel(e.target.value)}
              style={{ padding: "8px 12px", borderRadius: "10px", border: "1px solid var(--border-color)", background: "var(--input-bg)", color: "var(--text-primary)", fontSize: "13px", fontFamily: "inherit" }}>
              <option value="">Semua tabel</option>
              {Object.entries(TABEL_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <select value={fAksi} onChange={e => setFAksi(e.target.value)}
              style={{ padding: "8px 12px", borderRadius: "10px", border: "1px solid var(--border-color)", background: "var(--input-bg)", color: "var(--text-primary)", fontSize: "13px", fontFamily: "inherit" }}>
              <option value="">Semua aksi</option>
              <option value="INSERT">Tambah</option>
              <option value="UPDATE">Ubah</option>
              <option value="DELETE">Hapus</option>
            </select>
            <span style={{ alignSelf: "center", fontSize: "12px", color: "var(--text-secondary)" }}>{filtered.length} entri</span>
          </div>

          <div style={{ background: "var(--bg-card)", borderRadius: "16px", border: "1px solid var(--border-color)", overflow: "hidden", boxShadow: "var(--shadow)" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", minWidth: "720px" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border-color)", background: "var(--table-header-bg)" }}>
                    {["Waktu", "Aktor", "Aksi", "Tabel", "Ref", "Ringkasan"].map(h => (
                      <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: "11px", fontWeight: 700, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={6} style={{ padding: "40px", textAlign: "center", color: "var(--text-secondary)" }}>Memuat…</td></tr>
                  ) : filtered.length === 0 ? (
                    <tr><td colSpan={6} style={{ padding: "48px", textAlign: "center", color: "var(--text-secondary)" }}>
                      <Clock size={32} style={{ margin: "0 auto 10px", display: "block", opacity: 0.35 }} />
                      Belum ada aktivitas tercatat.
                    </td></tr>
                  ) : filtered.map(l => {
                    const w = AKSI_WARNA[l.aksi] || { bg: "var(--input-bg)", color: "var(--text-secondary)" };
                    return (
                      <tr key={l.id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                        <td style={{ padding: "11px 16px", color: "var(--text-secondary)", whiteSpace: "nowrap" }}>
                          {new Date(l.ts).toLocaleString("id-ID", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                        </td>
                        <td style={{ padding: "11px 16px", color: "var(--text-primary)", fontWeight: 500 }}>{l.actor_email}</td>
                        <td style={{ padding: "11px 16px" }}>
                          <span style={{ padding: "3px 9px", borderRadius: "20px", fontSize: "11px", fontWeight: 700, background: w.bg, color: w.color }}>
                            {l.aksi === "INSERT" ? "Tambah" : l.aksi === "UPDATE" ? "Ubah" : l.aksi === "DELETE" ? "Hapus" : l.aksi}
                          </span>
                        </td>
                        <td style={{ padding: "11px 16px", color: "var(--text-secondary)" }}>{TABEL_LABEL[l.tabel] || l.tabel}</td>
                        <td style={{ padding: "11px 16px", color: "var(--text-secondary)" }}>{l.ref || "—"}</td>
                        <td style={{ padding: "11px 16px", color: "var(--text-primary)" }}>{l.ringkas || "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          <p style={{ fontSize: "11px", color: "var(--text-secondary)", margin: "12px 2px 0" }}>Menampilkan maksimal 300 entri terbaru.</p>
        </>
      )}
    </div>
  );
}
