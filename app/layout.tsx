import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "./components/Sidebar";
import ThemeProvider from "./components/ThemeProvider";
import ThemeToggle from "./components/ThemeToggle";
import Image from "next/image";

export const metadata: Metadata = {
  icons: { icon: "/logo-afina.png" },
  title: "Klinik Afina",
  description: "Sistem Manajemen Klinik",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@600;700;800&display=swap" rel="stylesheet" />
        <style>{`
          [data-theme="dark"] {
            --bg-main: linear-gradient(135deg, #0d0d1a 0%, #130825 100%);
            --bg-header: rgba(15,5,32,0.95);
            --bg-card: rgba(255,255,255,0.04);
            --border-color: rgba(123,97,255,0.15);
            --border-header: rgba(123,97,255,0.2);
            --text-primary: #f1e6ff;
            --text-secondary: #9ca3af;
            --text-accent: #e9d5ff;
            --accent: #7B61FF;
            --accent2: #F5A623;
            --header-text: #e2d4f0;
            --table-hover: rgba(123,97,255,0.05);
            --table-header-bg: rgba(123,97,255,0.06);
            --shadow: 0 2px 12px rgba(0,0,0,0.3);
          }
          [data-theme="light"] {
            --bg-main: #F0EEFF;
            --bg-header: #FFFFFF;
            --bg-card: #FFFFFF;
            --border-color: rgba(0,0,0,0.06);
            --border-header: rgba(0,0,0,0.07);
            --text-primary: #1A1A2E;
            --text-secondary: #8B8FA8;
            --text-accent: #3D3178;
            --accent: #7B61FF;
            --accent2: #F5A623;
            --header-text: #1A1A2E;
            --table-hover: rgba(123,97,255,0.04);
            --table-header-bg: rgba(123,97,255,0.03);
            --shadow: 0 2px 12px rgba(0,0,0,0.07);
          }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Inter', system-ui, -apple-system, sans-serif; }
          h1, h2, h3 { font-family: 'Plus Jakarta Sans', system-ui, sans-serif; }
          .mobile-header { display: none; }
          @media (max-width: 768px) {
            .stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
            .laporan-stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
            .laporan-grid { grid-template-columns: 1fr !important; }
            .form-grid { grid-template-columns: 1fr !important; }
            .table-wrapper { overflow-x: auto; -webkit-overflow-scrolling: touch; }
            .table-wrapper table { min-width: 480px; }
            .main-content { padding-bottom: 90px !important; }
            .desktop-header { display: none !important; }
            .mobile-header {
              display: flex !important;
              align-items: center;
              justify-content: space-between;
              padding: 12px 16px;
              background: var(--bg-header);
              border-bottom: 1px solid var(--border-header);
              position: sticky; top: 0; z-index: 10;
            }
          }
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
