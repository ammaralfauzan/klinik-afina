"use client";
import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { Volume2, VolumeX } from "lucide-react";

type AudioCtx = {
  muted: boolean;
  toggleMute: () => void;
  playDing: () => void;
  playDingDing: () => void;
  playDingDown: () => void;
};

const AudioContext = createContext<AudioCtx | null>(null);

function makeAudioCtx() {
  try {
    return new (window.AudioContext || (window as any).webkitAudioContext)();
  } catch { return null; }
}

function playTone(
  ctx: AudioContext, freq: number, start: number,
  duration: number, vol = 0.35
) {
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

  const toggleMute = useCallback(() => setMuted(m => !m), []);

  // Pasien baru daftar — soft ding 440hz
  const playDing = useCallback(() => {
    if (muted) return;
    const ctx = makeAudioCtx();
    if (!ctx) return;
    playTone(ctx, 440, ctx.currentTime, 0.3, 0.3);
  }, [muted]);

  // Dipanggil — ding ding 2x 880hz
  const playDingDing = useCallback(() => {
    if (muted) return;
    const ctx = makeAudioCtx();
    if (!ctx) return;
    playTone(ctx, 880, ctx.currentTime, 0.22, 0.4);
    playTone(ctx, 880, ctx.currentTime + 0.35, 0.22, 0.4);
  }, [muted]);

  // Selesai — turun 880 → 440hz
  const playDingDown = useCallback(() => {
    if (muted) return;
    const ctx = makeAudioCtx();
    if (!ctx) return;
    playTone(ctx, 880, ctx.currentTime, 0.2, 0.3);
    playTone(ctx, 440, ctx.currentTime + 0.3, 0.3, 0.2);
  }, [muted]);

  return (
    <AudioContext.Provider value={{ muted, toggleMute, playDing, playDingDing, playDingDown }}>
      {children}
    </AudioContext.Provider>
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
