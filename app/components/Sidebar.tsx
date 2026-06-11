"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "./ThemeProvider";
import { LayoutDashboard, Users, ClipboardList, BarChart3, Settings } from "lucide-react";
import Image from "next/image";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/" },
  { label: "Antrian", icon: ClipboardList, href: "/antrian" },
  { label: "Pasien", icon: Users, href: "/pasien" },
  { label: "Laporan", icon: BarChart3, href: "/laporan" },
  { label: "Pengaturan", icon: Settings, href: "/pengaturan" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { dark } = useTheme();

  const sidebarBg = dark
    ? "linear-gradient(180deg, #0f0520 0%, #1a0533 50%, #0f0a1e 100%)"
    : "linear-gradient(180deg, #3b0764 0%, #6b21a8 50%, #4a1272 100%)";

  return (
    <>
      <style>{`
        @keyframes pulse-glow {
          0%, 100% { filter: drop-shadow(0 0 3px rgba(236,72,153,0.4)); transform: scale(1); }
          50% { filter: drop-shadow(0 0 8px rgba(236,72,153,0.9)); transform: scale(1.12); }
        }
        @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-3px); }
        }
        @keyframes logo-spin {
          0%, 100% { box-shadow: 0 0 12px rgba(236,72,153,0.4), 0 0 24px rgba(168,85,247,0.2); }
          50% { box-shadow: 0 0 20px rgba(236,72,153,0.8), 0 0 40px rgba(168,85,247,0.4); }
        }
        .nav-icon-active { animation: pulse-glow 2s ease-in-out infinite; }
        .nav-icon-settings { animation: spin-slow 6s linear infinite; }
        .nav-icon-default { animation: float 3s ease-in-out infinite; }
        .nav-link { border: 1px solid transparent; }
        .nav-link:hover { background: rgba(236,72,153,0.15) !important; border-color: rgba(236,72,153,0.25) !important; }
        .nav-link-active {
          background: linear-gradient(135deg, rgba(236,72,153,0.25), rgba(168,85,247,0.25)) !important;
          border-color: rgba(236,72,153,0.4) !important;
          box-shadow: 0 0 12px rgba(236,72,153,0.15) !important;
        }
        .logo-circle { animation: logo-spin 3s ease-in-out infinite; }
        .desktop-sidebar { display: flex; width: 230px; min-height: 100vh; flex-shrink: 0; }
        .mobile-bottomnav { display: none; }
        @media (max-width: 768px) {
          .desktop-sidebar { display: none !important; }
          .mobile-bottomnav {
            display: flex; position: fixed; bottom: 0; left: 0; right: 0; z-index: 100;
            background: linear-gradient(135deg, #0f0520, #1a0533);
            border-top: 1px solid rgba(168,85,247,0.3);
            padding: 8px 0 20px; justify-content: space-around;
            box-shadow: 0 -4px 20px rgba(107,33,168,0.3);
          }
          .mobile-nav-item { display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 6px 12px; border-radius: 12px; text-decoration: none; transition: all 0.2s; min-width: 56px; }
          .mobile-nav-item span { font-size: 10px; font-weight: 600; }
          .mobile-nav-active { background: rgba(236,72,153,0.2) !important; }
        }
      `}</style>

      {/* DESKTOP SIDEBAR */}
      <aside className="desktop-sidebar" style={{ position: "relative", overflow: "hidden", background: sidebarBg, flexDirection: "column", boxShadow: "4px 0 30px rgba(168,85,247,0.3)" }}>
        <div style={{ position: "absolute", inset: 0, opacity: 0.07, pointerEvents: "none", backgroundImage: "linear-gradient(rgba(168,85,247,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(168,85,247,0.5) 1px, transparent 1px)", backgroundSize: "24px 24px" }} />

        {/* Logo */}
        <div style={{ padding: "20px", borderBottom: "1px solid rgba(255,255,255,0.15)", position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div className="logo-circle" style={{ width: "40px", height: "40px", borderRadius: "50%", overflow: "hidden", flexShrink: 0, border: "2px solid rgba(236,72,153,0.6)", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Image src="/logo-afina-cropped.png" alt="Klinik Afina" width={40} height={40} style={{ width: "130%", height: "130%", objectFit: "contain", marginTop: "8px" }} />
            </div>
            <div>
              <h1 style={{ color: "#fff", fontWeight: 800, fontSize: "14px", margin: 0 }}>Klinik & RB Afina</h1>
              <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "10px", margin: 0, textTransform: "uppercase", letterSpacing: "0.08em" }}>Sistem Manajemen</p>
            </div>
          </div>
          <div style={{ position: "absolute", bottom: 0, left: "20px", right: "20px", height: "1px", background: "linear-gradient(90deg, transparent, #a855f7, transparent)" }} />
        </div>

        <nav style={{ flex: 1, padding: "16px 12px", display: "flex", flexDirection: "column", gap: "4px" }}>
          {navItems.map((item, i) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            const isSettings = item.href === "/pengaturan";
            return (
              <Link key={item.label} href={item.href} className={`nav-link ${isActive ? "nav-link-active" : ""}`} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "11px 14px", borderRadius: "12px", fontSize: "13px", color: isActive ? "#f9a8d4" : "rgba(255,255,255,0.75)", textDecoration: "none", transition: "all 0.2s", fontWeight: isActive ? 600 : 400 }}>
                <span className={isActive ? "nav-icon-active" : isSettings ? "nav-icon-settings" : "nav-icon-default"} style={{ display: "flex", animationDelay: `${i * 0.3}s` }}>
                  <Icon size={17} color={isActive ? "#ec4899" : "#c084fc"} strokeWidth={isActive ? 2.5 : 1.8} />
                </span>
                <span>{item.label}</span>
                {isActive && <div style={{ marginLeft: "auto", width: "6px", height: "6px", borderRadius: "50%", background: "#ec4899", boxShadow: "0 0 8px #ec4899" }} />}
              </Link>
            );
          })}
        </nav>

        <div style={{ padding: "16px 20px", borderTop: "1px solid rgba(168,85,247,0.2)", position: "relative" }}>
          <div style={{ position: "absolute", top: 0, left: "20px", right: "20px", height: "1px", background: "linear-gradient(90deg, transparent, #a855f7, transparent)" }} />
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "linear-gradient(135deg, #ec4899, #a855f7)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 12px rgba(168,85,247,0.4)" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </div>
            <div>
              <p style={{ color: "#fff", fontSize: "12px", fontWeight: 600, margin: 0 }}>Admin</p>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "10px", margin: 0 }}>Administrator</p>
            </div>
            <div style={{ marginLeft: "auto", width: "8px", height: "8px", borderRadius: "50%", background: "#4ade80", boxShadow: "0 0 8px #4ade80" }} />
          </div>
        </div>
      </aside>

      {/* MOBILE BOTTOM NAV */}
      <nav className="mobile-bottomnav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link key={item.label} href={item.href} className={`mobile-nav-item ${isActive ? "mobile-nav-active" : ""}`}>
              <Icon size={22} color={isActive ? "#ec4899" : "rgba(255,255,255,0.5)"} strokeWidth={isActive ? 2.5 : 1.8} />
              <span style={{ color: isActive ? "#ec4899" : "rgba(255,255,255,0.5)" }}>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
