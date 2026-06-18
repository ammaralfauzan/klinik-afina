"use client";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "../../lib/supabase";
import { getTodayRange } from "../../lib/utils";
import { CreditCard, CheckCircle2, Clock, AlertTriangle, Copy, Check, Banknote, TrendingUp, Printer, MessageCircle, X } from "lucide-react";

type Item = { nama: string; harga: number };

type Pasien = {
  nomor_antrian: number; nama: string; keluhan: string;
  status: string; created_at: string; no_hp?: string;
  biaya?: number; status_bayar?: string;
  metode_bayar?: string; nomor_invoice?: string; rincian?: Item[];
};

const BIAYA_PRESET = [50000, 75000, 100000, 150000, 200000];
const METODE_BAYAR = ["Tunai", "QRIS", "Transfer", "Debit/Kartu"];
const ITEM_PRESET = ["Jasa Konsultasi", "Obat", "Tindakan Medis", "Administrasi", "Pemeriksaan"];

const MIGRATION_SQL = `-- Jalankan di Supabase Dashboard → SQL Editor
ALTER TABLE pasien ADD COLUMN IF NOT EXISTS biaya INTEGER DEFAULT 0;
ALTER TABLE pasien ADD COLUMN IF NOT EXISTS status_bayar TEXT DEFAULT 'Belum Bayar';
ALTER TABLE pasien ADD COLUMN IF NOT EXISTS metode_bayar TEXT DEFAULT '';
ALTER TABLE pasien ADD COLUMN IF NOT EXISTS nomor_invoice TEXT DEFAULT '';
ALTER TABLE pasien ADD COLUMN IF NOT EXISTS rincian JSONB DEFAULT '[]'::jsonb;`;

function genInvoice(nomor: number) {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  return `INV-${ymd}-${String(nomor).padStart(3, "0")}`;
}

function padNo(n: number) { return String(n).padStart(3, "0"); }
function fmtRupiah(n: number) { return "Rp " + n.toLocaleString("id-ID"); }

