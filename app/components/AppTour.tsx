"use client";
import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { X, ChevronRight, ChevronLeft, Play, CheckCircle2, Map } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type TourPosition = "top" | "bottom" | "left" | "right" | "center";

type TourStep = {
  id: string;
  title: string;
  description: string;
  page?: string;
  selector?: string;
  position?: TourPosition;
  emoji?: string;
};

type TourContextType = {
  active: boolean;
  step: number;
  startTour: () => void;
  endTour: () => void;
  goNext: () => void;
  goPrev: () => void;
  total: number;
};

// ─── Tour Steps Definition ────────────────────────────────────────────────────

const STEPS: TourStep[] = [
  {
    id: "welcome",
    title: "Selamat Datang di Klinik Afina! 🏥",
    description: "Kami akan memandu Anda mengenal semua fitur sistem manajemen klinik ini. Tour berlangsung sekitar 2–3 menit. Klik 'Mulai' untuk memulai!",
    position: "center",
    emoji: "🏥",
  },
  {
    id: "dashboard-stats",
    title: "Ringkasan Kondisi Klinik",
    page: "/",
    selector: "[data-tour='dashboard-stats']",
    description: "6 kartu ini menampilkan kondisi real-time klinik: total pasien hari ini, yang menunggu, sedang diperiksa, sudah selesai, belum bayar, dan persentase penyelesaian.",
    position: "bottom",
    emoji: "📊",
  },
  {
    id: "dashboard-chart",
    title: "Grafik Tren 7 Hari",
    page: "/",
    selector: "[data-tour='dashboard-chart']",
    description: "Grafik batang ini menampilkan jumlah kunjungan selama 7 hari terakhir. Gunakan untuk mengetahui hari tersibuk dan merencanakan jadwal staf.",
    position: "left",
    emoji: "📈",
  },
  {
    id: "pasien-search",
    title: "Cari Pasien Lama",
    page: "/pasien",
    selector: "[data-tour='pasien-search']",
    description: "Ketik nama atau nomor HP pasien yang pernah datang. Data lama akan otomatis mengisi formulir — tidak perlu input ulang dari nol.",
    position: "bottom",
    emoji: "🔍",
  },
  {
    id: "pasien-form",
    title: "Formulir Registrasi Pasien",
    page: "/pasien",
    selector: "[data-tour='pasien-form']",
    description: "Isi data pasien baru: nama, tanggal lahir, keluhan, dan jenis pembayaran (Umum / BPJS / Asuransi Swasta). Sistem otomatis membuat nomor antrian dan nomor rekam medis permanen.",
    position: "right",
    emoji: "📋",
  },
  {
    id: "antrian-filter",
    title: "Filter Status Antrian",
    page: "/antrian",
    selector: "[data-tour='antrian-filter']",
    description: "Filter pasien berdasarkan statusnya: Menunggu, Sedang Diperiksa, Selesai, atau Tidak Hadir. Angka di setiap tab menunjukkan jumlah pasien saat ini.",
    position: "bottom",
    emoji: "🎛️",
  },
  {
    id: "antrian-table",
    title: "Kelola Antrian Pasien",
    page: "/antrian",
    selector: "[data-tour='antrian-table']",
    description: "Klik 'Panggil' → status berubah dan layar TV di ruang tunggu otomatis update. Bisa juga kirim notifikasi WhatsApp ke pasien atau tandai Tidak Hadir.",
    position: "top",
    emoji: "🎫",
  },
  {
    id: "rm-table",
    title: "Rekam Medis Digital",
    page: "/rekam-medis",
    selector: "[data-tour='rm-table']",
    description: "Pasien yang sedang diperiksa muncul di sini. Klik 'Isi Sekarang' untuk membuka form rekam medis lengkap — tersedia shortcut diagnosis, tindakan, dan obat yang umum.",
    position: "top",
    emoji: "🩺",
  },
  {
    id: "kasir-summary",
    title: "Ringkasan Keuangan Kasir",
    page: "/kasir",
    selector: "[data-tour='kasir-summary']",
    description: "Kartu di atas menampilkan total pasien, yang sudah selesai diperiksa, sudah bayar, dan total pendapatan hari ini — semua diperbarui otomatis secara real-time.",
    position: "bottom",
    emoji: "💳",
  },
  {
    id: "kasir-table",
    title: "Tabel Pembayaran",
    page: "/kasir",
    selector: "[data-tour='kasir-table']",
    description: "Klik preset biaya (50rb, 75rb, dll) atau isi manual, lalu klik ⚡ Lunas untuk satu klik lunas. Bisa cetak nota atau kirim via WhatsApp.",
    position: "top",
    emoji: "🧾",
  },
  {
    id: "laporan-stats",
    title: "Laporan & Analitik",
    page: "/laporan",
    selector: "[data-tour='laporan-stats']",
    description: "Lihat laporan kunjungan dan pendapatan berdasarkan periode: hari ini, minggu ini, bulan ini, atau rentang tanggal bebas. Ada grafik visual untuk analisis tren.",
    position: "bottom",
    emoji: "📋",
  },
  {
    id: "laporan-export",
    title: "Export Data",
    page: "/laporan",
    selector: "[data-tour='laporan-export']",
    description: "Unduh laporan sebagai file CSV yang bisa dibuka di Excel, atau cetak langsung sebagai PDF. Siap untuk laporan ke pemilik klinik atau keperluan audit.",
    position: "top",
    emoji: "⬇️",
  },
  {
    id: "finish",
    title: "Siap Digunakan! 🎉",
    description: "Anda sudah mengenal semua fitur utama. Mulai dari registrasi pasien pertama — sistem akan berjalan otomatis dan real-time. Semoga membantu operasional Klinik Afina!",
    position: "center",
    emoji: "🎉",
  },
];

