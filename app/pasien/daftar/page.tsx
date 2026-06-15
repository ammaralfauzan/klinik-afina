"use client";
import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { supabase } from "../../../lib/supabase";
import { Users, ArrowLeft, Search, X, Clock, CheckCircle2, Stethoscope, Download } from "lucide-react";

type PasienRecord = {
  nomor_antrian: number;
  nama: string;
  jenis_kelamin?: string;
  no_hp?: string;
  alamat?: string;
  keluhan: string;
  status: string;
  tanggal_lahir?: string;
  created_at: string;
};

type UniquePatient = {
  nama: string;
  jenis_kelamin: string;
  no_hp: string;
  alamat: string;
  tanggal_lahir?: string;
  totalKunjungan: number;
  kunjungan: PasienRecord[];
  lastVisit: string;
};

export default function DaftarPasienPage() {
  const [records, setRecords] = useState<PasienRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<UniquePatient | null>(null);

  useEffect(() => {
    async function fetchPasien() {
      const { data } = await supabase
        .from("pasien")
        .select("*")
        .order("created_at", { ascending: false });
      if (data) setRecords(data);
      setLoading(false);
    }
    fetchPasien();
  }, []);

  // Group records into unique patients by nama (case-insensitive)
  const uniquePatients = useMemo<UniquePatient[]>(() => {
    const map = new Map<string, UniquePatient>();
    records.forEach((r) => {
      const key = r.nama.trim().toLowerCase();
      if (!map.has(key)) {
        map.set(key, {
          nama: r.nama,
          jenis_kelamin: r.jenis_kelamin || "-",
          no_hp: r.no_hp || "-",
          alamat: r.alamat || "-",
          tanggal_lahir: r.tanggal_lahir,
          totalKunjungan: 1,
          kunjungan: [r],
          lastVisit: r.created_at,
        });
      } else {
        const p = map.get(key)!;
        p.totalKunjungan += 1;
        p.kunjungan.push(r);
        // Update with most recent non-empty data
        if (!p.no_hp || p.no_hp === "-") p.no_hp = r.no_hp || "-";
        if (!p.alamat || p.alamat === "-") p.alamat = r.alamat || "-";
        if (!p.tanggal_lahir) p.tanggal_lahir = r.tanggal_lahir;
        if (new Date(r.created_at) > new Date(p.lastVisit)) p.lastVisit = r.created_at;
      }
    });
    return Array.from(map.values()).sort((a, b) => b.totalKunjungan - a.totalKunjungan);
  }, [records]);

  const filtered = useMemo(() => {
    if (!search.trim()) return uniquePatients;
    const q = search.toLowerCase();
    return uniquePatients.filter(
      (p) =>
        p.nama.toLowerCase().includes(q) ||
        (p.no_hp && p.no_hp.includes(q)) ||
        (p.alamat && p.alamat.toLowerCase().includes(q))
    );
  }, [uniquePatients, search]);

  function handleExportCSV() {
    const headers = ["Nama", "Jenis Kelamin", "Usia", "No HP", "Alamat", "Total Kunjungan", "Kunjungan Terakhir"];
    const rows = uniquePatients.map(p => [
      p.nama,
      p.jenis_kelamin,
      hitungUsia(p.tanggal_lahir),
      p.no_hp,
      p.alamat,
      p.totalKunjungan,
      formatDate(p.lastVisit),
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `daftar-pasien-${new Date().toISOString().split("T")[0]}.csv`;
    a.click(); URL.revokeObjectURL(url);
  }

  function hitungUsia(tanggal_lahir?: string): string {
    if (!tanggal_lahir) return "-";
    const today = new Date();
    const lahir = new Date(tanggal_lahir);
    let usia = today.getFullYear() - lahir.getFullYear();
    const bulan = today.getMonth() - lahir.getMonth();
    if (bulan < 0 || (bulan === 0 && today.getDate() < lahir.getDate())) usia--;
    return `${usia} thn`;
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("id-ID", {
      day: "2-digit", month: "short", year: "numeric",
    });
  }

  function getStatusBadge(status: string) {
    if (status === "Selesai") return { bg: "rgba(16,185,129,0.12)", color: "#059669", border: "rgba(16,185,129,0.25)", icon: CheckCircle2 };
    if (status === "Sedang Diperiksa") return { bg: "rgba(14,165,233,0.12)", color: "#0284c7", border: "rgba(14,165,233,0.25)", icon: Stethoscope };
    return { bg: "rgba(245,158,11,0.12)", color: "#d97706", border: "rgba(245,158,11,0.25)", icon: Clock };
  }

  return (
    <div>
      <style>{`
        .table-row:hover { background: var(--table-hover) !important; }
        .table-wrapper { overflow-x: auto; -webkit-overflow-scrolling: touch; }
        .table-wrapper table { min-width: 780px; }
        .search-input {
          width: 100%; background: var(--input-bg, #F0EFFF); border: 1px solid var(--border-color);
          border-radius: 10px; padding: 10px 14px 10px 38px; font-size: 13px;
          color: var(--text-primary); outline: none; transition: border 0.2s;
          font-family: inherit;
        }
        .search-input::placeholder { color: var(--text-secondary); }
        .search-input:focus { border-color: var(--accent); background: var(--bg-card); }
        .riwayat-btn { transition: all 0.18s; cursor: pointer; }
        .riwayat-btn:hover { opacity: 0.8; }
        /* Modal */
        .modal-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.45);
          display: flex; align-items: center; justify-content: center;
          z-index: 1000; padding: 20px;
          animation: fadeIn 0.18s ease;
        }
        .modal-box {
          background: var(--bg-card); border-radius: 20px;
          width: 100%; max-width: 700px; max-height: 85vh;
          overflow: hidden; display: flex; flex-direction: column;
          box-shadow: 0 20px 60px rgba(0,0,0,0.2);
          animation: slideUp 0.22s ease;
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: "24px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <div style={{ marginBottom: "6px" }}>
            <Link href="/pasien" style={{
              display: "inline-flex", alignItems: "center", gap: "5px", fontSize: "12px",
              color: "var(--text-secondary)", textDecoration: "none",
              background: "var(--bg-card)", border: "1px solid var(--border-color)",
              borderRadius: "8px", padding: "5px 10px",
            }}>
              <ArrowLeft size={12} /> Kembali ke Registrasi
            </Link>
          </div>
          <h1 style={{ fontSize: "24px", fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>Daftar Pasien</h1>
          <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: "4px 0 0" }}>Data pasien unik yang terdaftar di klinik</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "10px 16px" }}>
            <Users size={15} color="var(--accent)" />
            <span style={{ fontSize: "13px", color: "var(--accent)", fontWeight: 600 }}>{uniquePatients.length} Pasien Unik</span>
            <span style={{ color: "var(--border-color)", fontSize: "16px" }}>·</span>
            <span style={{ fontSize: "13px", color: "var(--text-secondary)", fontWeight: 500 }}>{records.length} Total Kunjungan</span>
          </div>
          <button
            onClick={handleExportCSV}
            style={{ display: "flex", alignItems: "center", gap: "7px", background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "10px 16px", fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", cursor: "pointer" }}
          >
            <Download size={14} color="var(--accent)" /> Export CSV
          </button>
        </div>
      </div>

      {/* Search */}
      <div style={{ position: "relative", maxWidth: "360px", marginBottom: "16px" }}>
        <Search size={14} color="var(--text-secondary)" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
        <input
          className="search-input"
          placeholder="Cari nama, no HP, atau alamat..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button onClick={() => setSearch("")} style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", display: "flex" }}>
            <X size={14} color="var(--text-secondary)" />
          </button>
        )}
      </div>

      {/* Table */}
      <div style={{ background: "var(--bg-card)", borderRadius: "16px", border: "1px solid var(--border-color)", overflow: "hidden", boxShadow: "var(--shadow)" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px", color: "var(--text-secondary)" }}>
            <p style={{ fontSize: "13px" }}>Memuat data...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px", color: "var(--text-secondary)" }}>
            <Users size={44} strokeWidth={1} style={{ margin: "0 auto 14px", display: "block", opacity: 0.35 }} />
            <p style={{ fontSize: "15px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "6px" }}>
              {search ? "Pasien tidak ditemukan" : "Belum ada data pasien"}
            </p>
            <p style={{ fontSize: "13px" }}>
              {search ? `Tidak ada hasil untuk "${search}"` : "Daftarkan pasien pertama dari halaman registrasi."}
            </p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-color)", background: "var(--table-header-bg)" }}>
                  {["No", "Nama Pasien", "Jenis Kelamin", "Usia", "No HP", "Alamat", "Total Kunjungan", "Aksi"].map(h => (
                    <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: "11px", fontWeight: 700, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, idx) => (
                  <tr key={p.nama} className="table-row" style={{ borderBottom: "1px solid var(--border-color)", transition: "background 0.15s" }}>
                    <td style={{ padding: "14px 16px", fontWeight: 700, color: "var(--text-secondary)", fontSize: "12px" }}>{idx + 1}</td>
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{p.nama}</div>
                      <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "2px" }}>
                        Terakhir: {formatDate(p.lastVisit)}
                      </div>
                    </td>
                    <td style={{ padding: "14px 16px", color: "var(--text-secondary)" }}>
                      <span style={{
                        padding: "4px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 600,
                        background: p.jenis_kelamin === "Perempuan" ? "rgba(236,72,153,0.08)" : "rgba(14,165,233,0.08)",
                        color: p.jenis_kelamin === "Perempuan" ? "#db2777" : "#0284c7",
                        border: p.jenis_kelamin === "Perempuan" ? "1px solid rgba(236,72,153,0.2)" : "1px solid rgba(14,165,233,0.2)",
                      }}>{p.jenis_kelamin}</span>
                    </td>
                    <td style={{ padding: "14px 16px", color: "var(--text-secondary)", fontWeight: 500 }}>{hitungUsia(p.tanggal_lahir)}</td>
                    <td style={{ padding: "14px 16px", color: "var(--text-secondary)", whiteSpace: "nowrap" }}>{p.no_hp}</td>
                    <td style={{ padding: "14px 16px", color: "var(--text-secondary)", maxWidth: "180px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.alamat}</td>
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{
                          padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: 700,
                          background: "rgba(108,92,231,0.1)", color: "var(--accent)",
                          border: "1px solid rgba(108,92,231,0.2)",
                        }}>{p.totalKunjungan}×</span>
                      </div>
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <button
                        className="riwayat-btn"
                        onClick={() => setSelectedPatient(p)}
                        style={{
                          background: "var(--accent)", color: "#fff",
                          border: "none", borderRadius: "8px",
                          padding: "7px 14px", fontSize: "12px", fontWeight: 600,
                          cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap",
                        }}
                      >
                        Lihat Riwayat
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Riwayat */}
      {selectedPatient && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setSelectedPatient(null); }}>
          <div className="modal-box">
            {/* Modal Header */}
            <div style={{ padding: "22px 24px 18px", borderBottom: "1px solid var(--border-color)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
              <div>
                <h2 style={{ fontSize: "17px", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>{selectedPatient.nama}</h2>
                <p style={{ fontSize: "12px", color: "var(--text-secondary)", margin: "4px 0 0" }}>
                  {selectedPatient.totalKunjungan} kunjungan · {selectedPatient.jenis_kelamin} · {hitungUsia(selectedPatient.tanggal_lahir)} · {selectedPatient.no_hp}
                </p>
              </div>
              <button
                onClick={() => setSelectedPatient(null)}
                style={{ background: "var(--input-bg)", border: "1px solid var(--border-color)", borderRadius: "8px", padding: "7px", cursor: "pointer", display: "flex", alignItems: "center" }}
              >
                <X size={16} color="var(--text-secondary)" />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ overflowY: "auto", flex: 1, padding: "16px 24px 24px" }}>
              <p style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "14px" }}>Riwayat Kunjungan</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {selectedPatient.kunjungan
                  .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                  .map((k, i) => {
                    const st = getStatusBadge(k.status);
                    const StatusIcon = st.icon;
                    return (
                      <div key={k.nomor_antrian} style={{
                        background: "var(--bg-main)", border: "1px solid var(--border-color)",
                        borderRadius: "12px", padding: "14px 16px",
                        display: "flex", alignItems: "flex-start", gap: "12px",
                      }}>
                        <div style={{ width: "28px", height: "28px", borderRadius: "8px", background: st.bg, border: `1px solid ${st.border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <StatusIcon size={13} color={st.color} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                            <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--accent)" }}>Antrian #{k.nomor_antrian}</span>
                            <span style={{
                              padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 600,
                              background: st.bg, color: st.color, border: `1px solid ${st.border}`,
                            }}>{k.status}</span>
                          </div>
                          <p style={{ fontSize: "13px", color: "var(--text-primary)", margin: "0 0 4px", fontWeight: 500 }}>{k.keluhan}</p>
                          <p style={{ fontSize: "11px", color: "var(--text-secondary)", margin: 0 }}>{formatDate(k.created_at)}</p>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
