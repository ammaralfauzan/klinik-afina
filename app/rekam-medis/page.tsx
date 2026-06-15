"use client";
import { useEffect, useState, useCallback, useMemo } from "react";
import { supabase } from "../../lib/supabase";
import { FileText, Save, X, CheckCircle2, AlertTriangle, Copy, Check, Clock, Stethoscope, Printer } from "lucide-react";

type Pasien = {
  nomor_antrian: number; nama: string; keluhan: string;
  status: string; created_at: string; no_hp?: string;
};

type RM = {
  id?: string; nomor_antrian: number; visit_date: string;
  pasien_nama: string; pasien_keluhan: string;
  diagnosa: string; tindakan: string; obat: string; catatan: string; dokter: string;
};

const EMPTY_RM = { diagnosa: "", tindakan: "", obat: "", catatan: "", dokter: "dr. Umum" };

const MIGRATION_SQL = `-- Jalankan di Supabase Dashboard → SQL Editor
CREATE TABLE IF NOT EXISTS rekam_medis (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nomor_antrian INTEGER,
  visit_date DATE NOT NULL,
  pasien_nama TEXT NOT NULL,
  pasien_keluhan TEXT DEFAULT '',
  diagnosa TEXT DEFAULT '',
  tindakan TEXT DEFAULT '',
  obat TEXT DEFAULT '',
  catatan TEXT DEFAULT '',
  dokter TEXT DEFAULT 'dr. Umum',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE rekam_medis DISABLE ROW LEVEL SECURITY;`;

function getTodayRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end   = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  return { start: start.toISOString(), end: end.toISOString(), date: start.toISOString().split("T")[0] };
}

function padNo(n: number) { return String(n).padStart(3, "0"); }

