"use client";
import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { Volume2, VolumeX, Bell } from "lucide-react";

type AudioCtx = {
  muted: boolean;
  toggleMute: () => void;
  playDing: () => void;
  playDingDing: () => void;
  playDingDown: () => void;
  sendPushNotif: (title: string, body: string) => void;
};

const AudioContext = createContext<AudioCtx | null>(null);

function makeAudioCtx() {
  try {
    return new (window.AudioContext || (window as any).webkitAudioContext)();
  } catch { return null; }
}

function playTone(ctx: AudioContext, freq: number, start: number, duration: number, vol = 0.35) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.frequency.value = freq;
  osc.type = "sine";
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(vol, start + 0.02);
  gain.gain.linearRampToValueAtTime(0, start + duration);
  osc.start(start);
  osc.stop(start + duration + 0.05);
}

export function AudioProvider({ children }: { children: ReactNode }) {
  const [muted, setMuted] = useState(false);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Client-only: tampilkan banner hanya jika izin notifikasi belum diputuskan
    if (typeof window !== "undefined" && "Notification" in window) {
      setShowBanner(Notification.permission === "default");
    }
  }, []);

  const toggleMute = useCallback(() => setMuted(m => !m), []);

  const sendPushNotif = useCallback((title: string, body: string) => {
    if (!("Notification" in window) || Notification.permission !== "granted") return;
    // Use service worker notification if available, else fallback
    if (navigator.serviceWorker?.controller) {
      navigator.serviceWorker.ready.then(reg => {
        reg.showNotification(title, { body, icon: "/logo-afina.png", tag: "klinik-antrian" });
      }).catch(() => {});
    } else {
      new Notification(title, { body, icon: "/logo-afina.png" });
    }
  }, []);

  const playDing = useCallback(() => {
    if (muted) return;
    const ctx = makeAudioCtx();
    if (!ctx) return;
    playTone(ctx, 440, ctx.currentTime, 0.3, 0.3);
  }, [muted]);

  const playDingDing = useCallback(() => {
    if (muted) return;
    const ctx = makeAudioCtx();
    if (!ctx) return;
    playTone(ctx, 880, ctx.currentTime, 0.22, 0.4);
    playTone(ctx, 880, ctx.currentTime + 0.35, 0.22, 0.4);
  }, [muted]);

  const playDingDown = useCallback(() => {
    if (muted) return;
    const ctx = makeAudioCtx();
    if (!ctx) return;
    playTone(ctx, 880, ctx.currentTime, 0.2, 0.3);
    playTone(ctx, 440, ctx.currentTime + 0.3, 0.3, 0.2);
  }, [muted]);

  return (
    <AudioContext.Provider value={{ muted, toggleMute, playDing, playDingDing, playDingDown, sendPushNotif }}>
      {children}
      {/* Push notification permission prompt — shown once if not yet granted */}
      {showBanner && (
        <PushPermissionBanner onGrant={() => setShowBanner(false)} />
      )}
    </AudioContext.Provider>
  );
}

function PushPermissionBanner({ onGrant }: { onGrant: () => void }) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;
  return (
    <div style={{
      position: "fixed", bottom: "80px", right: "20px", zIndex: 9000,
      background: "var(--bg-card)", border: "1px solid var(--border-color)",
      borderRadius: "14px", padding: "14px 18px", boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
      maxWidth: "300px", display: "flex", flexDirection: "column", gap: "10px",
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
        <Bell size={16} color="var(--accent)" style={{ flexShrink: 0, marginTop: 2 }} />
        <div>
          <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>Aktifkan Notifikasi</p>
          <p style={{ fontSize: "12px", color: "var(--text-secondary)", margin: "3px 0 0", lineHeight: 1.5 }}>
            Terima notifikasi saat ada pasien baru, bahkan ketika tab browser tidak aktif.
          </p>
        </div>
      </div>
      <div style={{ display: "flex", gap: "8px" }}>
        <button
          onClick={() => {
            Notification.requestPermission().then(p => {
              if (p === "granted") onGrant();
              setDismissed(true);
            });
          }}
          style={{ flex: 1, background: "var(--accent)", color: "#fff", border: "none", borderRadius: "8px", padding: "8px", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}
        >
          Aktifkan
        </button>
        <button
          onClick={() => setDismissed(true)}
          style={{ background: "var(--input-bg)", color: "var(--text-secondary)", border: "1px solid var(--border-color)", borderRadius: "8px", padding: "8px 12px", fontSize: "12px", cursor: "pointer" }}
        >
          Nanti
        </button>
      </div>
    </div>
  );
}

export function useAudio() {
  const ctx = useContext(AudioContext);
  if (!ctx) throw new Error("useAudio must be used inside AudioProvider");
  return ctx;
}

export function MuteButton() {
  const { muted, toggleMute } = useAudio();
  return (
    <button
      onClick={toggleMute}
      title={muted ? "Aktifkan suara notifikasi" : "Matikan suara notifikasi"}
      style={{
        width: "36px", height: "36px", borderRadius: "50%",
        border: "1px solid var(--border-color)",
        background: "var(--input-bg)",
        display: "flex", alignItems: "center", justifyContent: "center",
        cursor: "pointer", transition: "background 0.18s", flexShrink: 0,
      }}
      onMouseEnter={e => (e.currentTarget.style.background = "var(--border-color)")}
      onMouseLeave={e => (e.currentTarget.style.background = "var(--input-bg)")}
    >
      {muted
        ? <VolumeX size={15} color="var(--text-secondary)" strokeWidth={1.8} />
        : <Volume2 size={15} color="var(--accent)" strokeWidth={1.8} />
      }
    </button>
  );
}
