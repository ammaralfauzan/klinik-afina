"use client";
import { useEffect, useState, useRef } from "react";
import { supabase } from "../../lib/supabase";
import Image from "next/image";

// ─── Types ────────────────────────────────────────────────────────────────────
type Pasien = { nama: string; status: string; nomor_antrian: number; keluhan?: string };

// ─── Constants ────────────────────────────────────────────────────────────────
const HEALTH_TIPS = [
  "Minum 8 gelas air putih sehari untuk menjaga tubuh tetap terhidrasi dan sehat.",
  "Istirahat cukup 7–8 jam setiap malam untuk memulihkan energi tubuh secara optimal.",
  "Cuci tangan dengan sabun minimal 20 detik sebelum makan dan setelah beraktivitas.",
  "Rutin berolahraga minimal 30 menit sehari untuk menjaga kesehatan jantung dan imunitas.",
  "Konsumsi buah dan sayur setiap hari untuk memenuhi kebutuhan vitamin dan mineral tubuh.",
];

const TICKER_TEXT =
  "Selamat datang di Klinik & RB Afina  •  Melayani dengan sepenuh hati  •  Est. 2010  •  Buka 24 Jam  •  Kesehatan Anda adalah prioritas kami  •  ";

const SLIDES = [
  { id: "layanan" },
  { id: "jadwal" },
  { id: "tips" },
  { id: "kontak" },
];

