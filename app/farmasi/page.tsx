"use client";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "../../lib/supabase";
import { Pill, Plus, Search, X, AlertTriangle, PackagePlus, PackageMinus, Boxes, Save, Trash2 } from "lucide-react";

type Obat = {
  id: string; nama: string; satuan: string; harga: number;
  stok: number; stok_minimal: number; aktif: boolean;
};

const SATUAN = ["Tablet", "Kapsul", "Botol", "Strip", "Tube", "Sachet", "Ampul", "Pcs"];
const EMPTY: Partial<Obat> = { nama: "", satuan: "Tablet", harga: 0, stok: 0, stok_minimal: 10, aktif: true };

function rupiah(n: number) { return "Rp " + (n || 0).toLocaleString("id-ID"); }

export default function FarmasiPage() {
  const [list, setList] = useState<Obat[]>([]);
  const [loading, setLoading] = useState(true);
  const [tableOk, setTableOk] = useState<boolean | null>(null);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<Partial<Obat> | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  async function fetchObat() {
    const { data, error } = await supabase.from("obat").select("*").order("nama", { ascending: true });
    if (error) setTableOk(false);
    else { setTableOk(true); setList(data || []); }
    setLoading(false);
  }
  useEffect(() => { fetchObat(); }, []);

  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(null), 3000); };

  const filtered = useMemo(() =>
    list.filter(o => !search.trim() || o.nama.toLowerCase().includes(search.toLowerCase())),
    [list, search]);

  const menipis = list.filter(o => o.aktif && o.stok <= o.stok_minimal);
  const nilaiStok = list.reduce((s, o) => s + o.harga * o.stok, 0);

  async function saveObat() {
    if (!modal) return;
    if (!modal.nama?.trim()) { showToast("Nama obat wajib diisi"); return; }
    setSaving(true);
    const payload = {
      nama: modal.nama.trim(), satuan: modal.satuan || "Tablet",
      harga: modal.harga || 0, stok: modal.stok || 0,
      stok_minimal: modal.stok_minimal ?? 10, aktif: modal.aktif ?? true,
      updated_at: new Date().toISOString(),
    };
    const { error } = modal.id
      ? await supabase.from("obat").update(payload).eq("id", modal.id)
      : await supabase.from("obat").insert([payload]);
    setSaving(false);
    if (error) showToast("Gagal: " + error.message);
    else { showToast(`✓ ${payload.nama} tersimpan`); setModal(null); fetchObat(); }
  }

  async function adjustStok(o: Obat, delta: number) {
    const label = delta > 0 ? "Tambah" : "Kurangi";
    const raw = window.prompt(`${label} stok "${o.nama}" (${o.stok} ${o.satuan}). Masukkan jumlah:`, "10");
    if (raw === null) return;
    const n = parseInt(raw.replace(/\D/g, "")) || 0;
    if (n <= 0) return;
    const baru = Math.max(0, o.stok + delta * n);
    const { error } = await supabase.from("obat").update({ stok: baru, updated_at: new Date().toISOString() }).eq("id", o.id);
    if (error) showToast("Gagal: " + error.message);
    else { showToast(`✓ Stok ${o.nama}: ${o.stok} → ${baru}`); fetchObat(); }
  }

  async function hapusObat(o: Obat) {
    if (!window.confirm(`Hapus obat "${o.nama}"? Tindakan ini permanen.`)) return;
    const { error } = await supabase.from("obat").delete().eq("id", o.id);
    if (error) showToast("Gagal: " + error.message);
    else { showToast(`Obat ${o.nama} dihapus`); fetchObat(); }
  }

  const todayStr = new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <div>
      <style>{`
        .obat-input { width: 100%; background: var(--input-bg); border: 1px solid var(--border-color); border-radius: 10px; padding: 10px 13px; font-size: 13px; color: var(--text-primary); outline: none; font-family: inherit; box-sizing: border-box; }
        .obat-input:focus { border-color: var(--accent); }
        .farmasi-btn { transition: all 0.16s; cursor: pointer; }
        .farmasi-btn:hover { filter: brightness(1.08); transform: translateY(-1px); }
        @media (max-width: 640px) { .farmasi-stats { grid-template-columns: 1fr !important; } }
      `}</style>

      {toast && (
        <div style={{ position: "fixed", top: "20px", right: "20px", zIndex: 9999, background: "#fff", borderLeft: "4px solid #10b981", borderRadius: "12px", padding: "14px 18px", boxShadow: "0 4px 20px rgba(0,0,0,0.12)", fontSize: "13px", fontWeight: 500, color: "#1A1A2E", minWidth: "260px" }}>{toast}</div>
      )}

      {/* Header */}
      <div style={{ marginBottom: "24px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 800, color: "var(--text-primary)", margin: 0, display: "flex", alignItems: "center", gap: "9px" }}>
            <Pill size={22} color="var(--accent)" /> Apotek / Farmasi
          </h1>
          <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: "4px 0 0", textTransform: "capitalize" }}>{todayStr}</p>
        </div>
        {tableOk && (
          <button className="farmasi-btn" onClick={() => setModal({ ...EMPTY })}
            style={{ display: "flex", alignItems: "center", gap: "7px", padding: "10px 16px", borderRadius: "12px", border: "none", background: "var(--accent)", color: "#fff", fontSize: "13px", fontWeight: 700 }}>
            <Plus size={15} /> Tambah Obat
          </button>
        )}
      </div>

      {tableOk === false && (
        <div style={{ background: "rgba(245,166,35,0.06)", border: "1px solid rgba(245,166,35,0.35)", borderRadius: "16px", padding: "20px", display: "flex", gap: "10px", alignItems: "flex-start" }}>
          <AlertTriangle size={16} color="#d97706" style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <p style={{ fontSize: "13px", fontWeight: 700, color: "#92400e", margin: 0 }}>Tabel obat belum ada</p>
            <p style={{ fontSize: "12px", color: "#b45309", margin: "3px 0 0" }}>Jalankan <strong>Langkah 21</strong> di Supabase SQL Editor.</p>
          </div>
        </div>
      )}

      {tableOk && (
        <>
          {/* Stats */}
          <div className="farmasi-stats" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "14px", marginBottom: "20px" }}>
            {[
              { label: "Jenis Obat", val: String(list.length), icon: Boxes, color: "#6C5CE7" },
              { label: "Stok Menipis", val: String(menipis.length), icon: AlertTriangle, color: menipis.length ? "#dc2626" : "#10b981" },
              { label: "Nilai Stok", val: rupiah(nilaiStok), icon: Pill, color: "#0284c7" },
            ].map(s => {
              const Ic = s.icon;
              return (
                <div key={s.label} style={{ background: "var(--bg-card)", borderRadius: "14px", padding: "16px 18px", border: "1px solid var(--border-color)", boxShadow: "var(--shadow)", borderLeft: `4px solid ${s.color}` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                    <Ic size={14} color={s.color} />
                    <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{s.label}</span>
                  </div>
                  <p style={{ fontSize: "20px", fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>{s.val}</p>
                </div>
              );
            })}
          </div>

          {/* Peringatan stok menipis */}
          {menipis.length > 0 && (
            <div style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: "12px", padding: "12px 16px", marginBottom: "16px", fontSize: "13px", color: "#b91c1c" }}>
              ⚠️ <strong>{menipis.length} obat</strong> stoknya menipis: {menipis.slice(0, 6).map(o => o.nama).join(", ")}{menipis.length > 6 ? ", …" : ""}
            </div>
          )}

          {/* Search */}
          <div style={{ position: "relative", marginBottom: "16px", maxWidth: "340px" }}>
            <Search size={15} color="var(--text-secondary)" style={{ position: "absolute", left: "13px", top: "50%", transform: "translateY(-50%)" }} />
            <input className="obat-input" style={{ paddingLeft: "38px" }} placeholder="Cari nama obat..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>

          {/* Tabel */}
          <div style={{ background: "var(--bg-card)", borderRadius: "16px", border: "1px solid var(--border-color)", overflow: "hidden", boxShadow: "var(--shadow)" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", minWidth: "720px" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border-color)", background: "var(--table-header-bg)" }}>
                    {["Nama Obat", "Satuan", "Harga", "Stok", "Min.", "Aksi"].map(h => (
                      <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: "11px", fontWeight: 700, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={6} style={{ padding: "40px", textAlign: "center", color: "var(--text-secondary)" }}>Memuat…</td></tr>
                  ) : filtered.length === 0 ? (
                    <tr><td colSpan={6} style={{ padding: "48px", textAlign: "center", color: "var(--text-secondary)" }}>
                      <Pill size={32} style={{ margin: "0 auto 10px", display: "block", opacity: 0.35 }} />
                      {search ? "Obat tidak ditemukan." : "Belum ada obat. Klik “Tambah Obat”."}
                    </td></tr>
                  ) : filtered.map(o => {
                    const low = o.stok <= o.stok_minimal;
                    return (
                      <tr key={o.id} style={{ borderBottom: "1px solid var(--border-color)", opacity: o.aktif ? 1 : 0.5 }}>
                        <td style={{ padding: "11px 16px", fontWeight: 600, color: "var(--text-primary)" }}>
                          {o.nama}{!o.aktif && <span style={{ fontSize: "10px", color: "var(--text-secondary)", marginLeft: "6px" }}>(nonaktif)</span>}
                        </td>
                        <td style={{ padding: "11px 16px", color: "var(--text-secondary)" }}>{o.satuan}</td>
                        <td style={{ padding: "11px 16px", color: "var(--text-primary)" }}>{rupiah(o.harga)}</td>
                        <td style={{ padding: "11px 16px" }}>
                          <span style={{ fontWeight: 700, color: low ? "#dc2626" : "var(--text-primary)" }}>{o.stok}</span>
                          {low && <AlertTriangle size={12} color="#dc2626" style={{ marginLeft: "5px", verticalAlign: "middle" }} />}
                        </td>
                        <td style={{ padding: "11px 16px", color: "var(--text-secondary)" }}>{o.stok_minimal}</td>
                        <td style={{ padding: "11px 16px" }}>
                          <div style={{ display: "flex", gap: "5px" }}>
                            <button className="farmasi-btn" title="Tambah stok" onClick={() => adjustStok(o, +1)} style={{ padding: "6px", borderRadius: "7px", border: "1px solid rgba(16,185,129,0.3)", background: "rgba(16,185,129,0.1)", color: "#059669", display: "flex" }}><PackagePlus size={13} /></button>
                            <button className="farmasi-btn" title="Kurangi stok" onClick={() => adjustStok(o, -1)} style={{ padding: "6px", borderRadius: "7px", border: "1px solid rgba(245,158,11,0.3)", background: "rgba(245,158,11,0.1)", color: "#b45309", display: "flex" }}><PackageMinus size={13} /></button>
                            <button className="farmasi-btn" title="Edit" onClick={() => setModal({ ...o })} style={{ padding: "6px 10px", borderRadius: "7px", border: "1px solid var(--border-color)", background: "var(--input-bg)", color: "var(--text-secondary)", fontSize: "12px", fontWeight: 600 }}>Edit</button>
                            <button className="farmasi-btn" title="Hapus" onClick={() => hapusObat(o)} style={{ padding: "6px", borderRadius: "7px", border: "1px solid rgba(239,68,68,0.25)", background: "rgba(239,68,68,0.08)", color: "#dc2626", display: "flex" }}><Trash2 size={13} /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Modal tambah/edit */}
      {modal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9000, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}
          onClick={e => { if (e.target === e.currentTarget) setModal(null); }}>
          <div style={{ background: "var(--bg-card)", borderRadius: "18px", padding: "24px", width: "100%", maxWidth: "440px", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 24px 64px rgba(0,0,0,0.25)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: "var(--text-primary)" }}>{modal.id ? "Edit Obat" : "Tambah Obat"}</h3>
              <button onClick={() => setModal(null)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex" }}><X size={18} color="var(--text-secondary)" /></button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--accent)", textTransform: "uppercase", display: "block", marginBottom: "5px" }}>Nama Obat *</label>
                <input className="obat-input" value={modal.nama || ""} onChange={e => setModal(m => ({ ...m, nama: e.target.value }))} placeholder="cth: Paracetamol 500mg" autoFocus />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--accent)", textTransform: "uppercase", display: "block", marginBottom: "5px" }}>Satuan</label>
                  <select className="obat-input" value={modal.satuan || "Tablet"} onChange={e => setModal(m => ({ ...m, satuan: e.target.value }))}>
                    {SATUAN.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--accent)", textTransform: "uppercase", display: "block", marginBottom: "5px" }}>Harga Jual (Rp)</label>
                  <input className="obat-input" inputMode="numeric" value={modal.harga ? String(modal.harga) : ""} onChange={e => setModal(m => ({ ...m, harga: parseInt(e.target.value.replace(/\D/g, "")) || 0 }))} placeholder="0" />
                </div>
                <div>
                  <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--accent)", textTransform: "uppercase", display: "block", marginBottom: "5px" }}>Stok</label>
                  <input className="obat-input" inputMode="numeric" value={modal.stok ? String(modal.stok) : ""} onChange={e => setModal(m => ({ ...m, stok: parseInt(e.target.value.replace(/\D/g, "")) || 0 }))} placeholder="0" />
                </div>
                <div>
                  <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--accent)", textTransform: "uppercase", display: "block", marginBottom: "5px" }}>Stok Minimal</label>
                  <input className="obat-input" inputMode="numeric" value={modal.stok_minimal != null ? String(modal.stok_minimal) : ""} onChange={e => setModal(m => ({ ...m, stok_minimal: parseInt(e.target.value.replace(/\D/g, "")) || 0 }))} placeholder="10" />
                </div>
              </div>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "var(--text-primary)", cursor: "pointer" }}>
                <input type="checkbox" checked={modal.aktif ?? true} onChange={e => setModal(m => ({ ...m, aktif: e.target.checked }))} />
                Obat aktif (tersedia untuk diresepkan)
              </label>
            </div>
            <div style={{ display: "flex", gap: "8px", marginTop: "20px" }}>
              <button onClick={saveObat} disabled={saving} className="farmasi-btn" style={{ flex: 1, background: "var(--accent)", border: "none", borderRadius: "10px", padding: "11px", color: "#fff", fontSize: "13px", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", opacity: saving ? 0.7 : 1 }}>
                <Save size={14} /> {saving ? "Menyimpan…" : "Simpan"}
              </button>
              <button onClick={() => setModal(null)} style={{ padding: "11px 18px", background: "transparent", border: "1px solid var(--border-color)", borderRadius: "10px", color: "var(--text-secondary)", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>Batal</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
