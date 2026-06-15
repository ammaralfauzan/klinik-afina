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

  const sidebarBg = dark ? "#1a1830" : "#3D3478";

  return (
    <>
      <style>{`
        @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .nav-icon-settings { animation: spin-slow 10s linear infinite; }
        .nav-link {
          display: flex; align-items: center; gap: 12px;
          padding: 10px 14px; border-radius: 10px; font-size: 13px;
          text-decoration: none; transition: background 0.18s, color 0.18s;
          position: relative; border: none;
        }
        .nav-link:hover { background: rgba(255,255,255,0.08); }
        .nav-link-active { background: rgba(255,255,255,0.14); }
        .nav-link-active::before {
          content: ''; position: absolute; left: 0; top: 50%;
          transform: translateY(-50%); width: 3px; height: 20px;
          background: #F5A623; border-radius: 0 3px 3px 0;
        }
        .desktop-sidebar { display: flex; width: 230px; min-height: 100vh; flex-shrink: 0; }
        .mobile-bottomnav { display: none; }
        @media (max-width: 768px) {
          .desktop-sidebar { display: none !important; }
          .mobile-bottomnav {
            display: flex; position: fixed; bottom: 0; left: 0; right: 0; z-index: 100;
            background: #3D3478;
            border-top: 1px solid rgba(255,255,255,0.08);
            padding: 8px 0 20px; justify-content: space-around;
          }
          .mobile-nav-item {
            display: flex; flex-direction: column; align-items: center;
            gap: 4px; padding: 6px 12px; border-radius: 12px;
            text-decoration: none; transition: background 0.18s; min-width: 56px;
          }
          .mobile-nav-item span { font-size: 10px; font-weight: 600; }
          .mobile-nav-active { background: rgba(255,255,255,0.12); }
        }
      `}</style>

      <aside className="desktop-sidebar" style={{
        background: sidebarBg, flexDirection: "column",
        boxShadow: "2px 0 8px rgba(0,0,0,0.15)",
      }}>
        {/* Logo */}
        <div style={{ padding: "22px 20px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: "40px", height: "40px", borderRadius: "10px", flexShrink: 0, background: "rgba(255,255,255,0.12)", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Image src="/logo-afina.png" alt="Klinik Afina" width={40} height={40} style={{ width: "84%", height: "84%", objectFit: "contain" }} />
            </div>
            <div>
              <h1 style={{ color: "#fff", fontWeight: 700, fontSize: "13px", margin: 0, letterSpacing: "-0.01em" }}>Klinik & RB Afina</h1>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "10px", margin: 0, textTransform: "uppercase", letterSpacing: "0.08em" }}>Sistem Manajemen</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "14px 10px", display: "flex", flexDirection: "column", gap: "2px" }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
            const isSettings = item.href === "/pengaturan";
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`nav-link ${isActive ? "nav-link-active" : ""}`}
                style={{ color: isActive ? "#fff" : "rgba(255,255,255,0.55)", fontWeight: isActive ? 600 : 400 }}
              >
                <span className={isSettings ? "nav-icon-settings" : ""} style={{ display: "flex", flexShrink: 0 }}>
                  <Icon size={16} color={isActive ? "#fff" : "rgba(255,255,255,0.45)"} strokeWidth={isActive ? 2 : 1.5} />
                </span>
                <span>{item.label}</span>
                {isActive && (
                  <div style={{ marginLeft: "auto", width: "6px", height: "6px", borderRadius: "50%", background: "#F5A623" }} />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div style={{ padding: "14px 14px 18px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
            <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "rgba(255,255,255,0.14)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ color: "#fff", fontSize: "12px", fontWeight: 600, margin: 0 }}>Admin</p>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "10px", margin: 0 }}>admin@klinik-afina.com</p>
            </div>
            <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#4ade80", flexShrink: 0 }} />
          </div>
          <button
            onClick={handleLogout}
            style={{
              width: "100%", background: "rgba(255,255,255,0.07)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "rgba(255,255,255,0.6)", borderRadius: "8px", padding: "8px 12px",
              fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center",
              justifyContent: "center", gap: "6px", fontFamily: "inherit", transition: "all 0.18s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.13)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.07)")}
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
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
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
