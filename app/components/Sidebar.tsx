"use client";
import Link from "next/link";
import { useState } from "react";

const navItems = [
  { label: "Dashboard", icon: "📊", href: "/" },
  { label: "Antrian", icon: "🔢", href: "/antrian" },
  { label: "Pasien", icon: "👤", href: "/pasien" },
  { label: "Laporan", icon: "📈", href: "/laporan" },
  { label: "Pengaturan", icon: "⚙️", href: "/pengaturan" },
];

export default function Sidebar() {
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <aside style={{
      width: "220px", minHeight: "100vh",
      background: "linear-gradient(180deg, #6b21a8 0%, #9d174d 100%)",
      display: "flex", flexDirection: "column",
      boxShadow: "4px 0 20px rgba(107,33,168,0.15)"
    }}>
      <div style={{ padding: "24px 20px 20px", borderBottom: "1px solid rgba(255,255,255,0.15)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            width: "36px", height: "36px", borderRadius: "50%",
            background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px"
          }}>🏥</div>
          <div>
            <h1 style={{ color: "#fff", fontWeight: 700, fontSize: "15px", margin: 0 }}>Klinik Afina</h1>
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "11px", margin: 0 }}>Sistem Manajemen</p>
          </div>
        </div>
      </div>

      <nav style={{ flex: 1, padding: "16px 12px", display: "flex", flexDirection: "column", gap: "4px" }}>
        {navItems.map((item) => (
          <Link key={item.label} href={item.href}
            onMouseEnter={() => setHovered(item.label)}
            onMouseLeave={() => setHovered(null)}
            style={{
              display: "flex", alignItems: "center", gap: "10px",
              padding: "10px 12px", borderRadius: "10px", fontSize: "13px",
              color: "rgba(255,255,255,0.85)", textDecoration: "none",
              background: hovered === item.label ? "rgba(255,255,255,0.15)" : "transparent",
              transition: "background 0.2s",
            }}>
            <span style={{ fontSize: "16px" }}>{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      <div style={{ padding: "16px 20px", borderTop: "1px solid rgba(255,255,255,0.15)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{
            width: "28px", height: "28px", borderRadius: "50%",
            background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px"
          }}>👩‍⚕️</div>
          <div>
            <p style={{ color: "#fff", fontSize: "12px", fontWeight: 600, margin: 0 }}>Admin</p>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "10px", margin: 0 }}>Administrator</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
