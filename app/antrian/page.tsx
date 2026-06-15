"use client";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "../../lib/supabase";
import { PhoneCall, CheckCircle2, Clock, Users, Tv2, MessageCircle } from "lucide-react";
import { useAudio } from "../components/AudioNotif";
import Toast from "../components/Toast";

type Pasien = {
  nama: string; keluhan: string; status: string;
  nomor_antrian: number; no_hp?: string;
};

function toWANumber(no_hp: string): string {
  const digits = no_hp.replace(/\D/g, "");
  if (digits.startsWith("62")) return digits;
  if (digits.startsWith("0")) return "62" + digits.slice(1);
  return "62" + digits;
}

function buildWALink(p: Pasien): string {
  const phone = toWANumber(p.no_hp || "");
  const text = encodeURIComponent(
    `Yth. ${p.nama}, Anda dipanggil ke ruang periksa Klinik & RB Afina. Nomor antrian Anda: ${p.nomor_antrian}. Terima kasih.`
  );
  return `https://wa.me/${phone}?text=${text}`;
}

export default function AntrianPage() {
  const [pasienList, setPasienList] = useState<Pasien[]>([]);
  const [toast, setToast] = useState({ visible: false, message: "" });
  const { playDing, playDingDing, playDingDown } = useAudio();

  const fetchPasien = useCallback(async () => {
    const { data } = await supabase
      .from("pasien")
      .select("*")
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
          const newPatient = payload.new as Pasien;
          setToast({ visible: true, message: `Pasien baru: ${newPatient.nama}` });
        }
        fetchPasien();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchPasien, playDing]);

  async function updateStatus(nomor: number, status: string) {
    await supabase.from("pasien").update({ status }).eq("nomor_antrian", nomor);
    if (status === "Sedang Diperiksa") playDingDing();
    if (status === "Selesai") playDingDown();
    fetchPasien();
  }

  function handlePanggil(p: Pasien) {
    updateStatus(p.nomor_antrian, "Sedang Diperiksa");
  }

  function handleSendWA(p: Pasien) {
    if (!p.no_hp) {
      setToast({ visible: true, message: "Nomor HP pasien tidak tersedia" });
      return;
    }
    const confirmed = window.confirm(
      `Kirim notifikasi WhatsApp ke ${p.nama}?\n\nNomor: ${p.no_hp}\nPesan: Anda dipanggil ke ruang periksa Klinik & RB Afina. Nomor antrian: ${p.nomor_antrian}.`
    );
    if (confirmed) {
      window.open(buildWALink(p), "_blank");
    }
  }

  return (
    <div>
      <Toast
        message={toast.message}
        visible={toast.visible}
        onClose={() => setToast({ ...toast, visible: false })}
      />

      <style>{`
        .action-btn { transition: all 0.2s; cursor: pointer; }
        .action-btn:hover { transform: translateY(-1px); filter: brightness(1.1); }
        .table-row:hover { background: var(--table-hover) !important; }
        .table-wrapper { overflow-x: auto; -webkit-overflow-scrolling: touch; }
        .table-wrapper table { min-width: 560px; }
      `}</style>

      <div style={{ marginBottom: "28px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>Manajemen Antrian</h1>
          <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: "4px 0 0" }}>Kelola antrian pasien secara realtime</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          {/* Display TV link */}
          <a
            href="/display"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "flex", alignItems: "center", gap: "7px",
              background: "rgba(108,92,231,0.1)", border: "1px solid rgba(108,92,231,0.25)",
              color: "var(--accent)", borderRadius: "10px", padding: "9px 16px",
              fontSize: "13px", fontWeight: 600, textDecoration: "none",
              transition: "all 0.18s",
            }}
            onMouseEnter={e => (e.currentTarget.style.background = "rgba(108,92,231,0.18)")}
            onMouseLeave={e => (e.currentTarget.style.background = "rgba(108,92,231,0.1)")}
          >
            <Tv2 size={15} />
            Buka Display TV
          </a>

          {/* Total badge */}
          <div style={{
            background: "rgba(123,97,255,0.08)", border: "1px solid rgba(123,97,255,0.2)",
            borderRadius: "10px", padding: "9px 16px",
            display: "flex", alignItems: "center", gap: "7px",
          }}>
            <Users size={15} color="#7B61FF" />
            <span style={{ fontSize: "13px", color: "#7B61FF", fontWeight: 600 }}>{pasienList.length} Pasien</span>
          </div>
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
                <tr>
                  <td colSpan={5} style={{ padding: "48px", textAlign: "center", color: "var(--text-secondary)" }}>
                    <Clock size={36} style={{ margin: "0 auto 12px", display: "block", opacity: 0.5 }} />
                    <p style={{ margin: 0 }}>Belum ada antrian hari ini</p>
                  </td>
                </tr>
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
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      {p.status === "Menunggu" && (
                        <>
                          <button
                            className="action-btn"
                            onClick={() => handlePanggil(p)}
                            style={{ background: "rgba(14,165,233,0.12)", border: "1px solid rgba(14,165,233,0.4)", color: "#0284c7", borderRadius: "8px", padding: "7px 14px", fontSize: "12px", fontWeight: 600, display: "flex", alignItems: "center", gap: "6px" }}
                          >
                            <PhoneCall size={13} /> Panggil
                          </button>
                          {p.no_hp && (
                            <button
                              className="action-btn"
                              onClick={() => handleSendWA(p)}
                              title="Kirim notifikasi WhatsApp"
                              style={{ background: "rgba(37,211,102,0.12)", border: "1px solid rgba(37,211,102,0.35)", color: "#16a34a", borderRadius: "8px", padding: "7px 10px", fontSize: "12px", fontWeight: 600, display: "flex", alignItems: "center" }}
                            >
                              <MessageCircle size={14} />
                            </button>
                          )}
                        </>
                      )}
                      {p.status === "Sedang Diperiksa" && (
                        <>
                          <button
                            className="action-btn"
                            onClick={() => updateStatus(p.nomor_antrian, "Selesai")}
                            style={{ background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.4)", color: "#059669", borderRadius: "8px", padding: "7px 14px", fontSize: "12px", fontWeight: 600, display: "flex", alignItems: "center", gap: "6px" }}
                          >
                            <CheckCircle2 size={13} /> Selesai
                          </button>
                          {p.no_hp && (
                            <button
                              className="action-btn"
                              onClick={() => handleSendWA(p)}
                              title="Kirim notifikasi WhatsApp"
                              style={{ background: "rgba(37,211,102,0.12)", border: "1px solid rgba(37,211,102,0.35)", color: "#16a34a", borderRadius: "8px", padding: "7px 10px", fontSize: "12px", fontWeight: 600, display: "flex", alignItems: "center" }}
                            >
                              <MessageCircle size={14} />
                            </button>
                          )}
                        </>
                      )}
                      {p.status === "Selesai" && (
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#059669", fontSize: "12px", fontWeight: 600 }}>
                          <CheckCircle2 size={13} /> Done
                        </div>
                      )}
                    </div>
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
