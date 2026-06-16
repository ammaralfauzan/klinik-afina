"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { getTodayRange } from "../../lib/utils";
import { CheckCircle, Clock, Users, ChevronRight, Phone, User, Calendar, AlertCircle, Share2 } from "lucide-react";

const KELUHAN_CHIPS = [
  "Demam", "Batuk & Pilek", "Sakit Kepala", "Sakit Perut / Mual",
  "Diare", "Sesak Napas", "Nyeri Dada", "Nyeri Sendi / Otot",
  "Luka / Cedera", "Alergi / Gatal-gatal", "Kontrol Rutin", "Imunisasi / Vaksin",
  "Pemeriksaan Kehamilan", "Lainnya",
];

type Step = "form" | "submitting" | "success";

function padNo(n: number) { return String(n).padStart(3, "0"); }

export default function DaftarOnlinePage() {
  const [step, setStep] = useState<Step>("form");
  const [menunggu, setMenunggu] = useState(0);
  const [nomorTerakhir, setNomorTerakhir] = useState(0);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    nama: "", no_hp: "", tanggal_lahir: "", jenis_kelamin: "Perempuan", keluhan: "", keluhan_custom: "",
  });
  const [result, setResult] = useState<{ nomor: number; nama: string } | null>(null);

  useEffect(() => {
    fetchStatus();
    const channel = supabase.channel("online-daftar-status")
      .on("postgres_changes", { event: "*", schema: "public", table: "pasien" }, fetchStatus)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  async function fetchStatus() {
    const { start, end } = getTodayRange();
    const { data } = await supabase.from("pasien")
      .select("nomor_antrian, status")
      .gte("created_at", start).lte("created_at", end)
      .order("nomor_antrian", { ascending: false });
    if (data) {
      setNomorTerakhir(data[0]?.nomor_antrian || 0);
      setMenunggu(data.filter(p => p.status === "Menunggu").length);
    }
  }

  async function handleSubmit() {
    const keluhanFinal = form.keluhan === "Lainnya" ? form.keluhan_custom.trim() : form.keluhan;
    if (!form.nama.trim()) { setError("Nama lengkap wajib diisi"); return; }
    if (!form.no_hp.trim()) { setError("Nomor HP wajib diisi"); return; }
    if (!keluhanFinal) { setError("Pilih keluhan utama"); return; }
    setError(""); setStep("submitting");

    const { start, end } = getTodayRange();
    const { data: todayData } = await supabase.from("pasien")
      .select("nomor_antrian").gte("created_at", start).lte("created_at", end)
      .order("nomor_antrian", { ascending: false }).limit(1);
    const nomor = (todayData?.[0]?.nomor_antrian || 0) + 1;

    const { error: err } = await supabase.from("pasien").insert([{
      nomor_antrian: nomor,
      nama: form.nama.trim(),
      no_hp: form.no_hp.trim(),
      tanggal_lahir: form.tanggal_lahir || null,
      jenis_kelamin: form.jenis_kelamin,
      keluhan: keluhanFinal,
      status: "Menunggu",
      jenis_pembayaran: "Umum",
      nomor_rm: "",
    }]);

    if (err) {
      setError("Gagal mendaftar, coba lagi: " + err.message);
      setStep("form");
    } else {
      setResult({ nomor, nama: form.nama.trim() });
      setStep("success");
      fetchStatus();
    }
  }

  function shareWA() {
    if (!result) return;
    const msg = `Halo, saya ${result.nama} sudah mendaftar online di Klinik & RB Afina.\n📋 No. Antrian: *${padNo(result.nomor)}*\n\nSaya akan segera datang ke klinik.`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
  }

  function daftarLagi() {
    setForm({ nama: "", no_hp: "", tanggal_lahir: "", jenis_kelamin: "Perempuan", keluhan: "", keluhan_custom: "" });
    setResult(null);
    setStep("form");
  }

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg, #1A1A2E 0%, #2D1B69 60%, #1A1A2E 100%)", display: "flex", flexDirection: "column", alignItems: "center", padding: "20px 16px 40px" }}>
      <style>{`
        * { box-sizing: border-box; }
        .dol-card { background: rgba(255,255,255,0.97); border-radius: 20px; padding: 28px 24px; width: 100%; max-width: 480px; box-shadow: 0 20px 60px rgba(0,0,0,0.35); }
        .dol-input { width: 100%; background: #F5F4FF; border: 1.5px solid #E0DFFF; border-radius: 12px; padding: 12px 16px 12px 42px; font-size: 14px; color: #1A1A2E; outline: none; transition: border 0.2s; font-family: inherit; }
        .dol-input:focus { border-color: #7B61FF; background: #fff; }
        .dol-input::placeholder { color: #aaa; }
        .dol-input-plain { padding-left: 16px; }
        .dol-label { font-size: 11px; font-weight: 700; color: #7B61FF; text-transform: uppercase; letter-spacing: 0.07em; display: block; margin-bottom: 7px; }
        .dol-chip { border: 1.5px solid #E0DFFF; background: #F8F7FF; border-radius: 20px; padding: 7px 14px; font-size: 12px; font-weight: 600; color: #555; cursor: pointer; transition: all 0.15s; font-family: inherit; }
        .dol-chip:hover { border-color: #7B61FF; color: #7B61FF; background: #EDE9FF; }
        .dol-chip.active { border-color: #7B61FF; background: #7B61FF; color: #fff; }
        .dol-submit { width: 100%; background: linear-gradient(135deg, #7B61FF, #9B8AFF); border: none; border-radius: 14px; padding: 15px; font-size: 15px; font-weight: 700; color: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.2s; margin-top: 8px; font-family: inherit; }
        .dol-submit:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(123,97,255,0.45); }
        .dol-submit:disabled { opacity: 0.7; cursor: not-allowed; }
        .gender-btn { flex: 1; border: 1.5px solid #E0DFFF; background: #F8F7FF; border-radius: 10px; padding: 10px; font-size: 13px; font-weight: 600; color: #555; cursor: pointer; transition: all 0.15s; font-family: inherit; }
        .gender-btn.active { border-color: #7B61FF; background: #EDE9FF; color: #7B61FF; }
        @keyframes popIn { from { opacity: 0; transform: scale(0.85); } to { opacity: 1; transform: scale(1); } }
        .pop-in { animation: popIn 0.5s cubic-bezier(0.34,1.56,0.64,1); }
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 0.8s linear infinite; }
      `}</style>

      {/* Brand header */}
      <div style={{ textAlign: "center", marginBottom: "24px", marginTop: "16px" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "14px", background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px" }}>
            🏥
          </div>
          <div style={{ textAlign: "left" }}>
            <p style={{ fontSize: "18px", fontWeight: 800, color: "#fff", margin: 0 }}>Klinik & RB Afina</p>
            <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.6)", margin: 0 }}>Pendaftaran Antrian Online</p>
          </div>
        </div>
      </div>

      {/* Status bar */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px", width: "100%", maxWidth: "480px" }}>
        <div style={{ flex: 1, background: "rgba(255,255,255,0.1)", borderRadius: "12px", padding: "12px 16px", display: "flex", alignItems: "center", gap: "8px" }}>
          <Clock size={15} color="rgba(255,255,255,0.7)" />
          <div>
            <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.6)", margin: 0, textTransform: "uppercase", letterSpacing: "0.06em" }}>Menunggu</p>
            <p style={{ fontSize: "18px", fontWeight: 800, color: "#fff", margin: 0 }}>{menunggu}</p>
          </div>
        </div>
        <div style={{ flex: 1, background: "rgba(255,255,255,0.1)", borderRadius: "12px", padding: "12px 16px", display: "flex", alignItems: "center", gap: "8px" }}>
          <Users size={15} color="rgba(255,255,255,0.7)" />
          <div>
            <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.6)", margin: 0, textTransform: "uppercase", letterSpacing: "0.06em" }}>No. Terakhir</p>
            <p style={{ fontSize: "18px", fontWeight: 800, color: "#fff", margin: 0 }}>{nomorTerakhir > 0 ? padNo(nomorTerakhir) : "—"}</p>
          </div>
        </div>
      </div>

      {/* Success screen */}
      {step === "success" && result && (
        <div className="dol-card pop-in">
          <div style={{ textAlign: "center", padding: "8px 0 20px" }}>
            <div style={{ width: "72px", height: "72px", borderRadius: "50%", background: "rgba(16,185,129,0.1)", border: "2px solid rgba(16,185,129,0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <CheckCircle size={36} color="#10b981" strokeWidth={1.5} />
            </div>
            <p style={{ fontSize: "14px", color: "#6b7280", margin: "0 0 4px" }}>Pendaftaran Berhasil!</p>
            <p style={{ fontSize: "28px", fontWeight: 800, color: "#1A1A2E", margin: "0 0 4px" }}>{result.nama}</p>
            <p style={{ fontSize: "13px", color: "#6b7280", margin: 0 }}>Nomor Antrian Anda</p>
          </div>

          <div style={{ background: "linear-gradient(135deg, #7B61FF, #9B8AFF)", borderRadius: "16px", padding: "24px", textAlign: "center", marginBottom: "20px" }}>
            <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.7)", margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.08em" }}>No. Antrian</p>
            <p style={{ fontSize: "72px", fontWeight: 900, color: "#fff", margin: 0, lineHeight: 1, letterSpacing: "-2px" }}>{padNo(result.nomor)}</p>
          </div>

          <div style={{ background: "#FFF9ED", border: "1px solid #FDE68A", borderRadius: "12px", padding: "14px 16px", marginBottom: "20px", display: "flex", alignItems: "flex-start", gap: "10px" }}>
            <AlertCircle size={15} color="#d97706" style={{ flexShrink: 0, marginTop: 1 }} />
            <p style={{ fontSize: "12px", color: "#92400e", margin: 0, lineHeight: 1.5 }}>
              Silakan datang ke klinik dan tunjukkan nomor antrian ini kepada petugas. Antrian akan hangus jika Anda tidak hadir.
            </p>
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <button onClick={shareWA} style={{ flex: 1, background: "#25D366", border: "none", borderRadius: "12px", padding: "13px", color: "#fff", fontSize: "13px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "7px", fontFamily: "inherit" }}>
              <Share2 size={14} /> Bagikan ke WA
            </button>
            <button onClick={daftarLagi} style={{ flex: 1, background: "#F5F4FF", border: "1.5px solid #E0DFFF", borderRadius: "12px", padding: "13px", color: "#7B61FF", fontSize: "13px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
              Daftar Lagi
            </button>
          </div>
        </div>
      )}

      {/* Form */}
      {(step === "form" || step === "submitting") && (
        <div className="dol-card">
          <h2 style={{ fontSize: "18px", fontWeight: 800, color: "#1A1A2E", margin: "0 0 20px" }}>Formulir Pendaftaran</h2>

          {error && (
            <div style={{ background: "#FEE2E2", border: "1px solid #FCA5A5", borderRadius: "10px", padding: "10px 14px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
              <AlertCircle size={14} color="#ef4444" />
              <p style={{ fontSize: "13px", color: "#dc2626", margin: 0 }}>{error}</p>
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* Nama */}
            <div>
              <label className="dol-label">Nama Lengkap *</label>
              <div style={{ position: "relative" }}>
                <User size={15} color="#aaa" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)" }} />
                <input className="dol-input" placeholder="Nama sesuai KTP" value={form.nama} onChange={e => setForm(f => ({ ...f, nama: e.target.value }))} />
              </div>
            </div>

            {/* No HP */}
            <div>
              <label className="dol-label">Nomor HP / WA *</label>
              <div style={{ position: "relative" }}>
                <Phone size={15} color="#aaa" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)" }} />
                <input className="dol-input" type="tel" placeholder="08xx-xxxx-xxxx" value={form.no_hp} onChange={e => setForm(f => ({ ...f, no_hp: e.target.value }))} />
              </div>
            </div>

            {/* Jenis Kelamin */}
            <div>
              <label className="dol-label">Jenis Kelamin</label>
              <div style={{ display: "flex", gap: "8px" }}>
                {["Laki-laki", "Perempuan"].map(g => (
                  <button key={g} className={`gender-btn${form.jenis_kelamin === g ? " active" : ""}`} onClick={() => setForm(f => ({ ...f, jenis_kelamin: g }))}>
                    {g === "Laki-laki" ? "👨 Laki-laki" : "👩 Perempuan"}
                  </button>
                ))}
              </div>
            </div>

            {/* Tanggal Lahir */}
            <div>
              <label className="dol-label">Tanggal Lahir <span style={{ color: "#aaa", fontWeight: 400 }}>(opsional)</span></label>
              <div style={{ position: "relative" }}>
                <Calendar size={15} color="#aaa" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)" }} />
                <input className="dol-input" type="date" value={form.tanggal_lahir} onChange={e => setForm(f => ({ ...f, tanggal_lahir: e.target.value }))} />
              </div>
            </div>

            {/* Keluhan */}
            <div>
              <label className="dol-label">Keluhan Utama *</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "7px" }}>
                {KELUHAN_CHIPS.map(k => (
                  <button key={k} className={`dol-chip${form.keluhan === k ? " active" : ""}`} onClick={() => setForm(f => ({ ...f, keluhan: k }))}>
                    {k}
                  </button>
                ))}
              </div>
              {form.keluhan === "Lainnya" && (
                <input
                  className="dol-input dol-input-plain"
                  placeholder="Ceritakan keluhan Anda..."
                  value={form.keluhan_custom}
                  onChange={e => setForm(f => ({ ...f, keluhan_custom: e.target.value }))}
                  style={{ marginTop: "10px" }}
                />
              )}
            </div>
          </div>

          <button className="dol-submit" onClick={handleSubmit} disabled={step === "submitting"}>
            {step === "submitting" ? (
              <>
                <span className="spin" style={{ width: "16px", height: "16px", border: "2.5px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", display: "inline-block" }} />
                Mendaftarkan...
              </>
            ) : (
              <>Ambil Nomor Antrian <ChevronRight size={16} /></>
            )}
          </button>

          <p style={{ fontSize: "11px", color: "#aaa", textAlign: "center", margin: "12px 0 0", lineHeight: 1.5 }}>
            Data Anda disimpan untuk keperluan rekam medis klinik dan tidak dibagikan ke pihak lain.
          </p>
        </div>
      )}

      <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)", marginTop: "24px", textAlign: "center" }}>
        Klinik & RB Afina · Sistem Antrian Online
      </p>
    </div>
  );
}
