"use client";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "../../lib/supabase";
import { CreditCard, CheckCircle2, Clock, AlertTriangle, Copy, Check, Banknote, TrendingUp, Printer, MessageCircle, X } from "lucide-react";

type Pasien = {
  nomor_antrian: number; nama: string; keluhan: string;
  status: string; created_at: string; no_hp?: string;
  biaya?: number; status_bayar?: string;
};

const BIAYA_PRESET = [50000, 75000, 100000, 150000, 200000];

const MIGRATION_SQL = `-- Jalankan di Supabase Dashboard → SQL Editor
ALTER TABLE pasien ADD COLUMN IF NOT EXISTS biaya INTEGER DEFAULT 0;
ALTER TABLE pasien ADD COLUMN IF NOT EXISTS status_bayar TEXT DEFAULT 'Belum Bayar';`;

function getTodayRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end   = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  return { start: start.toISOString(), end: end.toISOString() };
}

function padNo(n: number) { return String(n).padStart(3, "0"); }
function fmtRupiah(n: number) { return "Rp " + n.toLocaleString("id-ID"); }

export default function KasirPage() {
  const [pasienList, setPasienList] = useState<Pasien[]>([]);
  const [colsOk, setColsOk] = useState<boolean | null>(null);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState<number | null>(null); // nomor_antrian being saved
  const [toast, setToast] = useState<string | null>(null);
  // Local edits: map nomor_antrian → {biaya, status_bayar}
  const [edits, setEdits] = useState<Map<number, { biaya: string; status_bayar: string }>>(new Map());
  const [notaModal, setNotaModal] = useState<{ p: Pasien; biaya: number } | null>(null);

  const today = getTodayRange();

  const fetchPasien = useCallback(async () => {
    const { data, error } = await supabase.from("pasien")
      .select("nomor_antrian, nama, keluhan, status, created_at, no_hp, biaya, status_bayar")
      .gte("created_at", today.start).lte("created_at", today.end)
      .order("nomor_antrian", { ascending: true });

    if (error) {
      const msg = (error.message || "").toLowerCase();
      if (msg.includes("column") || error.code === "42703" || error.code === "PGRST204") setColsOk(false);
    } else {
      setColsOk(true);
      if (data) setPasienList(data);
    }
  }, []);

  useEffect(() => {
    fetchPasien();
    const channel = supabase.channel("realtime-kasir")
      .on("postgres_changes", { event: "*", schema: "public", table: "pasien" }, fetchPasien)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchPasien]);

  function getEdit(p: Pasien) {
    return edits.get(p.nomor_antrian) ?? { biaya: String(p.biaya ?? 0), status_bayar: p.status_bayar ?? "Belum Bayar" };
  }

  function setEdit(nomor: number, patch: Partial<{ biaya: string; status_bayar: string }>) {
    setEdits(m => {
      const cur = m.get(nomor) ?? { biaya: "0", status_bayar: "Belum Bayar" };
      const next = new Map(m);
      next.set(nomor, { ...cur, ...patch });
      return next;
    });
  }

  async function saveRow(p: Pasien) {
    const edit = getEdit(p);
    const biaya = parseInt(edit.biaya.replace(/\D/g, "")) || 0;
    setSaving(p.nomor_antrian);
    const { start, end } = getTodayRange();
    const { error } = await supabase.from("pasien")
      .update({ biaya, status_bayar: edit.status_bayar })
      .eq("nomor_antrian", p.nomor_antrian)
      .gte("created_at", start).lte("created_at", end);
    if (error) {
      setToast(`Gagal: ${error.message}`);
    } else {
      setToast(`✓ ${p.nama} — ${fmtRupiah(biaya)} (${edit.status_bayar})`);
      fetchPasien();
    }
    setSaving(null);
    setTimeout(() => setToast(null), 3500);
  }

  async function quickLunas(p: Pasien) {
    const edit = getEdit(p);
    setEdit(p.nomor_antrian, { status_bayar: "Lunas" });
    const biaya = parseInt(edit.biaya.replace(/\D/g, "")) || 0;
    const { start, end } = getTodayRange();
    await supabase.from("pasien").update({ biaya, status_bayar: "Lunas" })
      .eq("nomor_antrian", p.nomor_antrian)
      .gte("created_at", start).lte("created_at", end);
    fetchPasien();
  }

  function openNota(p: Pasien) {
    const edit = getEdit(p);
    const biaya = parseInt(edit.biaya.replace(/\D/g, "")) || 0;
    setNotaModal({ p, biaya });
  }

  function sendWABayar(p: Pasien) {
    if (!p.no_hp) { setToast("Nomor HP pasien tidak tersedia"); setTimeout(() => setToast(null), 3000); return; }
    const edit = getEdit(p);
    const biaya = parseInt(edit.biaya.replace(/\D/g, "")) || 0;
    const phone = p.no_hp.replace(/\D/g, "").replace(/^0/, "62");
    const msg = `Yth. ${p.nama},\n\nTerima kasih telah berkunjung ke Klinik & RB Afina.\n\nRincian pembayaran:\n• Keluhan: ${p.keluhan}\n• Total Biaya: ${fmtRupiah(biaya)}\n• Status: LUNAS ✓\n• Tanggal: ${new Date().toLocaleDateString("id-ID")}\n\nSemoga lekas sembuh 🙏`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, "_blank");
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(MIGRATION_SQL).catch(() => {});
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  }

  // Summary stats
  const totalPasien = pasienList.length;
  const selesai = pasienList.filter(p => p.status === "Selesai").length;
  const lunas = pasienList.filter(p => (edits.get(p.nomor_antrian)?.status_bayar ?? p.status_bayar) === "Lunas").length;
  const totalPendapatan = pasienList
    .filter(p => (edits.get(p.nomor_antrian)?.status_bayar ?? p.status_bayar) === "Lunas")
    .reduce((s, p) => s + (parseInt((edits.get(p.nomor_antrian)?.biaya ?? String(p.biaya ?? 0)).replace(/\D/g, "")) || 0), 0);

  const todayStr = new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  const statusColor = (s: string) => s === "Selesai" ? "#059669" : s === "Sedang Diperiksa" ? "#0284c7" : "#d97706";

  return (
    <div>
      <style>{`
        .kasir-row:hover { background: var(--table-hover) !important; }
        .k-btn { transition: all 0.18s; cursor: pointer; }
        .k-btn:hover { filter: brightness(1.08); transform: translateY(-1px); }
        .biaya-input { background: var(--input-bg); border: 1px solid var(--border-color); border-radius: 8px; padding: 8px 10px; font-size: 13px; color: var(--text-primary); outline: none; font-family: inherit; width: 120px; box-sizing: border-box; }
        .biaya-input:focus { border-color: var(--accent); }
        .preset-btn { background: var(--input-bg); border: 1px solid var(--border-color); border-radius: 6px; padding: 4px 8px; font-size: 10px; font-weight: 600; color: var(--text-secondary); cursor: pointer; transition: all 0.14s; }
        .preset-btn:hover { border-color: var(--accent); color: var(--accent); }
        .table-wrapper { overflow-x: auto; -webkit-overflow-scrolling: touch; }
        .table-wrapper table { min-width: 680px; }
        .nota-overlay { position: fixed; inset: 0; z-index: 9000; background: rgba(0,0,0,0.55); display: flex; align-items: center; justify-content: center; padding: 20px; animation: fadeIn 0.18s ease; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .nota-card { background: #fff; border-radius: 20px; padding: 32px; max-width: 340px; width: 100%; box-shadow: 0 20px 60px rgba(0,0,0,0.25); animation: slideUp 0.2s cubic-bezier(0.34,1.56,0.64,1); }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @media print {
          body > * { display: none !important; }
          .nota-overlay { display: block !important; position: static !important; background: none !important; padding: 0 !important; animation: none !important; }
          .nota-card { box-shadow: none !important; border: 1px solid #ddd; border-radius: 0; animation: none !important; max-width: 100%; }
          .nota-no-print { display: none !important; }
        }
      `}</style>

      {/* Nota Modal */}
      {notaModal && (
        <div className="nota-overlay" onClick={e => { if (e.target === e.currentTarget) setNotaModal(null); }}>
          <div className="nota-card">
            <div style={{ textAlign: "center", marginBottom: "20px" }}>
              <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "#6C5CE7", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px" }}>
                <span style={{ color: "#fff", fontSize: "20px", fontWeight: 900 }}>A</span>
              </div>
              <p style={{ fontSize: "14px", fontWeight: 800, color: "#6C5CE7", margin: 0 }}>Klinik & RB Afina</p>
              <p style={{ fontSize: "11px", color: "#888", margin: "2px 0 0" }}>Bukti Pembayaran</p>
            </div>
            <div style={{ borderTop: "1px dashed #ddd", borderBottom: "1px dashed #ddd", padding: "16px 0", margin: "0 0 16px" }}>
              {[
                { label: "No. Antrian", val: padNo(notaModal.p.nomor_antrian) },
                { label: "Nama Pasien", val: notaModal.p.nama },
                { label: "Keluhan", val: notaModal.p.keluhan },
                { label: "Tanggal", val: new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) },
                { label: "Waktu", val: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) },
              ].map(({ label, val }) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", gap: "12px", marginBottom: "8px" }}>
                  <span style={{ fontSize: "12px", color: "#888", fontWeight: 600, flexShrink: 0 }}>{label}</span>
                  <span style={{ fontSize: "12px", color: "#1A1A2E", fontWeight: 600, textAlign: "right" }}>{val}</span>
                </div>
              ))}
            </div>
            <div style={{ background: "#f0fdf4", borderRadius: "12px", padding: "14px", textAlign: "center", marginBottom: "20px" }}>
              <p style={{ fontSize: "11px", color: "#059669", fontWeight: 700, margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Total Pembayaran</p>
              <p style={{ fontSize: "28px", fontWeight: 900, color: "#059669", margin: 0 }}>{fmtRupiah(notaModal.biaya)}</p>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", background: "rgba(16,185,129,0.1)", color: "#059669", border: "1px solid rgba(16,185,129,0.3)", borderRadius: "20px", padding: "3px 10px", fontSize: "11px", fontWeight: 700, marginTop: "6px" }}>
                <CheckCircle2 size={11} /> LUNAS
              </span>
            </div>
            <p style={{ textAlign: "center", fontSize: "11px", color: "#aaa", margin: "0 0 20px" }}>Terima kasih atas kepercayaan Anda.</p>
            <div className="nota-no-print" style={{ display: "flex", gap: "10px" }}>
              <button onClick={() => window.print()} style={{ flex: 1, background: "#6C5CE7", border: "none", borderRadius: "12px", padding: "12px", color: "#fff", fontSize: "13px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "7px" }}>
                <Printer size={14} /> Cetak Nota
              </button>
              <button onClick={() => setNotaModal(null)} style={{ flex: 1, background: "rgba(108,92,231,0.08)", border: "1px solid rgba(108,92,231,0.2)", borderRadius: "12px", padding: "12px", color: "#6C5CE7", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}>
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", top: "20px", right: "20px", zIndex: 9999, background: "#fff", borderLeft: "4px solid #10b981", borderRadius: "12px", padding: "14px 18px", boxShadow: "0 4px 20px rgba(0,0,0,0.12)", display: "flex", alignItems: "center", gap: "10px", minWidth: "280px" }}>
          <CheckCircle2 size={16} color="#10b981" />
          <span style={{ fontSize: "13px", fontWeight: 500, color: "#1A1A2E" }}>{toast}</span>
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>Kasir</h1>
        <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: "4px 0 0", textTransform: "capitalize" }}>{todayStr}</p>
      </div>

      {/* Migration banner */}
      {colsOk === false && (
        <div style={{ background: "rgba(245,166,35,0.06)", border: "1px solid rgba(245,166,35,0.35)", borderRadius: "16px", padding: "20px", marginBottom: "24px" }}>
          <div style={{ display: "flex", gap: "10px", marginBottom: "12px", alignItems: "flex-start" }}>
            <AlertTriangle size={16} color="#d97706" style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <p style={{ fontSize: "13px", fontWeight: 700, color: "#92400e", margin: 0 }}>Kolom biaya & status_bayar belum ada</p>
              <p style={{ fontSize: "12px", color: "#b45309", margin: "3px 0 0" }}>Jalankan SQL ini di Supabase Dashboard → SQL Editor → New Query</p>
            </div>
          </div>
          <pre style={{ background: "#1e1d35", color: "#c4b5fd", fontFamily: "monospace", fontSize: "12px", padding: "14px", borderRadius: "10px", overflow: "auto", margin: "0 0 12px", lineHeight: 1.7 }}>{MIGRATION_SQL}</pre>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <button onClick={handleCopy} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "7px 14px", borderRadius: "8px", fontSize: "12px", fontWeight: 600, background: copied ? "#10b981" : "rgba(245,166,35,0.15)", color: copied ? "#fff" : "#92400e", border: `1px solid ${copied ? "#10b981" : "rgba(245,166,35,0.3)"}`, cursor: "pointer" }}>
              {copied ? <Check size={12} /> : <Copy size={12} />}{copied ? "Tersalin!" : "Salin SQL"}
            </button>
            <button onClick={fetchPasien} style={{ padding: "7px 14px", borderRadius: "8px", fontSize: "12px", fontWeight: 600, background: "transparent", color: "#b45309", border: "1px solid rgba(245,166,35,0.3)", cursor: "pointer" }}>↻ Cek ulang</button>
          </div>
        </div>
      )}

      {/* Summary cards */}
      {colsOk && (
        <div data-tour="kasir-summary" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "14px", marginBottom: "24px" }}>
          {[
            { label: "Pasien Hari Ini", val: totalPasien, color: "#7B61FF", icon: CreditCard },
            { label: "Selesai Diperiksa", val: selesai, color: "#0284c7", icon: CheckCircle2 },
            { label: "Sudah Bayar", val: lunas, color: "#059669", icon: Banknote },
            { label: "Total Pendapatan", val: fmtRupiah(totalPendapatan), color: "#d97706", icon: TrendingUp },
          ].map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} style={{ background: "var(--bg-card)", borderRadius: "14px", padding: "18px", border: "1px solid var(--border-color)", boxShadow: "var(--shadow)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                  <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: `${s.color}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon size={17} color={s.color} />
                  </div>
                </div>
                <p style={{ fontSize: typeof s.val === "string" ? "16px" : "28px", fontWeight: 800, color: "var(--text-primary)", margin: 0, lineHeight: 1 }}>{s.val}</p>
                <p style={{ fontSize: "11px", color: "var(--text-secondary)", margin: "6px 0 0", fontWeight: 500 }}>{s.label}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Table */}
      <div style={{ background: "var(--bg-card)", borderRadius: "16px", border: "1px solid var(--border-color)", overflow: "hidden", boxShadow: "var(--shadow)" }}>
        <div data-tour="kasir-table" className="table-wrapper">
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-color)", background: "var(--table-header-bg)" }}>
                {["No", "Nama", "Keluhan", "Status", "Biaya", "Pembayaran"].map(h => (
                  <th key={h} style={{ padding: "14px 18px", textAlign: "left", fontSize: "11px", fontWeight: 700, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pasienList.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: "56px", textAlign: "center", color: "var(--text-secondary)" }}>
                    <Clock size={36} style={{ margin: "0 auto 12px", display: "block", opacity: 0.35 }} />
                    <p style={{ margin: 0, fontWeight: 600 }}>Belum ada pasien hari ini</p>
                  </td>
                </tr>
              ) : pasienList.map((p) => {
                const edit = getEdit(p);
                const isLunas = edit.status_bayar === "Lunas";
                const isSaving = saving === p.nomor_antrian;
                return (
                  <tr key={p.nomor_antrian} className="kasir-row" style={{ borderBottom: "1px solid var(--border-color)", transition: "background 0.15s" }}>
                    <td style={{ padding: "14px 18px", fontWeight: 800, color: "var(--accent)", fontSize: "15px" }}>{padNo(p.nomor_antrian)}</td>
                    <td style={{ padding: "14px 18px", fontWeight: 600, color: "var(--text-primary)" }}>{p.nama}</td>
                    <td style={{ padding: "14px 18px", color: "var(--text-secondary)" }}>{p.keluhan}</td>
                    <td style={{ padding: "14px 18px" }}>
                      <span style={{ padding: "4px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 700, background: `${statusColor(p.status)}18`, color: statusColor(p.status), border: `1px solid ${statusColor(p.status)}40` }}>
                        {p.status}
                      </span>
                    </td>
                    <td style={{ padding: "10px 18px" }}>
                      {colsOk ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                          <input
                            className="biaya-input"
                            value={edit.biaya}
                            onChange={e => setEdit(p.nomor_antrian, { biaya: e.target.value })}
                            placeholder="0"
                            type="text"
                            inputMode="numeric"
                          />
                          <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                            {BIAYA_PRESET.map(v => (
                              <button key={v} className="preset-btn" onClick={() => setEdit(p.nomor_antrian, { biaya: String(v) })}>
                                {(v / 1000)}rb
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : <span style={{ color: "var(--text-secondary)", fontSize: "12px" }}>—</span>}
                    </td>
                    <td style={{ padding: "14px 18px" }}>
                      {colsOk ? (
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                          {isLunas ? (<>
                            <span style={{ display: "flex", alignItems: "center", gap: "5px", padding: "6px 12px", borderRadius: "8px", background: "rgba(16,185,129,0.1)", color: "#059669", fontSize: "12px", fontWeight: 700, border: "1px solid rgba(16,185,129,0.25)" }}>
                              <CheckCircle2 size={13} /> Lunas
                            </span>
                            <button className="k-btn" onClick={() => openNota(p)} title="Cetak nota"
                              style={{ padding: "7px 9px", borderRadius: "8px", background: "rgba(108,92,231,0.1)", border: "1px solid rgba(108,92,231,0.2)", color: "var(--accent)", display: "flex", alignItems: "center" }}>
                              <Printer size={13} />
                            </button>
                            {p.no_hp && (
                              <button className="k-btn" onClick={() => sendWABayar(p)} title="Kirim WA bukti bayar"
                                style={{ padding: "7px 9px", borderRadius: "8px", background: "rgba(37,211,102,0.1)", border: "1px solid rgba(37,211,102,0.3)", color: "#16a34a", display: "flex", alignItems: "center" }}>
                                <MessageCircle size={13} />
                              </button>
                            )}
                          </>) : (
                            <button className="k-btn" onClick={() => quickLunas(p)}
                              style={{ display: "flex", alignItems: "center", gap: "5px", padding: "7px 12px", borderRadius: "8px", background: "rgba(108,92,231,0.1)", color: "var(--accent)", border: "1px solid rgba(108,92,231,0.2)", fontSize: "12px", fontWeight: 600 }}>
                              <Banknote size={13} /> Tandai Lunas
                            </button>
                          )}
                          <button className="k-btn" onClick={() => saveRow(p)} disabled={isSaving}
                            style={{ padding: "7px 10px", borderRadius: "8px", background: "var(--input-bg)", border: "1px solid var(--border-color)", color: "var(--text-secondary)", fontSize: "12px", fontWeight: 600, display: "flex", alignItems: "center", gap: "4px", opacity: isSaving ? 0.6 : 1 }}>
                            {isSaving ? "..." : "Simpan"}
                          </button>
                        </div>
                      ) : <span style={{ color: "var(--text-secondary)", fontSize: "12px" }}>—</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
