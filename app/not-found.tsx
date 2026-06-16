"use client";
import Link from "next/link";
import Image from "next/image";

export default function NotFound() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #2E2466 0%, #3D3178 50%, #4B3F9E 100%)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "24px",
    }}>
      <div style={{ textAlign: "center", color: "#fff", maxWidth: "420px" }}>
        <div style={{
          width: "72px", height: "72px", borderRadius: "50%",
          background: "#fff", border: "2px solid rgba(255,255,255,0.3)",
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          padding: "6px", marginBottom: "24px",
        }}>
          <Image src="/logo-afina.png" alt="Klinik Afina" width={56} height={56} style={{ width: "100%", height: "100%", objectFit: "contain", borderRadius: "50%" }} />
        </div>
        <p style={{ fontSize: "72px", fontWeight: 800, margin: "0 0 8px", lineHeight: 1, opacity: 0.6 }}>404</p>
        <h1 style={{ fontSize: "20px", fontWeight: 700, margin: "0 0 8px" }}>Halaman tidak ditemukan</h1>
        <p style={{ fontSize: "13px", opacity: 0.7, margin: "0 0 32px", lineHeight: 1.6 }}>
          Halaman yang kamu cari tidak ada atau sudah dipindahkan.
        </p>
        <Link href="/" style={{
          display: "inline-block", background: "#6C5CE7", color: "#fff",
          borderRadius: "12px", padding: "12px 28px", fontWeight: 700,
          fontSize: "14px", textDecoration: "none",
        }}>
          Kembali ke Dashboard
        </Link>
      </div>
    </div>
  );
}
