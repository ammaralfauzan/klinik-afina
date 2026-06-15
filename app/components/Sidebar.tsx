"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "./ThemeProvider";
import { LayoutDashboard, Users, ClipboardList, BarChart3, Settings, LogOut } from "lucide-react";
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
  const router = useRouter();

  function handleLogout() {
    document.cookie = "isLoggedIn=; path=/; max-age=0";
    localStorage.removeItem("isLoggedIn");
    router.push("/login");
  }

  const sidebarBg = dark
    ? "linear-gradient(180deg, #0f0520 0%, #1a0533 50%, #0f0a1e 100%)"
    : "linear-gradient(180deg, #2E2466 0%, #3D3178 100%)";

  return (
    <>
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-2px); }
        }
        @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .nav-icon-default { animation: float 3s ease-in-out infinite; }
        .nav-icon-settings { animation: spin-slow 8s linear infinite; }
        .nav-link { border: 1px solid transparent; transition: all 0.2s; }
        .nav-link:hover { background: rgba(255,255,255,0.08) !important; }
        .nav-link-active { background: rgba(255,255,255,0.12) !important; border-color: rgba(255,255,255,0.15) !important; }
        .desktop-sidebar { display: flex; width: 230px; min-height: 100vh; flex-shrink: 0; }
        .mobile-bottomnav { display: none; }
        @media (max-width: 768px) {
          .desktop-sidebar { display: none !important; }
          .mobile-bottomnav {
            display: flex; position: fixed; bottom: 0; left: 0; right: 0; z-index: 100;
            background: #2E2466;
            border-top: 1px solid rgba(255,255,255,0.1);
            padding: 8px 0 20px; justify-content: space-around;
          }
          .mobile-nav-item { display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 6px 12px; border-radius: 12px; text-decoration: none; transition: all 0.2s; min-width: 56px; }
          .mobile-nav-item span { font-size: 10px; font-weight: 600; }
          .mobile-nav-active { background: rgba(255,255,255,0.1) !important; }
        }
      `}</style>

      <aside className="desktop-sidebar" style={{
        position: "relative", overflow: "hidden",
        background: sidebarBg, flexDirection: "column",
        boxShadow: "2px 0 12px rgba(0,0,0,0.3)",
      }}>
        {/* Grid bg subtle */}
        <div style={{ position: "absolute", inset: 0, opacity: 0.04, pointerEvents: "none", backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)", backgroundSize: "24px 24px" }} />

        {/* Logo */}
        <div style={{ padding: "20px", borderBottom: "1px solid rgba(255,255,255,0.1)", position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "50%", flexShrink: 0, border: "1px solid rgba(255,255,255,0.2)", background: "#fff", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Image src="/logo-afina.png" alt="Klinik Afina" width={48} height={48} style={{ width: "88%", height: "88%", objectFit: "contain" }} />
            </div>
            <div>
              <h1 style={{ color: "#fff", fontWeight: 700, fontSize: "13px", margin: 0 }}>Klinik & RB Afina</h1>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "10px", margin: 0, textTransform: "uppercase", letterSpacing: "0.06em" }}>Sistem Manajemen</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "16px 12px", display: "flex", flexDirection: "column", gap: "2px" }}>
          {navItems.map((item, i) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            const isSettings = item.href === "/pengaturan";
            return (
              <Link key={item.label} href={item.href}
                className={`nav-link ${isActive ? "nav-link-active" : ""}`}
                style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 14px", borderRadius: "10px", fontSize: "13px", color: isActive ? "#fff" : "rgba(255,255,255,0.6)", textDecoration: "none", fontWeight: isActive ? 600 : 400 }}>
                <span className={isSettings ? "nav-icon-settings" : "nav-icon-default"} style={{ display: "flex", animationDelay: `${i * 0.3}s` }}>
                  <Icon size={16} color={isActive ? "#fff" : "rgba(255,255,255,0.5)"} strokeWidth={isActive ? 2 : 1.5} />
                </span>
                <span>{item.label}</span>
                {isActive && <div style={{ marginLeft: "auto", width: "5px", height: "5px", borderRadius: "50%", background: "#fff", opacity: 0.8 }} />}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div style={{ padding: "16px 20px", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "30px", height: "30px", borderRadius: "50%", background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </div>
            <div>
              <p style={{ color: "#fff", fontSize: "12px", fontWeight: 600, margin: 0 }}>Admin</p>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "10px", margin: 0 }}>Administrator</p>
            </div>
            <div style={{ marginLeft: "auto", width: "7px", height: "7px", borderRadius: "50%", background: "#4ade80" }} />
          </div>
          <button
            onClick={handleLogout}
            style={{
              width: "100%", marginTop: "10px",
              background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)",
              color: "rgba(255,255,255,0.7)", borderRadius: "8px", padding: "8px 12px",
              fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center",
              justifyContent: "center", gap: "6px", fontFamily: "inherit", transition: "all 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.14)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.08)")}
          >
            <LogOut size={13} />
            Keluar
          </button>
        </div>
      </aside>

      {/* MOBILE BOTTOM NAV */}
      <nav className="mobile-bottomnav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link key={item.label} href={item.href} className={`mobile-nav-item ${isActive ? "mobile-nav-active" : ""}`}>
              <Icon size={22} color={isActive ? "#fff" : "rgba(255,255,255,0.4)"} strokeWidth={isActive ? 2 : 1.5} />
              <span style={{ color: isActive ? "#fff" : "rgba(255,255,255,0.4)" }}>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
