import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "./components/Sidebar";
import ThemeProvider from "./components/ThemeProvider";
import ThemeToggle from "./components/ThemeToggle";

export const metadata: Metadata = {
  title: "Klinik Afina",
  description: "Sistem Manajemen Klinik",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <head>
        <style>{`
          [data-theme="dark"] {
            --bg-main: linear-gradient(135deg, #0d0d1a 0%, #130825 100%);
            --bg-header: rgba(15,5,32,0.95);
            --bg-card: rgba(255,255,255,0.03);
            --border-color: rgba(168,85,247,0.15);
            --border-header: rgba(168,85,247,0.2);
            --text-primary: #f1e6ff;
            --text-secondary: #6b7280;
            --text-accent: #e9d5ff;
            --accent: #a855f7;
            --accent2: #ec4899;
            --header-text: #e2d4f0;
            --table-hover: rgba(168,85,247,0.05);
            --table-header-bg: rgba(168,85,247,0.06);
            --shadow: 0 4px 24px rgba(0,0,0,0.3);
          }
          [data-theme="light"] {
            --bg-main: linear-gradient(135deg, #f8f4ff 0%, #fdf2f8 100%);
            --bg-header: rgba(255,255,255,0.98);
            --bg-card: #ffffff;
            --border-color: rgba(168,85,247,0.2);
            --border-header: rgba(168,85,247,0.15);
            --text-primary: #1e1b2e;
            --text-secondary: #6b7280;
            --text-accent: #4a1272;
            --accent: #7c3aed;
            --accent2: #db2777;
            --header-text: #3b0764;
            --table-hover: rgba(168,85,247,0.04);
            --table-header-bg: rgba(168,85,247,0.05);
            --shadow: 0 4px 24px rgba(107,33,168,0.1);
          }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: system-ui, -apple-system, sans-serif; }
        `}</style>
      </head>
      <body>
        <ThemeProvider>
          <ThemedLayout>{children}</ThemedLayout>
        </ThemeProvider>
      </body>
    </html>
  );
}

function ThemedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg-main)" }}>
      <Sidebar />
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <header style={{
          background: "var(--bg-header)", padding: "14px 28px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          borderBottom: "1px solid var(--border-header)",
          backdropFilter: "blur(10px)", position: "sticky", top: 0, zIndex: 10,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "3px", height: "18px", borderRadius: "2px", background: "linear-gradient(180deg, #ec4899, #a855f7)", boxShadow: "0 0 8px #a855f7" }} />
            <h2 style={{ fontSize: "14px", fontWeight: 600, color: "var(--header-text)", letterSpacing: "0.03em" }}>
              Klinik Afina — Sistem Manajemen
            </h2>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <ThemeToggle />
