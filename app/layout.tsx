import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Klinik Afina",
  description: "Sistem Manajemen Klinik",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="flex min-h-screen bg-gray-50">
        {/* Sidebar */}
        <aside className="w-56 bg-white shadow-md flex flex-col">
          <div className="px-6 py-5 border-b">
            <h1 className="text-lg font-bold text-blue-600">Klinik Afina</h1>
            <p className="text-xs text-gray-400">Sistem Manajemen</p>
          </div>
          <nav className="flex flex-col gap-1 p-4 flex-1">
            {[
              { label: "Dashboard", icon: "🏠", href: "/" },
              { label: "Antrian", icon: "🔢", href: "/antrian" },
              { label: "Pasien", icon: "👤", href: "/pasien" },
              { label: "Laporan", icon: "📊", href: "/laporan" },
              { label: "Pengaturan", icon: "⚙️", href: "/pengaturan" },
            ].map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition-colors"
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
          <div className="px-4 py-4 border-t">
            <p className="text-xs text-gray-400">Admin</p>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          <header className="bg-white shadow-sm px-6 py-4 flex items-center justify-between">
            <h2 className="text-sm font-medium text-gray-600">Dashboard</h2>
            <span className="text-sm text-gray-500">Selamat datang, Admin 👋</span>
          </header>
          <main className="flex-1 p-6">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}