// ─── Context ──────────────────────────────────────────────────────────────────

const TourContext = createContext<TourContextType>({
  active: false, step: 0, total: STEPS.length,
  startTour: () => {}, endTour: () => {},
  goNext: () => {}, goPrev: () => {},
});

export function useTour() { return useContext(TourContext); }

// ─── Spotlight + Tooltip (draggable, dynamic arrow) ──────────────────────────

function TourTooltip({
  step, rect, total, onNext, onPrev, onEnd,
}: {
  step: TourStep; rect: DOMRect | null; total: number;
  onNext: () => void; onPrev: () => void; onEnd: () => void;
}) {
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [grabbing, setGrabbing] = useState(false);
  const isDragging = useRef(false);
  const dragStart = useRef({ mx: 0, my: 0, ox: 0, oy: 0 });

  const isFirst = STEPS[0].id === step.id;
  const isLast  = STEPS[STEPS.length - 1].id === step.id;
  const stepNum = STEPS.findIndex(s => s.id === step.id) + 1;
  const isCenter = step.position === "center" || !rect;

  const SW = typeof window !== "undefined" ? window.innerWidth  : 1200;
  const SH = typeof window !== "undefined" ? window.innerHeight : 800;
  const IS_MOBILE = SW < 640;
  const TW = IS_MOBILE ? SW - 24 : Math.min(340, SW - 24);
  const TH = 280; // estimated card height (used for centering & arrow calc)
  const M  = 12;  // viewport margin
  const G  = 12;  // gap between element and tooltip

  // ── Default (initial) position ──────────────────────────────────────────
  let dx0 = 0, dy0 = 0;
  if (isCenter || !rect) {
    dx0 = (SW - TW) / 2;
    dy0 = (SH - TH) / 2;
  } else if (IS_MOBILE) {
    dx0 = M;
    const mid = rect.top + rect.height / 2;
    // Element in lower half → tooltip near top; otherwise near bottom (above nav)
    dy0 = mid > SH * 0.55 ? 70 : SH - TH - 96;
  } else {
    let pos = step.position || "bottom";
    const ecx = rect.left + rect.width / 2;
    const ecy = rect.top  + rect.height / 2;
    if (pos === "bottom" || pos === "top") {
      dx0 = Math.max(M, Math.min(ecx - TW / 2, SW - TW - M));
      dy0 = pos === "bottom" ? rect.bottom + G : rect.top - TH - G;
      if (pos === "bottom" && dy0 + TH > SH - M) dy0 = rect.top - TH - G;
      if (pos === "top"    && dy0 < M)            dy0 = rect.bottom + G;
    } else {
      dy0 = Math.max(M, Math.min(ecy - TH / 2, SH - TH - M));
      dx0 = pos === "right" ? rect.right + G : rect.left - TW - G;
      if (pos === "right" && dx0 + TW > SW - M) dx0 = rect.left  - TW - G;
      if (pos === "left"  && dx0 < M)            dx0 = rect.right + G;
    }
    dx0 = Math.max(M, Math.min(dx0, SW - TW - M));
    dy0 = Math.max(M, Math.min(dy0, SH - TH - M));
  }

  // ── Actual position = default + drag, clamped to viewport ──────────────
  const ax = Math.max(M, Math.min(dx0 + dragOffset.x, SW - TW - M));
  const ay = Math.max(M, Math.min(dy0 + dragOffset.y, SH - TH - M));

  // ── Dynamic arrow — always points from tooltip toward highlighted element ─
  // Finds which edge of the tooltip box the line from tooltip-center to
  // element-center exits through, then places a CSS triangle there.
  let arrowStyle: React.CSSProperties | null = null;
  if (!isCenter && rect) {
    const S   = 9; // arrow half-size
    const tcx = ax + TW / 2;
    const tcy = ay + TH / 2;
    const ecx = rect.left + rect.width  / 2;
    const ecy = rect.top  + rect.height / 2;
    const ddx = ecx - tcx;
    const ddy = ecy - tcy;

    if (Math.abs(ddx) > 2 || Math.abs(ddy) > 2) {
      const hw  = TW / 2;
      const hh  = TH / 2;
      const hsc = hw / (Math.abs(ddx) || 0.001); // scale to reach left/right edge
      const vsc = hh / (Math.abs(ddy) || 0.001); // scale to reach top/bottom edge

      if (hsc < vsc) {
        // Arrow exits left or right edge
        const side = ddx > 0 ? "right" : "left";
        const t    = (side === "right" ? hw : -hw) / (ddx || 0.001);
        const yAt  = tcy + ddy * t;
        const frac = Math.max(0.12, Math.min(0.88, (yAt - ay) / TH));
        const at   = frac * TH - S;
        arrowStyle = side === "right"
          ? { right: -S, top: at, borderTop: `${S}px solid transparent`, borderBottom: `${S}px solid transparent`, borderLeft:  `${S}px solid var(--bg-card)` }
          : { left:  -S, top: at, borderTop: `${S}px solid transparent`, borderBottom: `${S}px solid transparent`, borderRight: `${S}px solid var(--bg-card)` };
      } else {
        // Arrow exits top or bottom edge
        const side = ddy > 0 ? "bottom" : "top";
        const t    = (side === "bottom" ? hh : -hh) / (ddy || 0.001);
        const xAt  = tcx + ddx * t;
        const frac = Math.max(0.08, Math.min(0.92, (xAt - ax) / TW));
        const al   = frac * TW - S;
        arrowStyle = side === "bottom"
          ? { bottom: -S, left: al, borderLeft: `${S}px solid transparent`, borderRight: `${S}px solid transparent`, borderTop:    `${S}px solid var(--bg-card)` }
          : { top:    -S, left: al, borderLeft: `${S}px solid transparent`, borderRight: `${S}px solid transparent`, borderBottom: `${S}px solid var(--bg-card)` };
      }
    }
  }

  // ── Drag: start captured in JSX handler; move/end via window listeners ──
  const startDrag = (mx: number, my: number) => {
    isDragging.current = true;
    setGrabbing(true);
    dragStart.current = { mx, my, ox: dragOffset.x, oy: dragOffset.y };
  };

  useEffect(() => {
    const onMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging.current) return;
      let cx: number, cy: number;
      if ("touches" in e) {
        if (!e.touches[0]) return;
        cx = e.touches[0].clientX;
        cy = e.touches[0].clientY;
        e.preventDefault(); // prevent page scroll while dragging tooltip
      } else {
        cx = (e as MouseEvent).clientX;
        cy = (e as MouseEvent).clientY;
      }
      setDragOffset({
        x: dragStart.current.ox + cx - dragStart.current.mx,
        y: dragStart.current.oy + cy - dragStart.current.my,
      });
    };
    const onUp = () => { isDragging.current = false; setGrabbing(false); };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup",   onUp);
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend",  onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup",   onUp);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend",  onUp);
    };
  }, []); // stable — setDragOffset and refs don't change

  return (
    <div style={{ position: "fixed", top: ay, left: ax, width: TW, zIndex: 10002 }}>
      <div style={{ animation: "tourSlideIn 0.28s cubic-bezier(0.34,1.56,0.64,1)", position: "relative" }}>
        {/* Dynamic arrow — repositions as tooltip is dragged */}
        {arrowStyle && <div style={{ position: "absolute", width: 0, height: 0, ...arrowStyle }} />}

        {/* Card */}
        <div
          style={{
            background: "var(--bg-card)", borderRadius: "20px",
            boxShadow: "0 20px 60px rgba(0,0,0,0.25), 0 0 0 1px rgba(123,97,255,0.25)",
            overflow: "hidden", userSelect: "none",
            cursor: grabbing ? "grabbing" : "grab",
          }}
          onMouseDown={e => {
            if ((e.target as HTMLElement).closest("button")) return;
            e.preventDefault();
            startDrag(e.clientX, e.clientY);
          }}
          onTouchStart={e => {
            if ((e.target as HTMLElement).closest("button")) return;
            startDrag(e.touches[0].clientX, e.touches[0].clientY);
          }}
        >
          {/* Drag handle pill */}
          <div style={{ padding: "10px 0 4px", display: "flex", justifyContent: "center", pointerEvents: "none" }}>
            <div style={{ width: "32px", height: "4px", borderRadius: "2px", background: "rgba(123,97,255,0.25)" }} />
          </div>

          {/* Progress bar */}
          <div style={{ height: "3px", background: "var(--border-color)" }}>
            <div style={{ height: "100%", background: "linear-gradient(90deg, #7B61FF, #9B8AFF)", width: `${(stepNum / total) * 100}%`, transition: "width 0.4s ease" }} />
          </div>

          <div style={{ padding: "16px 20px 0" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
              <span style={{ fontSize: "11px", fontWeight: 700, color: "#7B61FF", background: "rgba(123,97,255,0.1)", padding: "3px 10px", borderRadius: "20px", border: "1px solid rgba(123,97,255,0.2)" }}>
                {stepNum} / {total}
              </span>
              <button onClick={onEnd} style={{ background: "none", border: "none", cursor: "pointer", padding: "4px", display: "flex", borderRadius: "6px", opacity: 0.5 }}
                onMouseEnter={e => (e.currentTarget.style.opacity = "1")}
                onMouseLeave={e => (e.currentTarget.style.opacity = "0.5")}>
                <X size={15} color="var(--text-secondary)" />
              </button>
            </div>

            {step.emoji && <div style={{ fontSize: "28px", marginBottom: "8px", lineHeight: 1 }}>{step.emoji}</div>}
            <h3 style={{ fontSize: "16px", fontWeight: 800, color: "var(--text-primary)", margin: "0 0 8px", lineHeight: 1.3 }}>
              {step.title}
            </h3>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: 0, lineHeight: 1.65 }}>
              {step.description}
            </p>
          </div>

          <div style={{ padding: "16px 20px", display: "flex", gap: "8px", alignItems: "center" }}>
            {!isFirst && (
              <button onClick={onPrev} style={{
                background: "var(--input-bg)", border: "1px solid var(--border-color)", borderRadius: "10px",
                padding: "9px 14px", fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)",
                cursor: "pointer", display: "flex", alignItems: "center", gap: "5px", fontFamily: "inherit", transition: "all 0.15s",
              }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = "#7B61FF")}
                onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--border-color)")}>
                <ChevronLeft size={13} /> Kembali
              </button>
            )}
            <button onClick={isLast ? onEnd : onNext} style={{
              flex: 1, background: isLast ? "linear-gradient(135deg, #10b981, #059669)" : "linear-gradient(135deg, #7B61FF, #9B8AFF)",
              border: "none", borderRadius: "10px", padding: "10px 16px",
              fontSize: "13px", fontWeight: 700, color: "#fff", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "7px",
              fontFamily: "inherit", transition: "all 0.15s",
            }}
              onMouseEnter={e => (e.currentTarget.style.transform = "translateY(-1px)")}
              onMouseLeave={e => (e.currentTarget.style.transform = "none")}>
              {isFirst ? <><Play size={13} /> Mulai Tour</> : isLast ? <><CheckCircle2 size={13} /> Selesai!</> : <>Selanjutnya <ChevronRight size={13} /></>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Provider ─────────────────────────────────────────────────────────────────

// phase:
//   "center"    → backdrop gelap + tooltip di tengah (welcome/finish/fallback)
//   "loading"   → backdrop gelap + spinner (navigasi/cari elemen) — TANPA tooltip
//   "spotlight" → spotlight muncul dulu, tooltip belum ada (delay ~0.8s)
//   "ready"     → spotlight + tooltip muncul bersamaan
type TourPhase = "center" | "loading" | "spotlight" | "ready";

export function TourProvider({ children }: { children: React.ReactNode }) {
  const [active, setActive] = useState(false);
  const [step, setStep] = useState(0);
  const [phase, setPhase] = useState<TourPhase>("center");
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  // Ref untuk cancel stale spotlight→ready timer saat step berganti cepat
  const readyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const findTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentStep = STEPS[step];

  const clearTimers = useCallback(() => {
    if (readyTimerRef.current) { clearTimeout(readyTimerRef.current); readyTimerRef.current = null; }
    if (findTimerRef.current) { clearTimeout(findTimerRef.current); findTimerRef.current = null; }
  }, []);

  // Cari elemen target, scroll dulu, tunggu scroll settle, lalu spotlight → ready
  const findTarget = useCallback((selector: string) => {
    const attempt = (tries: number) => {
      const el = document.querySelector(selector);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        // Tunggu scroll selesai → spotlight muncul dulu
        findTimerRef.current = setTimeout(() => {
          const rect = el.getBoundingClientRect();
          setTargetRect(rect);
          setPhase("spotlight"); // highlight elemen, tooltip belum muncul
          // Setelah 0.8s → tooltip slide-in (cancel timer lama dulu)
          if (readyTimerRef.current) clearTimeout(readyTimerRef.current);
          readyTimerRef.current = setTimeout(() => setPhase("ready"), 800);
        }, 500);
      } else if (tries > 0) {
        findTimerRef.current = setTimeout(() => attempt(tries - 1), 500);
      } else {
        setTargetRect(null);
        setPhase("center"); // fallback center jika elemen tidak ditemukan
      }
    };
    attempt(2);
  }, []);

  // Saat step atau pathname berubah
  useEffect(() => {
    if (!active) return;
    clearTimers();

    const isStaticCenter = currentStep.position === "center" || !currentStep.selector;
    if (isStaticCenter) {
      setTargetRect(null);
      setPhase("center");
      return;
    }

    const onCorrectPage = !currentStep.page || pathname === currentStep.page;
    if (onCorrectPage) {
      setPhase("loading");
      setTargetRect(null);
      findTimerRef.current = setTimeout(() => findTarget(currentStep.selector!), 250);
    } else {
      // Belum di halaman yang benar — loading sampai pathname cocok
      setPhase("loading");
      setTargetRect(null);
    }
  }, [active, step, pathname, findTarget, currentStep, clearTimers]);

  // Update rect saat user scroll/resize (hanya saat spotlight atau ready)
  useEffect(() => {
    if (!active || (phase !== "ready" && phase !== "spotlight") || !currentStep.selector) return;
    const update = () => {
      const el = document.querySelector(currentStep.selector!);
      if (el) setTargetRect(el.getBoundingClientRect());
    };
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [active, phase, currentStep.selector]);

  function startTour() {
    clearTimers();
    setStep(0);
    setActive(true);
    setPhase("center"); // step 0 selalu welcome (center)
    setTargetRect(null);
  }

  function endTour() {
    clearTimers();
    setActive(false);
    setStep(0);
    setPhase("center");
    setTargetRect(null);
  }

  function goNext() {
    const nextIdx = step + 1;
    if (nextIdx >= STEPS.length) { endTour(); return; }
    const next = STEPS[nextIdx];
    clearTimers();
    setStep(nextIdx);
    setTargetRect(null);
    // Langsung set phase yang tepat — hindari flash loading untuk step center
    const nextIsCenter = next.position === "center" || !next.selector;
    setPhase(nextIsCenter ? "center" : "loading");
    if (next.page && pathname !== next.page) {
      router.push(next.page);
    }
  }

  function goPrev() {
    const prevIdx = step - 1;
    if (prevIdx < 0) return;
    const prev = STEPS[prevIdx];
    clearTimers();
    setStep(prevIdx);
    setTargetRect(null);
    const prevIsCenter = prev.position === "center" || !prev.selector;
    setPhase(prevIsCenter ? "center" : "loading");
    if (prev.page && pathname !== prev.page) {
      router.push(prev.page);
    }
  }

  return (
    <TourContext.Provider value={{ active, step, total: STEPS.length, startTour, endTour, goNext, goPrev }}>
      {children}

      {active && (
        <>
          <style>{`
            @keyframes tourSlideIn {
              from { opacity: 0; transform: scale(0.92) translateY(8px); }
              to   { opacity: 1; transform: scale(1)   translateY(0); }
            }
            @keyframes tourFadeIn {
              from { opacity: 0; }
              to   { opacity: 1; }
            }
            @keyframes tourPulse {
              0%, 100% { box-shadow: 0 0 0 9999px rgba(0,0,0,0.65), 0 0 0 3px #7B61FF, 0 0 0 6px rgba(123,97,255,0.3); }
              50%       { box-shadow: 0 0 0 9999px rgba(0,0,0,0.65), 0 0 0 3px #9B8AFF, 0 0 0 12px rgba(123,97,255,0.12); }
            }
            @keyframes tourSpin {
              from { transform: rotate(0deg); }
              to   { transform: rotate(360deg); }
            }
          `}</style>

          {/* ── PHASE: center ── backdrop + tooltip di tengah */}
          {phase === "center" && (
            <>
              <div onClick={endTour}
                style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 9999,
                  animation: "tourFadeIn 0.2s ease" }} />
              <TourTooltip
                step={currentStep} rect={null} total={STEPS.length}
                onNext={goNext} onPrev={goPrev} onEnd={endTour}
              />
            </>
          )}

          {/* ── PHASE: loading ── backdrop + spinner, TANPA tooltip */}
          {phase === "loading" && (
            <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 9999,
              display: "flex", alignItems: "center", justifyContent: "center",
              animation: "tourFadeIn 0.15s ease" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "14px" }}>
                <span style={{
                  width: "32px", height: "32px",
                  border: "3px solid rgba(255,255,255,0.2)",
                  borderTopColor: "#7B61FF",
                  borderRadius: "50%",
                  animation: "tourSpin 0.8s linear infinite",
                  display: "inline-block",
                }} />
                <span style={{ color: "rgba(255,255,255,0.7)", fontSize: "13px", fontWeight: 500 }}>
                  Memuat halaman...
                </span>
              </div>
            </div>
          )}

          {/* ── PHASE: spotlight ── spotlight muncul dulu, tooltip belum */}
          {phase === "spotlight" && targetRect && (
            <div style={{
              position: "fixed",
              top: targetRect.top - 6,
              left: targetRect.left - 6,
              width: targetRect.width + 12,
              height: targetRect.height + 12,
              borderRadius: "14px",
              zIndex: 10000,
              pointerEvents: "none",
              animation: "tourPulse 2.2s ease-in-out infinite, tourFadeIn 0.3s ease",
              boxShadow: "0 0 0 9999px rgba(0,0,0,0.65), 0 0 0 3px #7B61FF, 0 0 0 6px rgba(123,97,255,0.3)",
            }} />
          )}

          {/* ── PHASE: ready ── spotlight + tooltip muncul bersamaan setelah 0.8s */}
          {phase === "ready" && targetRect && (
            <>
              <div style={{
                position: "fixed",
                top: targetRect.top - 6,
                left: targetRect.left - 6,
                width: targetRect.width + 12,
                height: targetRect.height + 12,
                borderRadius: "14px",
                zIndex: 10000,
                pointerEvents: "none",
                animation: "tourPulse 2.2s ease-in-out infinite",
                boxShadow: "0 0 0 9999px rgba(0,0,0,0.65), 0 0 0 3px #7B61FF, 0 0 0 6px rgba(123,97,255,0.3)",
              }} />
              <TourTooltip
                step={currentStep} rect={targetRect} total={STEPS.length}
                onNext={goNext} onPrev={goPrev} onEnd={endTour}
              />
            </>
          )}
        </>
      )}
    </TourContext.Provider>
  );
}

