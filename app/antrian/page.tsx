"use client";
import { useEffect, useState, useCallback, useMemo } from "react";
import { supabase } from "../../lib/supabase";
import { PhoneCall, CheckCircle2, Clock, Users, Tv2, MessageCircle, UserX, Search } from "lucide-react";
import { useAudio } from "../components/AudioNotif";
import Toast from "../components/Toast";

type Pasien = {
  nama: string; keluhan: string; status: string;
  nomor_antrian: number; no_hp?: string; created_at?: string;
};

function getTodayRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end   = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  return { start: start.toISOString(), end: end.toISOString() };
}

function padNo(n: number) { return String(n).padStart(3, "0"); }

function toWANumber(no_hp: string): string {
  const d = no_hp.replace(/\D/g, "");
  if (d.startsWith("62")) return d;
  if (d.startsWith("0"))  return "62" + d.slice(1);
  return "62" + d;
}

function buildWALink(p: Pasien, action: "panggil" | "selesai"): string {
  const phone = toWANumber(p.no_hp || "");
  const text  = action === "panggil"
    ? `Yth. ${p.nama}, Anda dipanggil ke ruang periksa Klinik & RB Afina. Nomor antrian Anda: ${padNo(p.nomor_antrian)}. Terima kasih.`
    : `Yth. ${p.nama}, pemeriksaan Anda telah selesai. Terima kasih telah berkunjung ke Klinik & RB Afina. Semoga lekas sembuh 🙏`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}

