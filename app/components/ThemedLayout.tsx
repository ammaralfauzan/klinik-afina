"use client";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import Sidebar from "./Sidebar";
import ThemeToggle from "./ThemeToggle";
import Image from "next/image";
import { AudioProvider, MuteButton } from "./AudioNotif";
import { TourProvider } from "./AppTour";
import { supabase } from "../../lib/supabase";
import { RoleProvider, useRole } from "./RoleProvider";
import { canAccess, firstAllowed, ROLE_LABEL } from "../../lib/roles";

const BYPASS_ROUTES = ["/login", "/display", "/daftar-online"];

export default function ThemedLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  // Register service worker
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  // Session guard — verifikasi sesi Supabase yang sebenarnya, bukan sekadar
  // cookie isLoggedIn (yang mudah dipalsukan). Tanpa sesi valid → ke /login.
  useEffect(() => {
    if (BYPASS_ROUTES.some(r => pathname === r || pathname.startsWith(r + "/"))) return;

    function clearAndRedirect() {
      document.cookie = "isLoggedIn=; path=/; max-age=0";
      localStorage.removeItem("isLoggedIn");
      router.replace("/login");
    }

    // Cek saat halaman dibuka — cookie palsu tanpa sesi JWT ditolak.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) clearAndRedirect();
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || !session) clearAndRedirect();
    });
    return () => subscription.unsubscribe();
  }, [pathname, router]);

  if (BYPASS_ROUTES.some(r => pathname === r || pathname.startsWith(r + "/"))) {
    return <>{children}</>;
  }

  return (
    <RoleProvider>
      <TourProvider>
        <AudioProvider>
          <Shell>{children}</Shell>
        </AudioProvider>
      </TourProvider>
    </RoleProvider>
  );
}

// Penjaga akses berbasis peran — blokir & alihkan jika peran tak berwenang.
function RoleGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { role, ready } = useRole();
  const allowed = canAccess(role, pathname);
  useEffect(() => {
    if (ready && !allowed) router.replace(firstAllowed(role));
  }, [ready, allowed, role, router]);
  if (ready && !allowed) {
    return (
      <div style={{ padding: "60px 20px", textAlign: "center", color: "var(--text-secondary)" }}>
        <p style={{ fontWeight: 700, color: "var(--text-primary)", margin: "0 0 4px" }}>Akses ditolak</p>
        <p style={{ fontSize: "13px", margin: 0 }}>Peran Anda tidak memiliki akses ke halaman ini. Mengalihkan…</p>
      </div>
    );
  }
  return <>{children}</>;
}

function Shell({ children }: { children: React.ReactNode }) {
  const { role } = useRole();
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg-main)", overflowX: "hidden", maxWidth: "100vw" }}>
      <Sidebar />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>

        {/* DESKTOP HEADER */}
        <header className="desktop-header" style={{
          background: "var(--bg-header)", padding: "12px 24px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          borderBottom: "1px solid var(--border-header)",
          position: "sticky", top: 0, zIndex: 10,
        }}>
          {/* Welcome pill — left side */}
          <div style={{
            display: "flex", alignItems: "center", gap: "10px",
            background: "var(--input-bg)", border: "1px solid var(--border-color)",
            borderRadius: "24px", padding: "8px 18px",
          }}>
            <span style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1 }}>👋</span>
            <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-primary)" }}>Selamat datang!</span>
          </div>

          {/* Right side */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <MuteButton />
            <ThemeToggle />
            <div style={{ width: "1px", height: "24px", background: "var(--border-color)" }} />
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{
                width: "34px", height: "34px", borderRadius: "50%",
                background: "linear-gradient(135deg, #6C5CE7, #a78bfa)",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                </svg>
              </div>
              <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>{ROLE_LABEL[role] || "Staf"}</span>
            </div>
          </div>
        </header>

        {/* MOBILE HEADER */}
        <header className="mobile-header">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "34px", height: "34px", borderRadius: "9px", background: "var(--input-bg)", border: "1px solid var(--border-color)", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Image src="/logo-afina.png" alt="Logo" width={34} height={34} style={{ width: "80%", height: "80%", objectFit: "contain" }} />
            </div>
            <div>
              <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--header-text)", margin: 0 }}>Klinik & RB Afina</p>
              <p style={{ fontSize: "10px", color: "var(--text-secondary)", margin: 0 }}>{ROLE_LABEL[role] || "Sistem Manajemen"}</p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <MuteButton />
            <ThemeToggle />
          </div>
        </header>

        <main className="main-content" style={{ flex: 1, padding: "28px" }}>
          <RoleGuard>{children}</RoleGuard>
        </main>
      </div>
    </div>
  );
}
