"use client";
import { useEffect, useState, useRef } from "react";
import { supabase } from "../../lib/supabase";
import Image from "next/image";

type Pasien = {
  nama: string;
  status: string;
  nomor_antrian: number;
  keluhan?: string;
};

function useDigitalClock() {
  const [time, setTime] = useState("");
  useEffect(() => {
    function tick() {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, "0");
      const m = String(now.getMinutes()).padStart(2, "0");
      const s = String(now.getSeconds()).padStart(2, "0");
      setTime(`${h}:${m}:${s}`);
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return time;
}

function formatDate() {
  return new Date().toLocaleDateString("id-ID", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
}

export default function DisplayPage() {
  const [pasienList, setPasienList] = useState<Pasien[]>([]);
  const [animKey, setAnimKey] = useState(0);
  const prevCalledRef = useRef<number | null>(null);
  const clock = useDigitalClock();

  useEffect(() => {
    async function fetchData() {
      const { data } = await supabase
        .from("pasien")
        .select("nama, status, nomor_antrian, keluhan")
        .order("nomor_antrian", { ascending: true });
      if (data) setPasienList(data);
    }

    fetchData();

    const channel = supabase
      .channel("display-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "pasien" }, () => {
        fetchData();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const calledPatient = pasienList
    .filter(p => p.status === "Sedang Diperiksa")
    .sort((a, b) => b.nomor_antrian - a.nomor_antrian)[0] ?? null;

  const waitingList = pasienList
    .filter(p => p.status === "Menunggu")
    .slice(0, 5);

  // Trigger animation when called patient changes
  useEffect(() => {
    const currentNo = calledPatient?.nomor_antrian ?? null;
    if (currentNo !== prevCalledRef.current) {
      prevCalledRef.current = currentNo;
      setAnimKey(k => k + 1);
    }
  }, [calledPatient?.nomor_antrian]);

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(160deg, #1a1040 0%, #2E2466 50%, #1a1040 100%)",
      display: "flex", flexDirection: "column",
      fontFamily: "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif",
      overflow: "hidden", position: "relative",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@600;700;800&family=Inter:wght@400;500;600&display=swap');

        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(-24px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0)    scale(1); }
        }
        @keyframes pulseRing {
          0%   { box-shadow: 0 0 0 0  rgba(245,166,35,0.5); }
          70%  { box-shadow: 0 0 0 28px rgba(245,166,35,0); }
          100% { box-shadow: 0 0 0 0  rgba(245,166,35,0); }
        }
        @keyframes shimmer {
          0%   { background-position: -400px 0; }
          100% { background-position:  400px 0; }
        }
        @keyframes blink { 0%,100% { opacity:1; } 50% { opacity:0.3; } }

        .called-anim { animation: fadeSlideIn 0.6s cubic-bezier(0.22,1,0.36,1) forwards; }
        .number-badge { animation: pulseRing 2.2s ease-out infinite; }
        .colon-blink  { animation: blink 1s step-end infinite; }

        /* Decorative orbs */
        .orb {
          position: absolute; border-radius: 50%;
          filter: blur(80px); pointer-events: none; opacity: 0.18;
        }
      `}</style>

      {/* Decorative orbs */}
      <div className="orb" style={{ width: 400, height: 400, background: "#6C5CE7", top: -120, left: -100 }} />
      <div className="orb" style={{ width: 300, height: 300, background: "#F5A623", bottom: -80, right: -60 }} />

      {/* ── HEADER ── */}
      <header style={{
        padding: "20px 36px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        background: "rgba(0,0,0,0.2)",
        backdropFilter: "blur(12px)",
        position: "relative", zIndex: 2,
      }}>
        {/* Logo + name */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{
            width: "56px", height: "56px", borderRadius: "14px",
            background: "rgba(255,255,255,0.1)",
            border: "1px solid rgba(255,255,255,0.15)",
            display: "flex", alignItems: "center", justifyContent: "center",
            overflow: "hidden",
          }}>
            <Image src="/logo-afina.png" alt="Logo" width={48} height={48}
              style={{ width: "80%", height: "80%", objectFit: "contain" }} />
          </div>
          <div>
            <h1 style={{ color: "#fff", fontSize: "20px", fontWeight: 800, margin: 0, letterSpacing: "-0.02em" }}>
              Klinik & RB Afina
            </h1>
            <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "12px", margin: 0, letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Sistem Antrian Digital
            </p>
          </div>
        </div>

        {/* Clock */}
        <div style={{ textAlign: "right" }}>
          <div style={{
            fontSize: "42px", fontWeight: 800, color: "#fff",
            letterSpacing: "0.04em", lineHeight: 1,
            fontVariantNumeric: "tabular-nums",
          }}>
            {clock.split(":").map((part, i) => (
              <span key={i}>
                {i > 0 && <span className="colon-blink" style={{ color: "rgba(255,255,255,0.5)", margin: "0 2px" }}>:</span>}
                {part}
              </span>
            ))}
          </div>
          <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "12px", margin: "4px 0 0", textTransform: "capitalize" }}>
            {formatDate()}
          </p>
        </div>
      </header>

      {/* ── MAIN BODY ── */}
      <div style={{
        flex: 1, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: "32px 24px", position: "relative", zIndex: 2,
      }}>

        {/* Called number section */}
        {calledPatient ? (
          <div key={animKey} className="called-anim" style={{ textAlign: "center", marginBottom: "48px" }}>
            <p style={{
              fontSize: "13px", fontWeight: 700, letterSpacing: "0.22em",
              color: "rgba(255,255,255,0.5)", textTransform: "uppercase", margin: "0 0 20px",
            }}>
              Nomor Antrian Dipanggil
            </p>

            {/* Big number */}
            <div className="number-badge" style={{
              width: "200px", height: "200px", borderRadius: "50%",
              background: "linear-gradient(135deg, #F5A623, #f97316)",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 28px",
              border: "4px solid rgba(245,166,35,0.4)",
            }}>
              <span style={{
                fontSize: "96px", fontWeight: 800, color: "#1a1040",
                lineHeight: 1, letterSpacing: "-0.04em",
              }}>
                {calledPatient.nomor_antrian}
              </span>
            </div>

            {/* Patient name */}
            <h2 style={{
              fontSize: "52px", fontWeight: 800, color: "#fff",
              margin: "0 0 8px", letterSpacing: "-0.02em", lineHeight: 1.1,
            }}>
              {calledPatient.nama}
            </h2>
            <p style={{ fontSize: "16px", color: "rgba(255,255,255,0.45)", margin: 0, fontWeight: 500 }}>
              Silakan menuju ruang periksa
            </p>
          </div>
        ) : (
          <div style={{ textAlign: "center", marginBottom: "48px" }}>
            <div style={{
              width: "160px", height: "160px", borderRadius: "50%",
              background: "rgba(255,255,255,0.06)",
              border: "2px dashed rgba(255,255,255,0.15)",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 24px",
            }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <p style={{ fontSize: "22px", fontWeight: 600, color: "rgba(255,255,255,0.35)", margin: 0 }}>
              Belum ada pasien dipanggil
            </p>
          </div>
        )}

        {/* Divider */}
        <div style={{
          width: "100%", maxWidth: "700px",
          height: "1px", background: "rgba(255,255,255,0.1)",
          marginBottom: "36px",
        }} />

        {/* Waiting list */}
        <div style={{ width: "100%", maxWidth: "700px" }}>
          <p style={{
            fontSize: "11px", fontWeight: 700, letterSpacing: "0.2em",
            color: "rgba(255,255,255,0.35)", textTransform: "uppercase",
            textAlign: "center", margin: "0 0 16px",
          }}>
            Antrian Menunggu
          </p>

          {waitingList.length === 0 ? (
            <p style={{ textAlign: "center", color: "rgba(255,255,255,0.25)", fontSize: "15px" }}>
              Tidak ada antrian menunggu
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {waitingList.map((p, idx) => (
                <div key={p.nomor_antrian} style={{
                  display: "flex", alignItems: "center", gap: "16px",
                  background: idx === 0
                    ? "rgba(108,92,231,0.25)"
                    : "rgba(255,255,255,0.05)",
                  border: `1px solid ${idx === 0 ? "rgba(108,92,231,0.5)" : "rgba(255,255,255,0.08)"}`,
                  borderRadius: "14px", padding: "14px 20px",
                  transition: "all 0.3s",
                }}>
                  {/* Number */}
                  <div style={{
                    width: "48px", height: "48px", borderRadius: "12px",
                    background: idx === 0 ? "rgba(108,92,231,0.6)" : "rgba(255,255,255,0.08)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    <span style={{ fontSize: "22px", fontWeight: 800, color: "#fff" }}>
                      {p.nomor_antrian}
                    </span>
                  </div>

                  {/* Name */}
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: "20px", fontWeight: 700, color: "#fff", margin: 0 }}>{p.nama}</p>
                    {p.keluhan && (
                      <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.4)", margin: "2px 0 0" }}>{p.keluhan}</p>
                    )}
                  </div>

                  {/* Position badge */}
                  <div style={{
                    padding: "5px 14px", borderRadius: "20px",
                    background: idx === 0 ? "rgba(108,92,231,0.5)" : "rgba(255,255,255,0.06)",
                    border: `1px solid ${idx === 0 ? "rgba(108,92,231,0.7)" : "rgba(255,255,255,0.1)"}`,
                  }}>
                    <span style={{ fontSize: "12px", fontWeight: 700, color: idx === 0 ? "#c4b5fd" : "rgba(255,255,255,0.4)" }}>
                      {idx === 0 ? "Berikutnya" : `Antrian ${idx + 1}`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── FOOTER ── */}
      <footer style={{
        padding: "14px 36px", textAlign: "center",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        background: "rgba(0,0,0,0.15)",
        position: "relative", zIndex: 2,
      }}>
        <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.2)", margin: 0 }}>
          Klinik & RB Afina · Sistem Antrian Digital · Realtime
        </p>
      </footer>
    </div>
  );
}