export default function KasirPage() {
  const [pasienList, setPasienList] = useState<Pasien[]>([]);
  const [loading, setLoading] = useState(true);
  const [colsOk, setColsOk] = useState<boolean | null>(null);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState<number | null>(null); // nomor_antrian being saved
  const [toast, setToast] = useState<string | null>(null);
  // Local edits: map nomor_antrian → {biaya, status_bayar}
  const [edits, setEdits] = useState<Map<number, { biaya: string; status_bayar: string; metode_bayar: string }>>(new Map());
  const [notaModal, setNotaModal] = useState<{ p: Pasien; biaya: number; invoice: string; metode: string; rincian: Item[] } | null>(null);
  const [presetTarif, setPresetTarif] = useState<number[]>(BIAYA_PRESET);
  const [rincianModal, setRincianModal] = useState<{ p: Pasien; items: Item[] } | null>(null);

  const today = getTodayRange();

  // Preset biaya diambil dari Tarif di Pengaturan (tersinkron antar perangkat).
  useEffect(() => {
    supabase.from("pengaturan").select("tarif_umum, tarif_bpjs, tarif_igd").eq("id", 1).single()
      .then(({ data }) => {
        if (!data) return;
        const fromTarif = [data.tarif_umum, data.tarif_bpjs, data.tarif_igd]
          .map(v => parseInt(String(v ?? "").replace(/\D/g, "")) || 0)
          .filter(v => v > 0);
        const merged = [...new Set([...fromTarif, ...BIAYA_PRESET])].sort((a, b) => a - b);
        if (merged.length) setPresetTarif(merged);
      });
  }, []);

  const fetchPasien = useCallback(async () => {
    const { data, error } = await supabase.from("pasien")
      .select("*")
      .gte("created_at", today.start).lte("created_at", today.end)
      .order("nomor_antrian", { ascending: true });

    if (error) {
      const msg = (error.message || "").toLowerCase();
      if (msg.includes("column") || error.code === "42703" || error.code === "PGRST204") setColsOk(false);
    } else {
      setColsOk(true);
      if (data) setPasienList(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPasien();
    const channel = supabase.channel("realtime-kasir")
      .on("postgres_changes", { event: "*", schema: "public", table: "pasien" }, fetchPasien)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchPasien]);

  function getEdit(p: Pasien) {
    return edits.get(p.nomor_antrian) ?? {
      biaya: String(p.biaya ?? 0),
      status_bayar: p.status_bayar ?? "Belum Bayar",
      metode_bayar: p.metode_bayar ?? "",
    };
  }

  function setEdit(nomor: number, patch: Partial<{ biaya: string; status_bayar: string; metode_bayar: string }>) {
    setEdits(m => {
      const cur = m.get(nomor) ?? { biaya: "0", status_bayar: "Belum Bayar", metode_bayar: "" };
      const next = new Map(m);
      next.set(nomor, { ...cur, ...patch });
      return next;
    });
  }

  // Update DB dgn fallback: jika kolom baru (metode/invoice/rincian) belum ada,
  // simpan kolom inti (biaya+status) saja agar tidak hard-fail.
  async function persistPayment(p: Pasien, payload: Record<string, unknown>) {
    const { start, end } = getTodayRange();
    const sel = () => supabase.from("pasien").update(payload)
      .eq("nomor_antrian", p.nomor_antrian).gte("created_at", start).lte("created_at", end);
    let { error } = await sel();
    if (error && /column|PGRST204|schema cache/i.test(`${error.message} ${error.code}`)) {
      const base: Record<string, unknown> = {};
      if ("biaya" in payload) base.biaya = payload.biaya;
      if ("status_bayar" in payload) base.status_bayar = payload.status_bayar;
      ({ error } = await supabase.from("pasien").update(base)
        .eq("nomor_antrian", p.nomor_antrian).gte("created_at", start).lte("created_at", end));
    }
    return error;
  }

  async function saveRow(p: Pasien) {
    const edit = getEdit(p);
    const biaya = parseInt(edit.biaya.replace(/\D/g, "")) || 0;
    setSaving(p.nomor_antrian);
    const error = await persistPayment(p, { biaya, status_bayar: edit.status_bayar, metode_bayar: edit.metode_bayar || "" });
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
    const biaya = parseInt(edit.biaya.replace(/\D/g, "")) || 0;
    const metode = edit.metode_bayar || "Tunai";
    const invoice = p.nomor_invoice || genInvoice(p.nomor_antrian);
    setEdit(p.nomor_antrian, { status_bayar: "Lunas", metode_bayar: metode });
    const error = await persistPayment(p, { biaya, status_bayar: "Lunas", metode_bayar: metode, nomor_invoice: invoice });
    if (error) { setToast(`Gagal: ${error.message}`); setTimeout(() => setToast(null), 3500); }
    fetchPasien();
  }

  async function saveRincian() {
    if (!rincianModal) return;
    const { p, items } = rincianModal;
    const clean = items.filter(it => it.nama.trim() !== "" || it.harga > 0);
    const total = clean.reduce((s, it) => s + (it.harga || 0), 0);
    setEdit(p.nomor_antrian, { biaya: String(total) });
    const error = await persistPayment(p, { biaya: total, rincian: clean });
    if (error) setToast(`Gagal simpan rincian: ${error.message}`);
    else { setToast(`✓ Rincian ${p.nama} — ${fmtRupiah(total)}`); setRincianModal(null); fetchPasien(); }
    setTimeout(() => setToast(null), 3500);
  }

  function openNota(p: Pasien) {
    const edit = getEdit(p);
    const biaya = parseInt(edit.biaya.replace(/\D/g, "")) || 0;
    const invoice = p.nomor_invoice || genInvoice(p.nomor_antrian);
    const metode = edit.metode_bayar || p.metode_bayar || "Tunai";
    const rincian = Array.isArray(p.rincian) ? p.rincian : [];
    setNotaModal({ p, biaya, invoice, metode, rincian });
  }

  function sendWABayar(p: Pasien) {
    if (!p.no_hp) { setToast("Nomor HP pasien tidak tersedia"); setTimeout(() => setToast(null), 3000); return; }
    const edit = getEdit(p);
    const biaya = parseInt(edit.biaya.replace(/\D/g, "")) || 0;
    const invoice = p.nomor_invoice || genInvoice(p.nomor_antrian);
    const metode = edit.metode_bayar || p.metode_bayar || "Tunai";
    const phone = p.no_hp.replace(/\D/g, "").replace(/^0/, "62");
    const msg = `Yth. ${p.nama},\n\nTerima kasih telah berkunjung ke Klinik & RB Afina.\n\nRincian pembayaran:\n• No. Invoice: ${invoice}\n• Keluhan: ${p.keluhan}\n• Total Biaya: ${fmtRupiah(biaya)}\n• Metode: ${metode}\n• Status: LUNAS ✓\n• Tanggal: ${new Date().toLocaleDateString("id-ID")}\n\nSemoga lekas sembuh 🙏`;
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
        @keyframes shimmer { 0% { background-position: -400px 0; } 100% { background-position: 400px 0; } }
        .skeleton { background: linear-gradient(90deg, var(--border-color) 25%, var(--bg-main) 50%, var(--border-color) 75%); background-size: 800px 100%; animation: shimmer 1.4s infinite linear; border-radius: 8px; }
        .kasir-row:hover { background: var(--table-hover) !important; }
        .k-btn { transition: all 0.18s; cursor: pointer; }
        .k-btn:hover { filter: brightness(1.08); transform: translateY(-1px); }
        .biaya-input { background: var(--input-bg); border: 1px solid var(--border-color); border-radius: 8px; padding: 8px 10px; font-size: 13px; color: var(--text-primary); outline: none; font-family: inherit; width: 120px; box-sizing: border-box; }
        .biaya-input:focus { border-color: var(--accent); }
        .preset-btn { background: var(--input-bg); border: 1px solid var(--border-color); border-radius: 6px; padding: 4px 8px; font-size: 10px; font-weight: 600; color: var(--text-secondary); cursor: pointer; transition: all 0.14s; }
        .preset-btn:hover { border-color: var(--accent); color: var(--accent); }
        .table-wrapper { overflow-x: auto; -webkit-overflow-scrolling: touch; }
        .table-wrapper table { min-width: 680px; }
        @media (max-width: 640px) { .kasir-stats-grid { grid-template-columns: repeat(2, 1fr) !important; } }
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
                { label: "No. Invoice", val: notaModal.invoice },
                { label: "No. Antrian", val: padNo(notaModal.p.nomor_antrian) },
                { label: "Nama Pasien", val: notaModal.p.nama },
                { label: "Tanggal", val: new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) },
                { label: "Waktu", val: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) },
                { label: "Metode Bayar", val: notaModal.metode },
              ].map(({ label, val }) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", gap: "12px", marginBottom: "8px" }}>
                  <span style={{ fontSize: "12px", color: "#888", fontWeight: 600, flexShrink: 0 }}>{label}</span>
                  <span style={{ fontSize: "12px", color: "#1A1A2E", fontWeight: 600, textAlign: "right" }}>{val}</span>
                </div>
              ))}
            </div>

            {/* Rincian item (jika ada) */}
            {notaModal.rincian.length > 0 && (
              <div style={{ marginBottom: "16px" }}>
                <p style={{ fontSize: "11px", color: "#888", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 8px" }}>Rincian</p>
                {notaModal.rincian.map((it, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: "12px", marginBottom: "6px" }}>
                    <span style={{ fontSize: "12px", color: "#444" }}>{it.nama || "Item"}</span>
                    <span style={{ fontSize: "12px", color: "#1A1A2E", fontWeight: 600 }}>{fmtRupiah(it.harga || 0)}</span>
                  </div>
                ))}
              </div>
            )}
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

      {/* Rincian Item Modal */}
      {rincianModal && (() => {
        const total = rincianModal.items.reduce((s, it) => s + (it.harga || 0), 0);
        return (
          <div style={{ position: "fixed", inset: 0, zIndex: 9100, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}
            onClick={e => { if (e.target === e.currentTarget) setRincianModal(null); }}>
            <div style={{ background: "var(--bg-card)", borderRadius: "18px", padding: "24px", width: "100%", maxWidth: "440px", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 24px 64px rgba(0,0,0,0.25)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2px" }}>
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: "var(--text-primary)" }}>Rincian Pembayaran</h3>
                <button onClick={() => setRincianModal(null)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex" }}><X size={18} color="var(--text-secondary)" /></button>
              </div>
              <p style={{ margin: "0 0 16px", fontSize: "12px", color: "var(--text-secondary)" }}>No. {padNo(rincianModal.p.nomor_antrian)} · {rincianModal.p.nama}</p>

              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "12px" }}>
                {ITEM_PRESET.map(n => (
                  <button key={n} className="preset-btn" onClick={() => setRincianModal(rm => rm ? { ...rm, items: [...rm.items, { nama: n, harga: 0 }] } : rm)}>+ {n}</button>
                ))}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "14px" }}>
                {rincianModal.items.map((it, i) => (
                  <div key={i} style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                    <input className="biaya-input" style={{ flex: 1, width: "auto" }} placeholder="Nama item" value={it.nama}
                      onChange={e => setRincianModal(rm => { if (!rm) return rm; const items = [...rm.items]; items[i] = { ...items[i], nama: e.target.value }; return { ...rm, items }; })} />
                    <input className="biaya-input" style={{ width: "110px" }} placeholder="0" inputMode="numeric" value={it.harga ? String(it.harga) : ""}
                      onChange={e => setRincianModal(rm => { if (!rm) return rm; const items = [...rm.items]; items[i] = { ...items[i], harga: parseInt(e.target.value.replace(/\D/g, "")) || 0 }; return { ...rm, items }; })} />
                    <button onClick={() => setRincianModal(rm => rm ? { ...rm, items: rm.items.filter((_, j) => j !== i) } : rm)} style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", display: "flex" }}><X size={15} /></button>
                  </div>
                ))}
                <button className="preset-btn" style={{ alignSelf: "flex-start" }} onClick={() => setRincianModal(rm => rm ? { ...rm, items: [...rm.items, { nama: "", harga: 0 }] } : rm)}>+ Baris kosong</button>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderTop: "1px dashed var(--border-color)", marginBottom: "16px" }}>
                <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-secondary)" }}>Total</span>
                <span style={{ fontSize: "20px", fontWeight: 900, color: "var(--accent)" }}>{fmtRupiah(total)}</span>
              </div>

              <div style={{ display: "flex", gap: "8px" }}>
                <button onClick={saveRincian} style={{ flex: 1, background: "var(--accent)", border: "none", borderRadius: "10px", padding: "11px", color: "#fff", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}>Simpan Rincian (set Biaya)</button>
                <button onClick={() => setRincianModal(null)} style={{ flex: "0 0 auto", padding: "11px 18px", background: "transparent", border: "1px solid var(--border-color)", borderRadius: "10px", color: "var(--text-secondary)", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>Batal</button>
              </div>
            </div>
          </div>
        );
      })()}

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

      {/* Skeleton while loading */}
      {loading && (
        <div style={{ background: "var(--bg-card)", borderRadius: "16px", border: "1px solid var(--border-color)", padding: "20px", boxShadow: "var(--shadow)" }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{ display: "flex", gap: "16px", padding: "14px 0", borderBottom: "1px solid var(--border-color)" }}>
              <div className="skeleton" style={{ width: "40px", height: "20px" }} />
              <div className="skeleton" style={{ width: "140px", height: "20px" }} />
              <div className="skeleton" style={{ width: "100px", height: "20px" }} />
              <div className="skeleton" style={{ width: "120px", height: "32px", marginLeft: "auto" }} />
            </div>
          ))}
        </div>
      )}

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
      {!loading && colsOk && (
        <div data-tour="kasir-summary" className="kasir-stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "14px", marginBottom: "24px" }}>
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
                            {presetTarif.map(v => (
                              <button key={v} className="preset-btn" onClick={() => setEdit(p.nomor_antrian, { biaya: String(v) })}>
                                {(v / 1000)}rb
                              </button>
                            ))}
                          </div>
                          <button className="preset-btn" onClick={() => setRincianModal({ p, items: (Array.isArray(p.rincian) && p.rincian.length ? p.rincian.map(it => ({ ...it })) : [{ nama: "Jasa Konsultasi", harga: 0 }]) })}
                            style={{ alignSelf: "flex-start", color: "var(--accent)", borderColor: "rgba(108,92,231,0.3)" }}>
                            + Rincian item
                          </button>
                        </div>
                      ) : <span style={{ color: "var(--text-secondary)", fontSize: "12px" }}>—</span>}
                    </td>
                    <td style={{ padding: "14px 18px" }}>
                      {colsOk ? (
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                          <select className="biaya-input" style={{ width: "auto", padding: "6px 8px" }}
                            value={edit.metode_bayar || ""}
                            onChange={e => setEdit(p.nomor_antrian, { metode_bayar: e.target.value })}>
                            <option value="">Metode…</option>
                            {METODE_BAYAR.map(m => <option key={m} value={m}>{m}</option>)}
                          </select>
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
