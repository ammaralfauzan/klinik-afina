import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "./components/Sidebar";

export const metadata: Metadata = {
  title: "Klinik Afina",
  description: "Sistem Manajemen Klinik",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body style={{ display: "flex", minHeight: "100vh", background: "#0d0d1a", fontFamily: "system-ui, sans-serif", margin: 0 }}>
        <Sidebar />
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <header style={{
            background: "rgba(15,5,32,0.95)", padding: "14px 28px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            borderBottom: "1px solid rgba(168,85,247,0.2)",
            backdropFilter: "blur(10px)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ width: "3px", height: "18px", borderRadius: "2px", background: "linear-gradient(180deg, #ec4899, #a855f7)", boxShadow: "0 0 8px #a855f7" }}></div>
              <h2 style={{ fontSize: "14px", fontWeight: 600, color: "#e2d4f0", margin: 0, letterSpacing: "0.03em" }}>Klinik Afina — Sistem Manajemen</h2>
            </div>
            <div style={{
              background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.3)",
              borderRadius: "20px", padding: "6px 16px", fontSize: "12px", color: "#c084fc", fontWeight: 500,
              boxShadow: "0 0 12px rgba(168,85,247,0.1)"
            }}>
              ✦ Selamat datang, Admin
            </div>
          </header>
          <main style={{ flex: 1, padding: "28px", background: "linear-gradient(135deg, #0d0d1a 0%, #130825 100%)" }}>
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
