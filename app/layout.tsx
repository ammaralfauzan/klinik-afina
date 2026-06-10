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
      <body style={{ display: "flex", minHeight: "100vh", background: "#f8f4f9", fontFamily: "system-ui, sans-serif", margin: 0 }}>
        <Sidebar />
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <header style={{
            background: "#fff", padding: "16px 28px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            boxShadow: "0 1px 8px rgba(107,33,168,0.08)", borderBottom: "1px solid #f0e6f6"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ width: "4px", height: "20px", borderRadius: "2px", background: "linear-gradient(180deg, #9d174d, #6b21a8)" }}></div>
              <h2 style={{ fontSize: "15px", fontWeight: 600, color: "#4a1272", margin: 0 }}>Klinik Afina</h2>
            </div>
            <div style={{
              background: "linear-gradient(135deg, #fdf2f8, #f5f0ff)",
              border: "1px solid #e9d5ff", borderRadius: "20px",
              padding: "6px 14px", fontSize: "12px", color: "#6b21a8", fontWeight: 500
            }}>
              👋 Selamat datang, Admin
            </div>
          </header>
          <main style={{ flex: 1, padding: "28px" }}>{children}</main>
        </div>
      </body>
    </html>
  );
}
