import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import ThemeProvider from "./components/ThemeProvider";
import ThemedLayout from "./components/ThemedLayout";
import ErrorBoundary from "./components/ErrorBoundary";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  icons: { icon: "/logo-afina.png" },
  title: "Klinik Afina",
  description: "Sistem Manajemen Klinik",
  manifest: "/manifest.json",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${inter.variable} ${jakarta.variable}`}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>{`
          [data-theme="dark"] {
            --bg-main: #0f0e1a;
            --bg-header: #16152a;
            --bg-card: #1e1d35;
            --border-color: rgba(255,255,255,0.07);
            --border-header: rgba(255,255,255,0.07);
            --text-primary: #f0eeff;
            --text-secondary: #8b8fa8;
            --text-accent: #c4b5fd;
            --accent: #7B61FF;
            --accent2: #F5A623;
            --header-text: #f0eeff;
            --input-bg: rgba(255,255,255,0.06);
            --table-hover: rgba(255,255,255,0.04);
            --table-header-bg: rgba(255,255,255,0.03);
            --shadow: 0 2px 16px rgba(0,0,0,0.35);
          }
          [data-theme="light"] {
            --bg-main: #F5F4FF;
            --bg-header: #FFFFFF;
            --bg-card: #FFFFFF;
            --border-color: rgba(0,0,0,0.06);
            --border-header: rgba(0,0,0,0.06);
            --text-primary: #1A1A2E;
            --text-secondary: #8B8FA8;
            --text-accent: #3D3178;
            --accent: #6C5CE7;
            --accent2: #F5A623;
            --header-text: #1A1A2E;
            --input-bg: #F0EFFF;
            --table-hover: rgba(108,92,231,0.04);
            --table-header-bg: rgba(108,92,231,0.03);
            --shadow: 0 2px 12px rgba(0,0,0,0.08);
          }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: var(--font-inter), system-ui, -apple-system, sans-serif; }
          h1, h2, h3 { font-family: var(--font-jakarta), system-ui, sans-serif; }
          @media (display-mode: standalone) { body { padding-top: env(safe-area-inset-top); } }
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
          <ErrorBoundary>
            <ThemedLayout>{children}</ThemedLayout>
          </ErrorBoundary>
        </ThemeProvider>
      </body>
    </html>
  );
}