// ─── Floating Tour Button ─────────────────────────────────────────────────────

export function TourFloatingButton() {
  const { startTour, active } = useTour();
  if (active) return null;
  return (
    <button
      onClick={startTour}
      title="Mulai Tur Aplikasi"
      className="tour-fab"
      style={{
        position: "fixed", bottom: "24px", right: "24px", zIndex: 8000,
        width: "48px", height: "48px", borderRadius: "50%",
        background: "linear-gradient(135deg, #7B61FF, #9B8AFF)",
        border: "none", cursor: "pointer", display: "flex",
        alignItems: "center", justifyContent: "center",
        boxShadow: "0 4px 20px rgba(123,97,255,0.45)",
        transition: "all 0.2s",
        color: "#fff",
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.1)"; e.currentTarget.style.boxShadow = "0 6px 24px rgba(123,97,255,0.6)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(123,97,255,0.45)"; }}
    >
      <Map size={20} />
    </button>
  );
}

// ─── Sidebar Tour Button ──────────────────────────────────────────────────────

export function SidebarTourButton() {
  const { startTour, active } = useTour();
  return (
    <button
      onClick={startTour}
      disabled={active}
      style={{
        width: "100%", background: active ? "rgba(123,97,255,0.1)" : "rgba(123,97,255,0.15)",
        border: "1px solid rgba(123,97,255,0.3)",
        color: active ? "rgba(155,138,255,0.5)" : "#9B8AFF",
        borderRadius: "8px", padding: "8px 12px",
        fontSize: "12px", cursor: active ? "not-allowed" : "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
        gap: "6px", fontFamily: "inherit", transition: "all 0.18s",
        fontWeight: 600,
      }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.background = "rgba(123,97,255,0.25)"; }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.background = "rgba(123,97,255,0.15)"; }}
    >
      <Map size={13} />
      {active ? "Tour Berjalan..." : "Mulai Tur Fitur"}
    </button>
  );
}