// ─── Clock hook ───────────────────────────────────────────────────────────────
function useClock() {
  const [time, setTime] = useState({ h: "00", m: "00", s: "00", date: "" });
  useEffect(() => {
    function tick() {
      const now = new Date();
      setTime({
        h: String(now.getHours()).padStart(2, "0"),
        m: String(now.getMinutes()).padStart(2, "0"),
        s: String(now.getSeconds()).padStart(2, "0"),
        date: now.toLocaleDateString("id-ID", {
          weekday: "long", day: "numeric", month: "long", year: "numeric",
        }),
      });
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return time;
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function DisplayPage() {
  const [pasienList, setPasienList] = useState<Pasien[]>([]);
  const [slide, setSlide] = useState(0);
  const [fadeIn, setFadeIn] = useState(true);
  const [tipIdx, setTipIdx] = useState(0);
  const [calledAnim, setCalledAnim] = useState(false);
  const prevCalledNo = useRef<number | null>(null);
  const clock = useClock();

  // ── Supabase realtime ──────────────────────────────────────────────────────
  useEffect(() => {
    async function fetch() {
      const { data } = await supabase
        .from("pasien")
        .select("nama, status, nomor_antrian")
        .order("nomor_antrian", { ascending: true });
      if (data) setPasienList(data);
    }
    fetch();
    const ch = supabase
      .channel("display-tv")
      .on("postgres_changes", { event: "*", schema: "public", table: "pasien" }, fetch)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  // ── Slide auto-advance ─────────────────────────────────────────────────────
  useEffect(() => {
    const id = setInterval(() => {
      setFadeIn(false);
      setTimeout(() => {
        setSlide(s => (s + 1) % SLIDES.length);
        setTipIdx(i => (i + 1) % HEALTH_TIPS.length);
        setFadeIn(true);
      }, 600);
    }, 5500);
    return () => clearInterval(id);
  }, []);

  // ── Called number animation ────────────────────────────────────────────────
  const called = pasienList
    .filter(p => p.status === "Sedang Diperiksa")
    .sort((a, b) => b.nomor_antrian - a.nomor_antrian)[0] ?? null;

  const waiting = pasienList.filter(p => p.status === "Menunggu").slice(0, 5);

  useEffect(() => {
    const no = called?.nomor_antrian ?? null;
    if (no !== prevCalledNo.current) {
      prevCalledNo.current = no;
      setCalledAnim(false);
      setTimeout(() => setCalledAnim(true), 50);
    }
  }, [called?.nomor_antrian]);

  // ── Slide content ──────────────────────────────────────────────────────────
  const slideId = SLIDES[slide].id;

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { width: 100%; height: 100%; overflow: hidden; }

        @keyframes pulseDot   { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.5);opacity:.6} }
        @keyframes pulseRing  { 0%{box-shadow:0 0 0 0 rgba(255,215,0,.55)} 70%{box-shadow:0 0 0 36px rgba(255,215,0,0)} 100%{box-shadow:0 0 0 0 rgba(255,215,0,0)} }
        @keyframes numberPop  { 0%{transform:scale(.7);opacity:0} 70%{transform:scale(1.06)} 100%{transform:scale(1);opacity:1} }
        @keyframes ticker     { from{transform:translateX(0)} to{transform:translateX(-50%)} }
        @keyframes blinkColon { 0%,100%{opacity:1} 49%{opacity:1} 50%{opacity:.2} 99%{opacity:.2} }
        @keyframes slideDown  { from{opacity:0;transform:translateY(-14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes rowIn      { from{opacity:0;transform:translateX(-16px)} to{opacity:1;transform:translateX(0)} }

        .tv-root {
          width: 100vw; height: 100vh;
          background: #0f0520;
          display: flex; flex-direction: column;
          font-family: var(--font-jakarta), var(--font-inter), system-ui, sans-serif;
          color: #fff;
          overflow: hidden;
        }
        .tv-body {
          display: flex; flex: 1; min-height: 0;
        }

        /* ── Left panel ── */
        .left-panel {
          width: 40%; min-width: 0;
          background: linear-gradient(180deg, #1a0a3e 0%, #0f0520 100%);
          border-right: 1px solid rgba(255,255,255,.07);
          display: flex; flex-direction: column;
          padding: 28px 28px 20px;
          overflow: hidden;
        }
        .logo-row { display: flex; align-items: center; gap: 14px; margin-bottom: 18px; }
        .logo-box {
          width: 54px; height: 54px; border-radius: 14px; flex-shrink: 0;
          background: rgba(255,255,255,.1); border: 1px solid rgba(255,255,255,.12);
          display: flex; align-items: center; justify-content: center; overflow: hidden;
        }
        .clinic-name { font-size: 17px; font-weight: 800; line-height: 1.25; letter-spacing: -.01em; }
        .clinic-sub  { font-size: 11px; color: rgba(255,255,255,.4); letter-spacing: .1em; text-transform: uppercase; margin-top: 2px; }

        .clock-block { text-align: center; margin-bottom: 16px; }
        .clock-digits {
          font-size: 62px; font-weight: 800; letter-spacing: .04em;
          font-variant-numeric: tabular-nums; line-height: 1;
          background: linear-gradient(135deg, #fff 60%, rgba(255,255,255,.55));
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
        }
        .clock-colon { animation: blinkColon 2s step-end infinite; display: inline-block; }
        .clock-date  { font-size: 13px; color: rgba(255,255,255,.45); margin-top: 6px; font-weight: 500; text-transform: capitalize; }

        .divider { height: 1px; background: rgba(255,255,255,.08); margin: 14px 0; }

        .section-label {
          font-size: 11px; font-weight: 700; letter-spacing: .18em;
          color: rgba(255,255,255,.35); text-transform: uppercase; margin-bottom: 10px;
        }

        /* Called number */
        .called-block { text-align: center; padding: 8px 0; }
        .number-circle {
          width: 170px; height: 170px; border-radius: 50%; margin: 0 auto 16px;
          background: radial-gradient(circle at 35% 35%, #ffe566, #FFD700 60%, #c8a600);
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 0 0 12px rgba(255,215,0,.12), 0 0 40px rgba(255,215,0,.25);
        }
        .number-circle.anim { animation: pulseRing 2s ease-out, numberPop .5s cubic-bezier(.22,1,.36,1); }
        .number-text  { font-size: 88px; font-weight: 800; color: #1a0a3e; line-height: 1; letter-spacing: -.04em; }
        .called-name  { font-size: 28px; font-weight: 700; color: #fff; margin-bottom: 10px; line-height: 1.2; }
        .called-badge {
          display: inline-flex; align-items: center; gap: 7px;
          background: rgba(16,185,129,.15); border: 1px solid rgba(16,185,129,.4);
          color: #34d399; border-radius: 20px; padding: 6px 16px; font-size: 13px; font-weight: 700;
        }
        .badge-dot {
          width: 8px; height: 8px; border-radius: 50%; background: #10b981;
          animation: pulseDot 1.4s ease-in-out infinite;
        }

        /* Empty called state */
        .no-called {
          text-align: center; padding: 20px 0;
          color: rgba(255,255,255,.25); font-size: 16px; font-weight: 600;
        }

        /* Waiting list */
        .waiting-list { display: flex; flex-direction: column; gap: 7px; flex: 1; }
        .waiting-row {
          display: flex; align-items: center; gap: 12px;
          background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.07);
          border-radius: 12px; padding: 11px 14px;
          animation: rowIn .35s ease both;
        }
        .waiting-no {
          width: 38px; height: 38px; border-radius: 10px; flex-shrink: 0;
          background: rgba(108,92,231,.3); border: 1px solid rgba(108,92,231,.5);
          display: flex; align-items: center; justify-content: center;
          font-size: 18px; font-weight: 800; color: #c4b5fd;
        }
        .waiting-name { font-size: 16px; font-weight: 600; color: rgba(255,255,255,.85); }
        .next-badge {
          margin-left: auto; font-size: 10px; font-weight: 700; letter-spacing: .08em;
          color: #a78bfa; background: rgba(108,92,231,.25); border-radius: 8px;
          padding: 3px 8px; text-transform: uppercase; flex-shrink: 0;
        }

        /* ── Right panel ── */
        .right-panel {
          flex: 1; min-width: 0; position: relative; overflow: hidden;
          display: flex; flex-direction: column;
        }
        .slide-wrap {
          flex: 1; display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          padding: 40px 48px;
          transition: opacity .55s ease, transform .55s ease;
        }
        .slide-wrap.hidden { opacity: 0; transform: scale(.97); pointer-events: none; }

        /* Slide dots */
        .slide-dots {
          display: flex; gap: 8px; justify-content: center;
          padding: 14px 0 12px; position: relative; z-index: 2;
        }
        .dot {
          width: 8px; height: 8px; border-radius: 50%;
          background: rgba(255,255,255,.2); transition: all .3s;
          cursor: default;
        }
        .dot.active { width: 28px; border-radius: 4px; background: #FFD700; }

        /* Slide 1 — Layanan */
        .s-layanan { background: linear-gradient(145deg, #2d1b69 0%, #4c1d8f 50%, #7c3aed 100%); }
        .service-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; width: 100%; max-width: 520px; margin-top: 28px; }
        .service-item {
          display: flex; align-items: center; gap: 13px;
          background: rgba(255,255,255,.1); border: 1px solid rgba(255,255,255,.15);
          border-radius: 14px; padding: 16px 18px;
        }
        .service-icon { font-size: 28px; flex-shrink: 0; }
        .service-name { font-size: 16px; font-weight: 700; }

        /* Slide 2 — Jadwal */
        .s-jadwal { background: linear-gradient(145deg, #0c1a3e 0%, #1a3a6e 50%, #1e4fa0 100%); }
        .open-text {
          font-size: 96px; font-weight: 800; line-height: 1;
          background: linear-gradient(135deg, #60a5fa, #93c5fd);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
        }

        /* Slide 3 — Tips */
        .s-tips { background: linear-gradient(145deg, #0a2e1a 0%, #14532d 50%, #166534 100%); }
        .tip-icon { font-size: 72px; margin-bottom: 24px; display: block; text-align: center; }
        .tip-text {
          font-size: 28px; font-weight: 600; text-align: center; line-height: 1.5;
          color: rgba(255,255,255,.9); max-width: 520px;
          animation: slideDown .5s ease;
        }

        /* Slide 4 — Kontak */
        .s-kontak { background: linear-gradient(145deg, #4a044e 0%, #831843 50%, #9d174d 100%); }
        .ig-handle {
          font-size: 52px; font-weight: 800; letter-spacing: -.02em;
          background: linear-gradient(135deg, #f472b6, #fb7185);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          margin: 12px 0;
        }

        /* ── Ticker ── */
        .ticker-wrap {
          height: 44px; background: rgba(255,215,0,.1); border-top: 1px solid rgba(255,215,0,.2);
          overflow: hidden; display: flex; align-items: center; flex-shrink: 0;
        }
        .ticker-track {
          display: flex; white-space: nowrap;
          animation: ticker 40s linear infinite;
          gap: 0;
        }
        .ticker-text {
          font-size: 15px; font-weight: 600; color: #FFD700;
          letter-spacing: .06em; padding-right: 0;
        }
      `}</style>

      <div className="tv-root">
        <div className="tv-body">

          {/* ══ LEFT PANEL ══ */}
          <div className="left-panel">

            {/* Logo + klinik name */}
            <div className="logo-row">
              <div className="logo-box">
                <Image src="/logo-afina.png" alt="Logo" width={44} height={44}
                  style={{ width: "78%", height: "78%", objectFit: "contain" }} />
              </div>
              <div>
                <div className="clinic-name">Klinik & RB Afina</div>
                <div className="clinic-sub">Sistem Antrian Digital</div>
              </div>
            </div>

            {/* Clock */}
            <div className="clock-block">
              <div className="clock-digits">
                {clock.h}
                <span className="clock-colon">:</span>
                {clock.m}
                <span className="clock-colon">:</span>
                {clock.s}
              </div>
              <div className="clock-date">{clock.date}</div>
            </div>

            <div className="divider" />

            {/* Called number */}
            <div className="section-label">Nomor Dipanggil</div>

            {called ? (
              <div className="called-block" style={{ animation: "slideDown .4s ease" }}>
                <div className={`number-circle${calledAnim ? " anim" : ""}`}>
                  <span className="number-text">{called.nomor_antrian}</span>
                </div>
                <div className="called-name">{called.nama}</div>
                <div className="called-badge">
                  <div className="badge-dot" />
                  Sedang Diperiksa
                </div>
              </div>
            ) : (
              <div className="no-called">
                <div style={{ fontSize: "48px", marginBottom: "10px" }}>🙏</div>
                <div>Selamat Datang</div>
                <div style={{ fontSize: "13px", marginTop: "6px", color: "rgba(255,255,255,.2)" }}>
                  Belum ada pasien dipanggil
                </div>
              </div>
            )}

            <div className="divider" />

            {/* Waiting list */}
            <div className="section-label">
              Antrian Menunggu
              {waiting.length > 0 && (
                <span style={{ marginLeft: "8px", background: "rgba(108,92,231,.3)", borderRadius: "6px", padding: "1px 7px", fontSize: "10px" }}>
                  {waiting.length}
                </span>
              )}
            </div>

            {waiting.length > 0 ? (
              <div className="waiting-list">
                {waiting.map((p, i) => (
                  <div key={p.nomor_antrian} className="waiting-row" style={{ animationDelay: `${i * 0.07}s` }}>
                    <div className="waiting-no">{p.nomor_antrian}</div>
                    <div className="waiting-name">{p.nama}</div>
                    {i === 0 && <div className="next-badge">Berikutnya</div>}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: "14px", color: "rgba(255,255,255,.25)", textAlign: "center", paddingTop: "12px" }}>
                Tidak ada antrian menunggu
              </div>
            )}
          </div>

          {/* ══ RIGHT PANEL ══ */}
          <div className="right-panel">
            <div className={`slide-wrap ${slideId === "layanan" ? "s-layanan" : slideId === "jadwal" ? "s-jadwal" : slideId === "tips" ? "s-tips" : "s-kontak"}${fadeIn ? "" : " hidden"}`}>

              {/* ── Slide 1: Layanan ── */}
              {slideId === "layanan" && (
                <>
                  <div style={{ fontSize: "13px", letterSpacing: ".2em", color: "rgba(255,255,255,.5)", textTransform: "uppercase", marginBottom: "8px" }}>Layanan Kami</div>
                  <div style={{ fontSize: "40px", fontWeight: 800, lineHeight: 1.2, textAlign: "center", marginBottom: "4px" }}>
                    Layanan Unggulan
                  </div>
                  <div style={{ fontSize: "16px", color: "rgba(255,255,255,.5)", marginBottom: "4px" }}>Tersedia untuk Anda dan Keluarga</div>
                  <div className="service-grid">
                    {[
                      { icon: "🤰", name: "KIA & Kebidanan" },
                      { icon: "👶", name: "Persalinan Normal" },
                      { icon: "💉", name: "Imunisasi Bayi" },
                      { icon: "🩺", name: "Dokter Umum" },
                      { icon: "🎗️", name: "PAP Smear" },
                      { icon: "💊", name: "KB & Konsultasi" },
                    ].map(s => (
                      <div key={s.name} className="service-item">
                        <div className="service-icon">{s.icon}</div>
                        <div className="service-name">{s.name}</div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* ── Slide 2: Jadwal ── */}
              {slideId === "jadwal" && (
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "64px", marginBottom: "16px" }}>🕐</div>
                  <div style={{ fontSize: "14px", letterSpacing: ".2em", color: "rgba(255,255,255,.45)", textTransform: "uppercase", marginBottom: "14px" }}>Jam Operasional</div>
                  <div className="open-text">BUKA</div>
                  <div className="open-text" style={{ fontSize: "72px", marginTop: "-8px" }}>24 JAM</div>
                  <div style={{ fontSize: "22px", color: "rgba(255,255,255,.65)", margin: "20px 0 10px", fontWeight: 600 }}>Setiap Hari, Termasuk Hari Libur</div>
                  <div style={{ display: "flex", justifyContent: "center", gap: "16px", marginTop: "24px", flexWrap: "wrap" }}>
                    {[
                      { label: "IGD", val: "24 Jam" },
                      { label: "Poli Umum", val: "07.00–21.00" },
                      { label: "Kebidanan", val: "24 Jam" },
                    ].map(r => (
                      <div key={r.label} style={{ background: "rgba(255,255,255,.1)", border: "1px solid rgba(255,255,255,.15)", borderRadius: "14px", padding: "14px 22px", textAlign: "center" }}>
                        <div style={{ fontSize: "12px", color: "rgba(255,255,255,.45)", marginBottom: "4px", letterSpacing: ".08em" }}>{r.label}</div>
                        <div style={{ fontSize: "20px", fontWeight: 700 }}>{r.val}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Slide 3: Tips Kesehatan ── */}
              {slideId === "tips" && (
                <div style={{ textAlign: "center", maxWidth: "580px" }}>
                  <div style={{ fontSize: "14px", letterSpacing: ".2em", color: "rgba(255,255,255,.4)", textTransform: "uppercase", marginBottom: "20px" }}>Info Kesehatan</div>
                  <span className="tip-icon">💡</span>
                  <div style={{ fontSize: "15px", color: "rgba(255,255,255,.4)", marginBottom: "18px", fontWeight: 600, letterSpacing: ".06em", textTransform: "uppercase" }}>Tips Hari Ini</div>
                  <div className="tip-text" key={tipIdx}>
                    {HEALTH_TIPS[tipIdx]}
                  </div>
                  <div style={{ display: "flex", justifyContent: "center", gap: "6px", marginTop: "28px" }}>
                    {HEALTH_TIPS.map((_, i) => (
                      <div key={i} style={{ width: i === tipIdx ? "20px" : "6px", height: "6px", borderRadius: "3px", background: i === tipIdx ? "#4ade80" : "rgba(255,255,255,.2)", transition: "all .3s" }} />
                    ))}
                  </div>
                </div>
              )}

              {/* ── Slide 4: Kontak ── */}
              {slideId === "kontak" && (
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "14px", letterSpacing: ".2em", color: "rgba(255,255,255,.45)", textTransform: "uppercase", marginBottom: "24px" }}>Tetap Terhubung</div>
                  <div style={{ fontSize: "56px", marginBottom: "10px" }}>📱</div>
                  <div style={{ fontSize: "22px", color: "rgba(255,255,255,.65)", fontWeight: 600 }}>Ikuti kami di Instagram</div>
                  <div className="ig-handle">@klinik.afina</div>
                  <div style={{ height: "1px", background: "rgba(255,255,255,.12)", margin: "24px 0" }} />
                  <div style={{ fontSize: "20px", color: "rgba(255,255,255,.65)", fontWeight: 600, marginBottom: "8px" }}>
                    💬 Pertanyaan? Hubungi kami via WhatsApp
                  </div>
                  <div style={{ fontSize: "36px", fontWeight: 800, color: "#4ade80", letterSpacing: ".02em" }}>
                    0812-3456-7890
                  </div>
                  <div style={{ marginTop: "24px", display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.12)", borderRadius: "12px", padding: "10px 20px" }}>
                    <span style={{ fontSize: "16px" }}>📍</span>
                    <span style={{ fontSize: "15px", color: "rgba(255,255,255,.65)" }}>Jl. Kesehatan No. 1, Indonesia</span>
                  </div>
                </div>
              )}
            </div>

            {/* Slide dots */}
            <div className="slide-dots">
              {SLIDES.map((_, i) => (
                <div key={i} className={`dot${slide === i ? " active" : ""}`} />
              ))}
            </div>
          </div>
        </div>

        {/* ══ TICKER ══ */}
        <div className="ticker-wrap">
          <div className="ticker-track">
            {/* Duplicate text for seamless loop */}
            <span className="ticker-text">{TICKER_TEXT.repeat(4)}</span>
            <span className="ticker-text">{TICKER_TEXT.repeat(4)}</span>
          </div>
        </div>
      </div>
    </>
  );
}