export default function AntrianPage() {
  const [pasienList, setPasienList] = useState<Pasien[]>([]);
  const [toast, setToast] = useState({ visible: false, message: "" });
  const [searchQ, setSearchQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("Semua");
  const { playDing, playDingDing, playDingDown } = useAudio();

  const displayed = useMemo(() => pasienList
    .filter(p => !searchQ || p.nama.toLowerCase().includes(searchQ.toLowerCase()))
    .filter(p => statusFilter === "Semua" || p.status === statusFilter),
    [pasienList, searchQ, statusFilter]);

  const fetchPasien = useCallback(async () => {
    const { start, end } = getTodayRange();
    const { data } = await supabase
      .from("pasien")
      .select("*")
      .gte("created_at", start)
      .lte("created_at", end)
      .order("nomor_antrian", { ascending: true });
    if (data) setPasienList(data);
  }, []);

  useEffect(() => {
    fetchPasien();
    const channel = supabase
      .channel("realtime-antrian")
      .on("postgres_changes", { event: "*", schema: "public", table: "pasien" }, (payload) => {
        if (payload.eventType === "INSERT") {
          playDing();
          const p = payload.new as Pasien;
          setToast({ visible: true, message: `Pasien baru: ${p.nama} — No. ${padNo(p.nomor_antrian)}` });
        }
        fetchPasien();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchPasien, playDing]);

  async function updateStatus(p: Pasien, status: string) {
    const { start, end } = getTodayRange();
    await supabase.from("pasien")
      .update({ status })
      .eq("nomor_antrian", p.nomor_antrian)
      .gte("created_at", start)
      .lte("created_at", end);
    if (status === "Sedang Diperiksa") playDingDing();
    if (status === "Selesai")          playDingDown();
    if (status === "Tidak Hadir")      setToast({ visible: true, message: `${p.nama} ditandai tidak hadir` });
    fetchPasien();
  }

  function handleSendWA(p: Pasien, action: "panggil" | "selesai") {
    if (!p.no_hp) {
      setToast({ visible: true, message: "Nomor HP pasien tidak tersedia" });
      return;
    }
    const label = action === "panggil" ? "dipanggil" : "selesai diperiksa";
    const ok = window.confirm(
      `Kirim notifikasi WA ke ${p.nama} (${p.no_hp})?\nInfo: pasien ${label}.`
    );
    if (ok) window.open(buildWALink(p, action), "_blank");
  }

  const menunggu     = pasienList.filter(p => p.status === "Menunggu").length;
  const diperiksa    = pasienList.filter(p => p.status === "Sedang Diperiksa").length;
  const selesai      = pasienList.filter(p => p.status === "Selesai").length;
  const tidakHadir   = pasienList.filter(p => p.status === "Tidak Hadir").length;
  const today = new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  const statusStyle = (s: string) => ({
    padding: "5px 14px", borderRadius: "20px", fontSize: "11px", fontWeight: 700,
    background: s === "Selesai" ? "rgba(16,185,129,0.12)"
      : s === "Sedang Diperiksa" ? "rgba(14,165,233,0.12)"
      : s === "Tidak Hadir"      ? "rgba(100,100,100,0.12)"
      : "rgba(245,158,11,0.12)",
    color: s === "Selesai" ? "#059669"
      : s === "Sedang Diperiksa" ? "#0284c7"
      : s === "Tidak Hadir"      ? "#6b7280"
      : "#d97706",
    border: `1px solid ${s === "Selesai" ? "rgba(16,185,129,0.3)"
      : s === "Sedang Diperiksa" ? "rgba(14,165,233,0.3)"
      : s === "Tidak Hadir"      ? "rgba(100,100,100,0.2)"
      : "rgba(245,158,11,0.3)"}`,
  } as React.CSSProperties);

  return (
    <div>
      <Toast message={toast.message} visible={toast.visible} onClose={() => setToast({ ...toast, visible: false })} />

      <style>{`
        .action-btn { transition: all 0.18s; cursor: pointer; }
        .action-btn:hover { transform: translateY(-1px); filter: brightness(1.1); }
        .table-row:hover { background: var(--table-hover) !important; }
        .table-wrapper { overflow-x: auto; -webkit-overflow-scrolling: touch; }
        .table-wrapper table { min-width: 620px; }
        .filter-btn { padding: 6px 13px; border-radius: 7px; font-size: 12px; font-weight: 600; border: 1px solid var(--border-color); background: transparent; color: var(--text-secondary); cursor: pointer; transition: all 0.15s; font-family: inherit; }
        .filter-btn:hover { background: var(--input-bg); color: var(--text-primary); }
        .filter-btn.active { background: var(--accent); color: #fff; border-color: var(--accent); }
        .search-wrap { position: relative; }
        .search-icon { position: absolute; left: 11px; top: 50%; transform: translateY(-50%); pointer-events: none; }
        .search-input { background: var(--input-bg); border: 1px solid var(--border-color); border-radius: 10px; padding: 9px 12px 9px 34px; font-size: 13px; color: var(--text-primary); outline: none; width: 200px; font-family: inherit; transition: border 0.2s, width 0.2s; }
        .search-input:focus { border-color: var(--accent); width: 240px; }
        .search-input::placeholder { color: var(--text-secondary); }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: "24px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>Manajemen Antrian</h1>
          <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: "4px 0 0", textTransform: "capitalize" }}>{today}</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          <a href="/display" target="_blank" rel="noopener noreferrer" style={{
            display: "flex", alignItems: "center", gap: "7px",
            background: "rgba(108,92,231,0.1)", border: "1px solid rgba(108,92,231,0.25)",
            color: "var(--accent)", borderRadius: "10px", padding: "9px 14px",
            fontSize: "13px", fontWeight: 600, textDecoration: "none",
          }}>
            <Tv2 size={14} /> Buka Display TV
          </a>
          <div className="search-wrap">
            <Search size={14} color="var(--text-secondary)" className="search-icon" />
            <input className="search-input" placeholder="Cari nama..." value={searchQ} onChange={e => setSearchQ(e.target.value)} />
          </div>
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "10px", padding: "9px 14px", display: "flex", gap: "14px" }}>
            {[
              { label: "Menunggu",  val: menunggu,   color: "#d97706" },
              { label: "Diperiksa", val: diperiksa,  color: "#0284c7" },
              { label: "Selesai",   val: selesai,    color: "#059669" },
            ].map(s => (
              <div key={s.label} style={{ textAlign: "center" }}>
                <div style={{ fontSize: "18px", fontWeight: 800, color: s.color }}>{s.val}</div>
                <div style={{ fontSize: "10px", color: "var(--text-secondary)", fontWeight: 600 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Status filter tabs */}
      <div style={{ display: "flex", gap: "6px", marginBottom: "16px", flexWrap: "wrap" }}>
        {["Semua", "Menunggu", "Sedang Diperiksa", "Selesai", "Tidak Hadir"].map(f => (
          <button key={f} className={`filter-btn${statusFilter === f ? " active" : ""}`} onClick={() => setStatusFilter(f)}>
            {f} {f !== "Semua" && <span style={{ opacity: 0.75 }}>({pasienList.filter(p => p.status === f).length})</span>}
          </button>
        ))}
      </div>

      {/* Table */}
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
                <tr>
                  <td colSpan={5} style={{ padding: "56px", textAlign: "center", color: "var(--text-secondary)" }}>
                    <Clock size={36} style={{ margin: "0 auto 12px", display: "block", opacity: 0.4 }} />
                    <p style={{ margin: 0, fontWeight: 600 }}>Belum ada antrian hari ini</p>
                    <p style={{ margin: "4px 0 0", fontSize: "12px" }}>Pasien yang mendaftar hari ini akan muncul di sini</p>
                  </td>
                </tr>
              ) : displayed.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: "40px", textAlign: "center", color: "var(--text-secondary)", fontSize: "13px" }}>
                    Tidak ada pasien untuk filter ini
                  </td>
                </tr>
              ) : displayed.map((p) => (
                <tr key={p.nomor_antrian} className="table-row" style={{
                  borderBottom: "1px solid var(--border-color)", transition: "background 0.15s",
                  opacity: p.status === "Tidak Hadir" ? 0.55 : 1,
                }}>
                  <td style={{ padding: "16px 18px" }}>
                    <span style={{ fontWeight: 800, color: "var(--accent)", fontSize: "15px", fontVariantNumeric: "tabular-nums" }}>
                      {padNo(p.nomor_antrian)}
                    </span>
                  </td>
                  <td style={{ padding: "16px 18px", fontWeight: 600, color: "var(--text-primary)" }}>{p.nama}</td>
                  <td style={{ padding: "16px 18px", color: "var(--text-secondary)" }}>{p.keluhan}</td>
                  <td style={{ padding: "16px 18px" }}>
                    <span style={statusStyle(p.status)}>{p.status}</span>
                  </td>
                  <td style={{ padding: "16px 18px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>

                      {/* MENUNGGU */}
                      {p.status === "Menunggu" && (<>
                        <button className="action-btn" onClick={() => updateStatus(p, "Sedang Diperiksa")}
                          style={{ background: "rgba(14,165,233,0.12)", border: "1px solid rgba(14,165,233,0.4)", color: "#0284c7", borderRadius: "8px", padding: "7px 12px", fontSize: "12px", fontWeight: 600, display: "flex", alignItems: "center", gap: "5px" }}>
                          <PhoneCall size={12} /> Panggil
                        </button>
                        {p.no_hp && (
                          <button className="action-btn" onClick={() => handleSendWA(p, "panggil")} title="Kirim WA panggilan"
                            style={{ background: "rgba(37,211,102,0.1)", border: "1px solid rgba(37,211,102,0.3)", color: "#16a34a", borderRadius: "8px", padding: "7px 9px", display: "flex", alignItems: "center" }}>
                            <MessageCircle size={13} />
                          </button>
                        )}
                        <button className="action-btn" onClick={() => updateStatus(p, "Tidak Hadir")} title="Tandai tidak hadir"
                          style={{ background: "rgba(100,100,100,0.08)", border: "1px solid rgba(100,100,100,0.2)", color: "#6b7280", borderRadius: "8px", padding: "7px 9px", display: "flex", alignItems: "center" }}>
                          <UserX size={13} />
                        </button>
                      </>)}

                      {/* SEDANG DIPERIKSA */}
                      {p.status === "Sedang Diperiksa" && (<>
                        <button className="action-btn" onClick={() => updateStatus(p, "Selesai")}
                          style={{ background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.4)", color: "#059669", borderRadius: "8px", padding: "7px 12px", fontSize: "12px", fontWeight: 600, display: "flex", alignItems: "center", gap: "5px" }}>
                          <CheckCircle2 size={12} /> Selesai
                        </button>
                        {p.no_hp && (
                          <button className="action-btn" onClick={() => handleSendWA(p, "selesai")} title="Kirim WA selesai"
                            style={{ background: "rgba(37,211,102,0.1)", border: "1px solid rgba(37,211,102,0.3)", color: "#16a34a", borderRadius: "8px", padding: "7px 9px", display: "flex", alignItems: "center" }}>
                            <MessageCircle size={13} />
                          </button>
                        )}
                      </>)}

                      {/* SELESAI */}
                      {p.status === "Selesai" && (
                        <span style={{ display: "flex", alignItems: "center", gap: "5px", color: "#059669", fontSize: "12px", fontWeight: 600 }}>
                          <CheckCircle2 size={13} /> Selesai
                        </span>
                      )}

                      {/* TIDAK HADIR */}
                      {p.status === "Tidak Hadir" && (
                        <span style={{ display: "flex", alignItems: "center", gap: "5px", color: "#6b7280", fontSize: "12px" }}>
                          <UserX size={13} /> Tidak Hadir
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer summary */}
        {pasienList.length > 0 && (
          <div style={{ padding: "12px 18px", borderTop: "1px solid var(--border-color)", display: "flex", gap: "20px", fontSize: "12px", color: "var(--text-secondary)" }}>
            <span>Total: <strong style={{ color: "var(--text-primary)" }}>{pasienList.length}</strong></span>
            <span>Selesai: <strong style={{ color: "#059669" }}>{selesai}</strong></span>
            <span>Tidak hadir: <strong style={{ color: "#6b7280" }}>{tidakHadir}</strong></span>
          </div>
        )}
      </div>
    </div>
  );
}