export default function RekamMedisPage() {
  const [pasienList, setPasienList] = useState<Pasien[]>([]);
  const [rmMap, setRmMap] = useState<Map<string, RM>>(new Map());
  const [modal, setModal] = useState<{ pasien: Pasien; rm: Partial<RM> } | null>(null);
  const [saving, setSaving] = useState(false);
  const [tableOk, setTableOk] = useState<boolean | null>(null);
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [tab, setTab] = useState<"hari-ini" | "historis">("hari-ini");
  const [historis, setHistoris] = useState<RM[]>([]);
  const [expandedPatient, setExpandedPatient] = useState<string | null>(null);
  const [searchH, setSearchH] = useState("");
  const [resepModal, setResepModal] = useState<RM | null>(null);

  const today = getTodayRange();

  const fetchData = useCallback(async () => {
    // Fetch today's patients
    const { data: pData } = await supabase.from("pasien")
      .select("*").gte("created_at", today.start).lte("created_at", today.end)
      .order("nomor_antrian", { ascending: true });
    if (pData) setPasienList(pData);

    // Fetch today's rekam medis
    const { data: rmData, error: rmErr } = await supabase.from("rekam_medis")
      .select("*").eq("visit_date", today.date);
    if (rmErr) {
      setTableOk(false);
    } else {
      setTableOk(true);
      const map = new Map<string, RM>();
      (rmData || []).forEach((r: RM) => { map.set(rmKey(r.nomor_antrian, r.pasien_nama), r); });
      setRmMap(map);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const channel = supabase.channel("realtime-rm")
      .on("postgres_changes", { event: "*", schema: "public", table: "pasien" }, fetchData)
      .on("postgres_changes", { event: "*", schema: "public", table: "rekam_medis" }, fetchData)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchData]);

  useEffect(() => {
    if (tab !== "historis" || !tableOk) return;
    supabase.from("rekam_medis").select("*").order("visit_date", { ascending: false }).then(({ data }) => {
      if (data) setHistoris(data as RM[]);
    });
  }, [tab, tableOk]);

  const historisGrouped = useMemo(() => {
    const map = new Map<string, { nama: string; visits: RM[] }>();
    historis.forEach(r => {
      const key = r.pasien_nama.toLowerCase().trim();
      const cur = map.get(key) || { nama: r.pasien_nama, visits: [] };
      cur.visits.push(r);
      map.set(key, cur);
    });
    return Array.from(map.values())
      .filter(g => !searchH || g.nama.toLowerCase().includes(searchH.toLowerCase()))
      .sort((a, b) => new Date(b.visits[0].visit_date).getTime() - new Date(a.visits[0].visit_date).getTime());
  }, [historis, searchH]);

  function rmKey(nomor: number, nama: string) { return `${nomor}__${nama.toLowerCase().trim()}`; }

  function openModal(p: Pasien) {
    const key = rmKey(p.nomor_antrian, p.nama);
    const existing = rmMap.get(key);
    setModal({
      pasien: p,
      rm: existing ? { ...existing } : { ...EMPTY_RM, nomor_antrian: p.nomor_antrian, visit_date: today.date, pasien_nama: p.nama, pasien_keluhan: p.keluhan },
    });
  }

  async function saveRM() {
    if (!modal) return;
    setSaving(true);
    const key = rmKey(modal.pasien.nomor_antrian, modal.pasien.nama);
    const existing = rmMap.get(key);
    const payload = {
      nomor_antrian: modal.pasien.nomor_antrian,
      visit_date: today.date,
      pasien_nama: modal.pasien.nama,
      pasien_keluhan: modal.pasien.keluhan,
      diagnosa: modal.rm.diagnosa || "",
      tindakan: modal.rm.tindakan || "",
      obat: modal.rm.obat || "",
      catatan: modal.rm.catatan || "",
      dokter: modal.rm.dokter || "dr. Umum",
      updated_at: new Date().toISOString(),
    };

    let error;
    if (existing?.id) {
      ({ error } = await supabase.from("rekam_medis").update(payload).eq("id", existing.id));
    } else {
      ({ error } = await supabase.from("rekam_medis").insert([payload]));
    }

    if (error) {
      setToast({ type: "error", msg: `Gagal menyimpan: ${error.message}` });
    } else {
      setToast({ type: "success", msg: `Rekam medis ${modal.pasien.nama} berhasil disimpan` });
      setModal(null);
      fetchData();
    }
    setSaving(false);
    setTimeout(() => setToast(null), 4000);
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(MIGRATION_SQL).catch(() => {});
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  }

  const statusColor = (s: string) => s === "Selesai" ? "#059669" : s === "Sedang Diperiksa" ? "#0284c7" : "#d97706";
  const statusBg   = (s: string) => s === "Selesai" ? "rgba(16,185,129,0.1)" : s === "Sedang Diperiksa" ? "rgba(14,165,233,0.1)" : "rgba(245,158,11,0.1)";
  const todayStr = new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <div>
      <style>{`
        .rm-row:hover { background: var(--table-hover) !important; }
        .tab-btn { padding: 8px 18px; border-radius: 8px; font-size: 13px; font-weight: 600; border: none; cursor: pointer; transition: all 0.15s; font-family: inherit; background: transparent; color: var(--text-secondary); }
        .tab-btn:hover { background: var(--input-bg); color: var(--text-primary); }
        .tab-btn.active { background: var(--accent); color: #fff; }
        .rm-btn { transition: all 0.18s; cursor: pointer; }
        .rm-btn:hover { filter: brightness(1.08); transform: translateY(-1px); }
        .modal-overlay { position: fixed; inset: 0; z-index: 8000; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; padding: 20px; animation: fadeIn 0.18s ease; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .modal-card { background: var(--bg-card); border-radius: 20px; width: 100%; max-width: 560px; max-height: 90vh; overflow-y: auto; box-shadow: 0 24px 64px rgba(0,0,0,0.2); animation: slideUp 0.2s cubic-bezier(0.34,1.56,0.64,1); }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .rm-input { width: 100%; background: var(--input-bg); border: 1px solid var(--border-color); border-radius: 10px; padding: 10px 13px; font-size: 13px; color: var(--text-primary); outline: none; transition: border 0.2s; font-family: inherit; box-sizing: border-box; resize: none; }
        .rm-input:focus { border-color: var(--accent); }
        .rm-label { font-size: 11px; font-weight: 700; color: var(--accent); text-transform: uppercase; letter-spacing: 0.06em; display: block; margin-bottom: 6px; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .table-wrapper { overflow-x: auto; -webkit-overflow-scrolling: touch; }
        .table-wrapper table { min-width: 580px; }
        /* Resep print */
        .resep-overlay { position: fixed; inset: 0; z-index: 9500; background: rgba(0,0,0,0.55); display: flex; align-items: center; justify-content: center; padding: 20px; animation: fadeIn 0.18s ease; }
        .resep-card { background: #fff; border-radius: 16px; padding: 32px; max-width: 420px; width: 100%; box-shadow: 0 20px 60px rgba(0,0,0,0.25); max-height: 90vh; overflow-y: auto; }
        @media print {
          body > * { display: none !important; }
          .resep-overlay { display: block !important; position: static !important; background: none !important; padding: 0 !important; }
          .resep-card { box-shadow: none !important; border-radius: 0; border: none; max-width: 100%; max-height: none; }
          .resep-no-print { display: none !important; }
        }
      `}</style>

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", top: "20px", right: "20px", zIndex: 9999, background: "#fff", borderLeft: `4px solid ${toast.type === "success" ? "#10b981" : "#ef4444"}`, borderRadius: "12px", padding: "14px 18px", boxShadow: "0 4px 20px rgba(0,0,0,0.12)", display: "flex", alignItems: "center", gap: "10px", minWidth: "280px" }}>
          <CheckCircle2 size={16} color={toast.type === "success" ? "#10b981" : "#ef4444"} />
          <span style={{ fontSize: "13px", fontWeight: 500, color: "#1A1A2E" }}>{toast.msg}</span>
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>Rekam Medis</h1>
        <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: "4px 0 0", textTransform: "capitalize" }}>{todayStr}</p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "4px", marginBottom: "20px", background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "10px", padding: "4px", width: "fit-content", boxShadow: "var(--shadow)" }}>
        <button className={`tab-btn${tab === "hari-ini" ? " active" : ""}`} onClick={() => setTab("hari-ini")}>Hari Ini</button>
        <button className={`tab-btn${tab === "historis" ? " active" : ""}`} onClick={() => setTab("historis")}>Historis</button>
      </div>

      {/* Migration banner */}
      {tableOk === false && (
        <div style={{ background: "rgba(245,166,35,0.06)", border: "1px solid rgba(245,166,35,0.35)", borderRadius: "16px", padding: "20px", marginBottom: "24px" }}>
          <div style={{ display: "flex", gap: "10px", marginBottom: "12px", alignItems: "flex-start" }}>
            <AlertTriangle size={16} color="#d97706" style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <p style={{ fontSize: "13px", fontWeight: 700, color: "#92400e", margin: 0 }}>Tabel rekam_medis belum dibuat</p>
              <p style={{ fontSize: "12px", color: "#b45309", margin: "3px 0 0" }}>Jalankan SQL ini di Supabase Dashboard → SQL Editor → New Query</p>
            </div>
          </div>
          <pre style={{ background: "#1e1d35", color: "#c4b5fd", fontFamily: "monospace", fontSize: "12px", padding: "14px", borderRadius: "10px", overflow: "auto", margin: "0 0 12px", lineHeight: 1.7 }}>{MIGRATION_SQL}</pre>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <button onClick={handleCopy} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "7px 14px", borderRadius: "8px", fontSize: "12px", fontWeight: 600, background: copied ? "#10b981" : "rgba(245,166,35,0.15)", color: copied ? "#fff" : "#92400e", border: `1px solid ${copied ? "#10b981" : "rgba(245,166,35,0.3)"}`, cursor: "pointer" }}>
              {copied ? <Check size={12} /> : <Copy size={12} />}{copied ? "Tersalin!" : "Salin SQL"}
            </button>
            <button onClick={fetchData} style={{ padding: "7px 14px", borderRadius: "8px", fontSize: "12px", fontWeight: 600, background: "transparent", color: "#b45309", border: "1px solid rgba(245,166,35,0.3)", cursor: "pointer" }}>↻ Cek ulang</button>
          </div>
        </div>
      )}

      {/* Historis tab content */}
      {tab === "historis" && (
        <div>
          <div style={{ marginBottom: "16px" }}>
            <input
              style={{ background: "var(--input-bg)", border: "1px solid var(--border-color)", borderRadius: "10px", padding: "9px 14px", fontSize: "13px", color: "var(--text-primary)", outline: "none", width: "100%", maxWidth: "320px", fontFamily: "inherit", boxSizing: "border-box" as const }}
              placeholder="Cari nama pasien..."
              value={searchH}
              onChange={e => setSearchH(e.target.value)}
            />
          </div>
          {historisGrouped.length === 0 ? (
            <div style={{ background: "var(--bg-card)", borderRadius: "16px", border: "1px solid var(--border-color)", padding: "56px", textAlign: "center", color: "var(--text-secondary)" }}>
              <FileText size={36} style={{ margin: "0 auto 12px", display: "block", opacity: 0.35 }} />
              <p style={{ margin: 0, fontWeight: 600 }}>{searchH ? "Tidak ditemukan" : "Belum ada rekam medis tersimpan"}</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {historisGrouped.map(g => (
                <div key={g.nama} style={{ background: "var(--bg-card)", borderRadius: "14px", border: "1px solid var(--border-color)", overflow: "hidden", boxShadow: "var(--shadow)" }}>
                  <div
                    onClick={() => setExpandedPatient(expandedPatient === g.nama ? null : g.nama)}
                    style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: "14px", cursor: "pointer", transition: "background 0.15s" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "var(--input-bg)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "rgba(108,92,231,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: "16px", fontWeight: 800, color: "var(--accent)" }}>
                      {g.nama.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: "var(--text-primary)" }}>{g.nama}</p>
                      <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--text-secondary)" }}>
                        {g.visits.length} kunjungan · Terakhir: {new Date(g.visits[0].visit_date).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                      </p>
                    </div>
                    <span style={{ fontSize: "18px", color: "var(--text-secondary)", transition: "transform 0.2s", transform: expandedPatient === g.nama ? "rotate(90deg)" : "none" }}>›</span>
                  </div>
                  {expandedPatient === g.nama && (
                    <div style={{ borderTop: "1px solid var(--border-color)" }}>
                      {g.visits.map((v, i) => (
                        <div key={v.id} style={{ padding: "16px 20px", borderBottom: i < g.visits.length - 1 ? "1px solid var(--border-color)" : "none" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                            <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--accent)", background: "rgba(108,92,231,0.08)", border: "1px solid rgba(108,92,231,0.2)", padding: "3px 10px", borderRadius: "20px" }}>
                              {new Date(v.visit_date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                            </span>
                            <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{v.pasien_keluhan}</span>
                            <span style={{ marginLeft: "auto", fontSize: "12px", color: "var(--text-secondary)" }}>{v.dokter}</span>
                          </div>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                            {[
                              { label: "Diagnosa", val: v.diagnosa },
                              { label: "Tindakan", val: v.tindakan },
                              { label: "Obat", val: v.obat },
                              { label: "Catatan", val: v.catatan },
                            ].filter(r => r.val).map(({ label, val }) => (
                              <div key={label}>
                                <p style={{ fontSize: "10px", fontWeight: 700, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 3px" }}>{label}</p>
                                <p style={{ fontSize: "12px", color: "var(--text-primary)", margin: 0, lineHeight: 1.5, whiteSpace: "pre-line" }}>{val}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Table — hari ini */}
      {tab === "hari-ini" && (
      <div style={{ background: "var(--bg-card)", borderRadius: "16px", border: "1px solid var(--border-color)", overflow: "hidden", boxShadow: "var(--shadow)" }}>
        <div className="table-wrapper">
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-color)", background: "var(--table-header-bg)" }}>
                {["No", "Nama Pasien", "Keluhan", "Status", "Rekam Medis"].map(h => (
                  <th key={h} style={{ padding: "14px 18px", textAlign: "left", fontSize: "11px", fontWeight: 700, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pasienList.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: "56px", textAlign: "center", color: "var(--text-secondary)" }}>
                    <Clock size={36} style={{ margin: "0 auto 12px", display: "block", opacity: 0.35 }} />
                    <p style={{ margin: 0, fontWeight: 600 }}>Belum ada pasien hari ini</p>
                  </td>
                </tr>
              ) : pasienList.map((p) => {
                const key = rmKey(p.nomor_antrian, p.nama);
                const hasRM = rmMap.has(key);
                const canFill = p.status === "Sedang Diperiksa" || p.status === "Selesai";
                return (
                  <tr key={p.nomor_antrian} className="rm-row" style={{ borderBottom: "1px solid var(--border-color)", transition: "background 0.15s" }}>
                    <td style={{ padding: "16px 18px", fontWeight: 800, color: "var(--accent)", fontSize: "15px" }}>{padNo(p.nomor_antrian)}</td>
                    <td style={{ padding: "16px 18px", fontWeight: 600, color: "var(--text-primary)" }}>{p.nama}</td>
                    <td style={{ padding: "16px 18px", color: "var(--text-secondary)" }}>{p.keluhan}</td>
                    <td style={{ padding: "16px 18px" }}>
                      <span style={{ padding: "5px 12px", borderRadius: "20px", fontSize: "11px", fontWeight: 700, background: statusBg(p.status), color: statusColor(p.status), border: `1px solid ${statusColor(p.status)}40` }}>
                        {p.status}
                      </span>
                    </td>
                    <td style={{ padding: "16px 18px" }}>
                      {tableOk && canFill ? (
                        <button className="rm-btn" onClick={() => openModal(p)}
                          style={{ display: "flex", alignItems: "center", gap: "6px", padding: "7px 14px", borderRadius: "8px", fontSize: "12px", fontWeight: 600, border: "none", cursor: "pointer", background: hasRM ? "rgba(16,185,129,0.1)" : "rgba(108,92,231,0.1)", color: hasRM ? "#059669" : "var(--accent)" }}>
                          {hasRM ? <CheckCircle2 size={13} /> : <FileText size={13} />}
                          {hasRM ? "Lihat / Edit" : "Isi Sekarang"}
                        </button>
                      ) : (
                        <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                          {!canFill ? "Tunggu dipanggil" : "—"}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {pasienList.length > 0 && (
          <div style={{ padding: "12px 18px", borderTop: "1px solid var(--border-color)", fontSize: "12px", color: "var(--text-secondary)", display: "flex", gap: "20px" }}>
            <span>Total: <strong style={{ color: "var(--text-primary)" }}>{pasienList.length}</strong></span>
            <span>Rekam medis terisi: <strong style={{ color: "#059669" }}>{rmMap.size}</strong></span>
          </div>
        )}
      </div>
      )}

      {/* Resep Modal */}
      {resepModal && (
        <div className="resep-overlay" onClick={e => { if (e.target === e.currentTarget) setResepModal(null); }}>
          <div className="resep-card">
            {/* Header klinik */}
            <div style={{ borderBottom: "2px solid #6C5CE7", paddingBottom: "14px", marginBottom: "18px", textAlign: "center" }}>
              <p style={{ fontSize: "16px", fontWeight: 800, color: "#6C5CE7", margin: "0 0 2px" }}>Klinik & RB Afina</p>
              <p style={{ fontSize: "11px", color: "#888", margin: 0 }}>Resep Dokter</p>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "14px", fontSize: "12px" }}>
              <div>
                <p style={{ margin: 0, color: "#888" }}>Pasien</p>
                <p style={{ margin: "2px 0 0", fontWeight: 700, color: "#1A1A2E" }}>{resepModal.pasien_nama}</p>
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ margin: 0, color: "#888" }}>Tanggal</p>
                <p style={{ margin: "2px 0 0", fontWeight: 600, color: "#1A1A2E" }}>{new Date(resepModal.visit_date).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</p>
              </div>
            </div>
            {resepModal.diagnosa && (
              <div style={{ background: "#f8f7ff", borderRadius: "10px", padding: "12px 14px", marginBottom: "14px" }}>
                <p style={{ fontSize: "10px", fontWeight: 700, color: "#6C5CE7", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 4px" }}>Diagnosa</p>
                <p style={{ fontSize: "13px", color: "#1A1A2E", margin: 0 }}>{resepModal.diagnosa}</p>
              </div>
            )}
            {/* R/ */}
            <div style={{ borderTop: "1px solid #e0e0e0", paddingTop: "14px", marginBottom: "18px" }}>
              <p style={{ fontSize: "20px", fontStyle: "italic", color: "#6C5CE7", fontWeight: 800, margin: "0 0 10px" }}>R/</p>
              {(resepModal.obat || "—").split("\n").filter(Boolean).map((obat, i) => (
                <div key={i} style={{ display: "flex", gap: "10px", marginBottom: "8px", alignItems: "flex-start" }}>
                  <span style={{ fontSize: "13px", color: "#888", minWidth: "18px" }}>{i + 1}.</span>
                  <p style={{ fontSize: "13px", color: "#1A1A2E", margin: 0, fontWeight: 500 }}>{obat}</p>
                </div>
              ))}
            </div>
            {resepModal.tindakan && (
              <div style={{ marginBottom: "14px" }}>
                <p style={{ fontSize: "11px", fontWeight: 700, color: "#6C5CE7", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 4px" }}>Tindakan</p>
                <p style={{ fontSize: "12px", color: "#444", margin: 0 }}>{resepModal.tindakan}</p>
              </div>
            )}
            {resepModal.catatan && (
              <div style={{ marginBottom: "16px" }}>
                <p style={{ fontSize: "11px", fontWeight: 700, color: "#6C5CE7", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 4px" }}>Catatan</p>
                <p style={{ fontSize: "12px", color: "#444", margin: 0 }}>{resepModal.catatan}</p>
              </div>
            )}
            {/* TTD */}
            <div style={{ borderTop: "1px solid #e0e0e0", paddingTop: "16px", display: "flex", justifyContent: "flex-end" }}>
              <div style={{ textAlign: "center", minWidth: "140px" }}>
                <p style={{ fontSize: "12px", color: "#888", margin: "0 0 40px" }}>{resepModal.dokter}</p>
                <div style={{ borderTop: "1px solid #333", paddingTop: "6px" }}>
                  <p style={{ fontSize: "12px", fontWeight: 700, color: "#1A1A2E", margin: 0 }}>{resepModal.dokter}</p>
                </div>
              </div>
            </div>
            <div className="resep-no-print" style={{ display: "flex", gap: "8px", marginTop: "20px" }}>
              <button onClick={() => window.print()} style={{ flex: 1, background: "#6C5CE7", border: "none", borderRadius: "10px", padding: "11px", color: "#fff", fontSize: "13px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                <Printer size={14} /> Cetak Resep
              </button>
              <button onClick={() => setResepModal(null)} style={{ flex: 1, background: "rgba(108,92,231,0.08)", border: "1px solid rgba(108,92,231,0.2)", borderRadius: "10px", padding: "11px", color: "#6C5CE7", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}>
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setModal(null); }}>
          <div className="modal-card">
            {/* Header */}
            <div style={{ padding: "22px 24px 18px", borderBottom: "1px solid var(--border-color)", display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                  <Stethoscope size={16} color="var(--accent)" />
                  <span style={{ fontSize: "15px", fontWeight: 800, color: "var(--text-primary)" }}>Rekam Medis</span>
                </div>
                <p style={{ margin: 0, fontSize: "12px", color: "var(--text-secondary)" }}>No. {padNo(modal.pasien.nomor_antrian)} · {modal.pasien.nama} · {modal.pasien.keluhan}</p>
              </div>
              <button onClick={() => setModal(null)} style={{ background: "none", border: "none", cursor: "pointer", padding: "4px", display: "flex" }}>
                <X size={18} color="var(--text-secondary)" />
              </button>
            </div>

            {/* Form */}
            <div style={{ padding: "22px 24px", display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Dokter */}
              <div>
                <label className="rm-label">Dokter Pemeriksa</label>
                <input className="rm-input" value={modal.rm.dokter || ""} onChange={e => setModal(m => m ? { ...m, rm: { ...m.rm, dokter: e.target.value } } : m)} placeholder="Nama dokter..." />
              </div>

              {/* Diagnosa */}
              <div>
                <label className="rm-label">Diagnosa <span style={{ color: "#ef4444" }}>*</span></label>
                <textarea className="rm-input" rows={3} value={modal.rm.diagnosa || ""} onChange={e => setModal(m => m ? { ...m, rm: { ...m.rm, diagnosa: e.target.value } } : m)} placeholder="Tulis diagnosa..." />
              </div>

              {/* Tindakan */}
              <div>
                <label className="rm-label">Tindakan</label>
                <textarea className="rm-input" rows={2} value={modal.rm.tindakan || ""} onChange={e => setModal(m => m ? { ...m, rm: { ...m.rm, tindakan: e.target.value } } : m)} placeholder="Tindakan medis yang dilakukan..." />
              </div>

              {/* Obat */}
              <div>
                <label className="rm-label">Obat yang Diberikan</label>
                <textarea className="rm-input" rows={3} value={modal.rm.obat || ""} onChange={e => setModal(m => m ? { ...m, rm: { ...m.rm, obat: e.target.value } } : m)} placeholder="Daftar obat & dosis, satu baris per obat..." />
              </div>

              {/* Catatan */}
              <div>
                <label className="rm-label">Catatan Tambahan</label>
                <textarea className="rm-input" rows={2} value={modal.rm.catatan || ""} onChange={e => setModal(m => m ? { ...m, rm: { ...m.rm, catatan: e.target.value } } : m)} placeholder="Catatan, saran, kontrol kembali..." />
              </div>
            </div>

            {/* Footer */}
            <div style={{ padding: "16px 24px 22px", borderTop: "1px solid var(--border-color)", display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <button onClick={saveRM} disabled={saving} className="rm-btn"
                style={{ flex: 1, minWidth: "140px", background: "var(--accent)", border: "none", borderRadius: "12px", padding: "12px", color: "#fff", fontSize: "13px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "7px", opacity: saving ? 0.7 : 1 }}>
                {saving ? <span style={{ width: "14px", height: "14px", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite", display: "inline-block" }} /> : <Save size={14} />}
                {saving ? "Menyimpan..." : "Simpan Rekam Medis"}
              </button>
              {rmMap.has(rmKey(modal.pasien.nomor_antrian, modal.pasien.nama)) && (
                <button onClick={() => { const rm = rmMap.get(rmKey(modal.pasien.nomor_antrian, modal.pasien.nama)); if (rm) setResepModal(rm); setModal(null); }} className="rm-btn"
                  style={{ padding: "12px 16px", borderRadius: "12px", border: "1px solid rgba(108,92,231,0.25)", background: "rgba(108,92,231,0.08)", color: "var(--accent)", fontSize: "13px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
                  <Printer size={13} /> Cetak Resep
                </button>
              )}
              <button onClick={() => setModal(null)} style={{ padding: "12px 20px", borderRadius: "12px", border: "1px solid var(--border-color)", background: "transparent", color: "var(--text-secondary)", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
