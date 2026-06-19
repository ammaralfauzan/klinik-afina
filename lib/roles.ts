// Konfigurasi peran & akses halaman (multi-user).
// Mudah diubah: cukup sunting ACCESS di bawah.

export type Role = "admin" | "loket" | "dokter" | "kasir" | "apoteker";

export const ROLE_LABEL: Record<string, string> = {
  admin: "Admin / Owner",
  loket: "Loket / Pendaftaran",
  dokter: "Dokter / Bidan",
  kasir: "Kasir",
  apoteker: "Apoteker",
};

export const ALL_ROLES: Role[] = ["admin", "loket", "dokter", "kasir", "apoteker"];

// Peta akses: route -> daftar peran yang boleh. Cocokkan prefix terpanjang.
// (admin selalu boleh — lihat canAccess)
const ACCESS: Record<string, Role[]> = {
  "/":              ["admin", "loket", "dokter", "kasir", "apoteker"],
  "/antrian":       ["admin", "loket", "dokter", "kasir", "apoteker"],
  "/pasien/daftar": ["admin", "loket", "dokter", "kasir", "apoteker"],
  "/pasien":        ["admin", "loket"],          // registrasi pasien baru
  "/rekam-medis":   ["admin", "dokter", "apoteker"],
  "/kasir":         ["admin", "kasir"],
  "/laporan":       ["admin", "kasir"],
  "/pengaturan":    ["admin"],
};

// Normalisasi role tak dikenal/kosong -> 'admin' (kompatibel mundur: sebelum
// peran di-set, pengguna existing tetap akses penuh).
export function normRole(r?: string | null): Role {
  const v = (r || "").toLowerCase().trim();
  return (ALL_ROLES as string[]).includes(v) ? (v as Role) : "admin";
}

export function canAccess(role: Role, pathname: string): boolean {
  if (role === "admin") return true;
  // Cari kunci ACCESS dengan prefix terpanjang yang cocok.
  let best = "";
  for (const key of Object.keys(ACCESS)) {
    if ((pathname === key || pathname.startsWith(key + "/") || (key === "/" && pathname === "/")) && key.length > best.length) {
      best = key;
    }
  }
  if (!best) return true; // route tak terdaftar -> izinkan (mis. halaman publik)
  return ACCESS[best].includes(role);
}

// Halaman pertama yang boleh diakses peran (untuk redirect).
export function firstAllowed(role: Role): string {
  const order = ["/", "/antrian", "/pasien/daftar", "/rekam-medis", "/kasir", "/laporan", "/pasien", "/pengaturan"];
  return order.find(p => canAccess(role, p)) || "/";
}