cat > app/components/Sidebar.tsx << 'EOF'
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "./ThemeProvider";
import { LayoutDashboard, Users, ClipboardList, BarChart3, Settings } from "lucide-react";

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
        @keyframes spin-slow { from { transform: rotate(0deg); } to
cat > app/components/Sidebar.tsx << 'EOF'
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "./ThemeProvider";
import { LayoutDashboard, Users, ClipboardList, BarChart3, Settings } from "lucide-react";

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
        .nav-icon-active { animation: pulse-glow 2s ease-in-out infinite; }
        .nav-icon-settings { animation: spin-slow 6s linear infinite; }
        .nav-icon-default { animation: float 3s ease-in-out infinite; }
        .nav-link { border: 1px solid transparent; }
        .nav-link:hover {
          background: rgba(236,72,153,0.15) !important;
          border-color: rgba(236,72,153,0.25) !important;
        }
        .nav-link-active {
          background: linear-gradient(135deg, rgba(236,72,153,0.25), rgba(168,85,247,0.25)) !important;
          border-color: rgba(236,72,153,0.4) !important;
          box-shadow: 0 0 12px rgba(236,72,153,0.15) !important;
        }
      `}</style>
      <aside style={{
        width: "230px", minHeight: "100vh", position: "relative", overflow: "hidden",
        background: sidebarBg, display: "flex", flexDirection: "column",
        boxShadow: "4px 0 30px rgba(168,85,247,0.3), inset -1px 0 0 rgba(255,255,255,0.05)",
        flexShrink: 0,
      }}>
        {/* Grid bg */}
        <div style={{
          position: "absolute", inset: 0, opacity: 0.07, pointerEvents: "none",
          backgroundImage: "linear-gradient(rgba(168,85,247,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(168,85,247,0.5) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }} />

        {/* Logo */}
        <div style={{ padding: "24px 20px", borderBottom: "1px solid rgba(255,255,255,0.15)", position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{
              width: "40px", height: "40px", borderRadius: "12px",
              background: "linear-gradient(135deg, #ec4899, #a855f7)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 0 20px rgba(236,72,153,0.5)",
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
              </svg>
            </div>
            <div>
              <h1 style={{ color: "#fff", fontWeight: 800, fontSize: "15px", margin: 0, letterSpacing: "0.02em" }}>Klinik Afina</h1>
              <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "10px", margin: 0, letterSpacing: "0.08em", textTransform: "uppercase" }}>Sistem Manajemen</p>
            </div>
          </div>
          <div style={{ position: "absolute", bottom: 0, left: "20px", right: "20px", height: "1px", background: "linear-gradient(90deg, transparent, #a855f7, transparent)" }} />
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "16px 12px", display: "flex", flexDirection: "column", gap: "4px" }}>
          {navItems.map((item, i) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            const isSettings = item.href === "/pengaturan";
            return (
              <Link key={item.label} href={item.href}
                className={`nav-link ${isActive ? "nav-link-active" : ""}`}
                style={{
                  display: "flex", alignItems: "center", gap: "12px",
                  padding: "11px 14px", borderRadius: "12px", fontSize: "13px",
                  color: isActive ? "#f9a8d4" : "rgba(255,255,255,0.75)",
                  textDecoration: "none", transition: "all 0.2s",
                  fontWeight: isActive ? 600 : 400,
                }}>
                <span
                  className={isActive ? "nav-icon-active" : isSettings ? "nav-icon-settings" : "nav-icon-default"}
                  style={{ display: "flex", animationDelay: `${i * 0.3}s` }}>
                  <Icon size={17} color={isActive ? "#ec4899" : "#c084fc"} strokeWidth={isActive ? 2.5 : 1.8} />
                </span>
                <span>{item.label}</span>
                {isActive && <div style={{ marginLeft: "auto", width: "6px", height: "6px", borderRadius: "50%", background: "#ec4899", boxShadow: "0 0 8px #ec4899" }} />}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div style={{ padding: "16px 20px", borderTop: "1px solid rgba(168,85,247,0.2)", position: "relative" }}>
          <div style={{ position: "absolute", top: 0, left: "20px", right: "20px", height: "1px", background: "linear-gradient(90deg, transparent, #a855f7, transparent)" }} />
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{
              width: "32px", height: "32px", borderRadius: "50%",
              background: "linear-gradient(135deg, #ec4899, #a855f7)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 0 12px rgba(168,85,247,0.4)",
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <div>
              <p style={{ color: "#fff", fontSize: "12px", fontWeight: 600, margin: 0 }}>Admin</p>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "10px", margin: 0 }}>Administrator</p>
            </div>
            <div style={{ marginLeft: "auto", width: "8px", height: "8px", borderRadius: "50%", background: "#4ade80", boxShadow: "0 0 8px #4ade80" }} />
          </div>
        </div>
cat > app/components/Sidebar.tsx << 'EOF'
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "./ThemeProvider";
import { LayoutDashboard, Users, ClipboardList, BarChart3, Settings } from "lucide-react";

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
        .nav-icon-active { animation: pulse-glow 2s ease-in-out infinite; }
        .nav-icon-settings { animation: spin-slow 6s linear infinite; }
        .nav-icon-default { animation: float 3s ease-in-out infinite; }
        .nav-link { border: 1px solid transparent; }
        .nav-link:hover {
          background: rgba(236,72,153,0.15) !important;
          border-color: rgba(236,72,153,0.25) !important;
        }
        .nav-link-active {
          background: linear-gradient(135deg, rgba(236,72,153,0.25), rgba(168,85,247,0.25)) !important;
          border-color: rgba(236,72,153,0.4) !important;
          box-shadow: 0 0 12px rgba(236,72,153,0.15) !important;
        }
      `}</style>
      <aside style={{
        width: "230px", minHeight: "100vh", position: "relative", overflow: "hidden",
        background: sidebarBg, display: "flex", flexDirection: "column",
        boxShadow: "4px 0 30px rgba(168,85,247,0.3), inset -1px 0 0 rgba(255,255,255,0.05)",
        flexShrink: 0,
      }}>
        {/* Grid bg */}
        <div style={{
          position: "absolute", inset: 0, opacity: 0.07, pointerEvents: "none",
          backgroundImage: "linear-gradient(rgba(168,85,247,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(168,85,247,0.5) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }} />

        {/* Logo */}
        <div style={{ padding: "24px 20px", borderBottom: "1px solid rgba(255,255,255,0.15)", position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{
              width: "40px", height: "40px", borderRadius: "12px",
              background: "linear-gradient(135deg, #ec4899, #a855f7)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 0 20px rgba(236,72,153,0.5)",
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
              </svg>
            </div>
            <div>
              <h1 style={{ color: "#fff", fontWeight: 800, fontSize: "15px", margin: 0, letterSpacing: "0.02em" }}>Klinik Afina</h1>
              <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "10px", margin: 0, letterSpacing: "0.08em", textTransform: "uppercase" }}>Sistem Manajemen</p>
            </div>
          </div>
          <div style={{ position: "absolute", bottom: 0, left: "20px", right: "20px", height: "1px", background: "linear-gradient(90deg, transparent, #a855f7, transparent)" }} />
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "16px 12px", display: "flex", flexDirection: "column", gap: "4px" }}>
          {navItems.map((item, i) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            const isSettings = item.href === "/pengaturan";
            return (
              <Link key={item.label} href={item.href}
                className={`nav-link ${isActive ? "nav-link-active" : ""}`}
                style={{
                  display: "flex", alignItems: "center", gap: "12px",
                  padding: "11px 14px", borderRadius: "12px", fontSize: "13px",
                  color: isActive ? "#f9a8d4" : "rgba(255,255,255,0.75)",
                  textDecoration: "none", transition: "all 0.2s",
                  fontWeight: isActive ? 600 : 400,
                }}>
                <span
                  className={isActive ? "nav-icon-active" : isSettings ? "nav-icon-settings" : "nav-icon-default"}
                  style={{ display: "flex", animationDelay: `${i * 0.3}s` }}>
                  <Icon size={17} color={isActive ? "#ec4899" : "#c084fc"} strokeWidth={isActive ? 2.5 : 1.8} />
                </span>
                <span>{item.label}</span>
                {isActive && <div style={{ marginLeft: "auto", width: "6px", height: "6px", borderRadius: "50%", background: "#ec4899", boxShadow: "0 0 8px #ec4899" }} />}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div style={{ padding: "16px 20px", borderTop: "1px solid rgba(168,85,247,0.2)", position: "relative" }}>
          <div style={{ position: "absolute", top: 0, left: "20px", right: "20px", height: "1px", background: "linear-gradient(90deg, transparent, #a855f7, transparent)" }} />
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{
              width: "32px", height: "32px", borderRadius: "50%",
              background: "linear-gradient(135deg, #ec4899, #a855f7)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 0 12px rgba(168,85,247,0.4)",
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <div>
              <p style={{ color: "#fff", fontSize: "12px", fontWeight: 600, margin: 0 }}>Admin</p>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "10px", margin: 0 }}>Administrator</p>
            </div>
            <div style={{ marginLeft: "auto", width: "8px", height: "8px", borderRadius: "50%", background: "#4ade80", boxShadow: "0 0 8px #4ade80" }} />
          </div>
        </div>
      </aside>
    </>
  );
}
