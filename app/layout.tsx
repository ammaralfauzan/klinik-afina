import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Klinik Afina",
  description: "Sistem Manajemen Klinik",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className="flex min-h-screen" style={{ background: "#f8f4f9", fontFamily: "system-ui, sans-serif" }}>
        {/* Sidebar */}
        <aside style={{
          width: "220px", minHeight: "100vh", background: "linear-gradient(180deg, #6b21a8 0%, #9d174d 100%)",
          display: "flex", flexDirection: "column", boxShadow: "4px 0 20px rgba(107,33,168,0.15)"
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
            {[
              { label: "Dashboard", icon: "📊", href: "/" },
              { label: "Antrian", icon: "🔢", href: "/antrian" },
              { label: "Pasien", icon: "👤", href: "/pasien" },
              { label: "Laporan", icon: "📈", href: "/laporan" },
              { label: "Pengaturan", icon: "⚙️", href: "/pengaturan" },
            ].map((item) => (
              <Link key={item.label} href={item.href} style={{
                display: "flex", alignItems: "center", gap: "10px",
                padding: "10px 12px", borderRadius: "10px", fontSize: "13px",
                color: "rgba(255,255,255,0.85)", textDecoration: "none",
                transition: "background 0.2s",
              }}
              onMouseOver={e => (e.currentTarget.style.background = "rgba(255,255,255,0.15)")}
              onMouseOut={e => (e.currentTarget.style.background = "transparent")}
              >
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

        {/* Main Content */}
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
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{
                background: "linear-gradient(135deg, #fdf2f8, #f5f0ff)",
                border: "1px solid #e9d5ff", borderRadius: "20px",
                padding: "6px 14px", fontSize: "12px", color: "#6b21a8", fontWeight: 500
              }}>
                👋 Selamat datang, Admin
              </div>
            </div>
          </header>
          <main style={{ flex: 1, padding: "28px" }}>
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
