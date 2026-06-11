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
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>{`
          [data-theme="dark"] {
            --bg-main: linear-gradient(135deg, #0d0d1a 0%, #130825 100%);
            --bg-header: rgba(15,5,32,0.95);
            --bg-card: rgba(255,255,255,0.03);
            --border-color: rgba(168,85,247,0.15);
            --border-header: rgba(168,85,247,0.2);
            --text-primary: #f1e6ff;
            --text-secondary: #9ca3af;
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
          @media (max-width: 768px) {
            .main-content { padding-bottom: 90px !important; }
            .main-padding { padding: 16px !important; }
            .hide-mobile { display: none !important; }
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
        <header style={{
          background: "var(--bg-header)", padding: "14px 20px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          borderBottom: "1px solid var(--border-header)",
          backdropFilter: "blur(10px)", position: "sticky", top: 0, zIndex: 10,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "3px", height: "18px", borderRadius: "2px", background: "linear-gradient(180deg, #ec4899, #a855f7)", boxShadow: "0 0 8px #a855f7" }} />
            <h2 className="hide-mobile" style={{ fontSize: "14px", fontWeight: 600, color: "var(--header-text)", letterSpacing: "0.03em" }}>
              Klinik Afina — Sistem Manajemen
            </h2>
            <h2 style={{ fontSize: "14px", fontWeight: 600, color: "var(--header-text)", display: "none" }} className="show-mobile">
              Klinik Afina
            </h2>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <ThemeToggle />
            <div className="hide-mobile" style={{ background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.3)", borderRadius: "20px", padding: "6px 16px", fontSize: "12px", color: "var(--accent)", fontWeight: 500 }}>
              ✦ Selamat datang, Admin
            </div>
          </div>
        </header>
        <main className="main-content main-padding" style={{ flex: 1, padding: "28px" }}>{children}</main>
      </div>
    </div>
  );
}
