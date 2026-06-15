"use client";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import ThemeToggle from "./ThemeToggle";
import Image from "next/image";

export default function ThemedLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname === "/login") {
    return <>{children}</>;
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg-main)" }}>
      <Sidebar />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>

        {/* DESKTOP HEADER */}
        <header className="desktop-header" style={{
          background: "var(--bg-header)", padding: "14px 20px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          borderBottom: "1px solid var(--border-header)",
          backdropFilter: "blur(10px)", position: "sticky", top: 0, zIndex: 10,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "3px", height: "18px", borderRadius: "2px", background: "linear-gradient(180deg, #F5A623, #7B61FF)" }} />
            <h2 style={{ fontSize: "14px", fontWeight: 600, color: "var(--header-text)", letterSpacing: "0.03em" }}>
              Klinik Afina — Sistem Manajemen
            </h2>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <ThemeToggle />
            <div style={{ background: "rgba(123,97,255,0.08)", border: "1px solid rgba(123,97,255,0.2)", borderRadius: "20px", padding: "6px 16px", fontSize: "12px", color: "var(--accent)", fontWeight: 500 }}>
              ✦ Selamat datang, Admin
            </div>
          </div>
        </header>

        {/* MOBILE HEADER */}
        <header className="mobile-header">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "#fff", border: "1px solid rgba(168,85,247,0.3)", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Image src="/logo-afina.png" alt="Logo" width={36} height={36} style={{ width: "88%", height: "88%", objectFit: "contain" }} />
            </div>
            <div>
              <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--header-text)", margin: 0 }}>Klinik & RB Afina</p>
              <p style={{ fontSize: "10px", color: "var(--text-secondary)", margin: 0 }}>Sistem Manajemen</p>
            </div>
          </div>
          <ThemeToggle />
        </header>

        <main className="main-content" style={{ flex: 1, padding: "28px" }}>{children}</main>
      </div>
    </div>
  );
}
