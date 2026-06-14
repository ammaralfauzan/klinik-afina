import Link from "next/link";
import { packages } from "@/lib/data";
import PackageCard from "../components/PackageCard";

export const metadata = {
  title: "Paket & Harga — Fenoma Wedding Photography",
  description: "Pilih paket fotografi pernikahan Fenoma yang sesuai dengan kebutuhan dan impian hari spesial Anda.",
};

export default function PaketPage() {
  return (
    <>
      {/* Header */}
      <div style={{ padding: "120px 24px 60px", background: "#F5F0E8", textAlign: "center" }}>
        <p style={{ fontSize: "12px", letterSpacing: "0.3em", textTransform: "uppercase", color: "#C9A96E", marginBottom: "16px" }}>
          Paket & Harga
        </p>
        <h1
          style={{
            fontFamily: "var(--font-playfair, Georgia, serif)",
            fontSize: "clamp(32px, 5vw, 52px)",
            color: "#1C1C1C",
            fontWeight: 700,
            marginBottom: "16px",
          }}
        >
          Pilih Paket Terbaik Anda
        </h1>
        <p style={{ fontSize: "15px", color: "#8A8A8A", maxWidth: "480px", margin: "0 auto", lineHeight: 1.7 }}>
          Setiap paket dirancang untuk memberikan kenangan terbaik dari hari istimewa Anda.
        </p>
      </div>

      {/* Packages */}
      <section style={{ padding: "64px 24px 80px" }}>
        <div
          style={{
            maxWidth: "1100px",
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "32px",
            alignItems: "start",
          }}
        >
          {packages.map((pkg, i) => (
            <PackageCard key={pkg.id} pkg={pkg} index={i} />
          ))}
        </div>

        <p style={{ textAlign: "center", color: "#8A8A8A", fontSize: "13px", marginTop: "48px" }}>
          * Harga belum termasuk biaya transportasi. Hubungi kami untuk diskusi kebutuhan khusus Anda.
        </p>
      </section>

      {/* CTA */}
      <section style={{ padding: "60px 24px 80px", background: "#F5F0E8", textAlign: "center" }}>
        <div style={{ maxWidth: "560px", margin: "0 auto" }}>
          <h2
            style={{
              fontFamily: "var(--font-playfair, Georgia, serif)",
              fontSize: "clamp(24px, 3vw, 36px)",
              color: "#1C1C1C",
              fontWeight: 700,
              marginBottom: "16px",
            }}
          >
            Butuh Paket Khusus?
          </h2>
          <p style={{ fontSize: "15px", color: "#8A8A8A", lineHeight: 1.7, marginBottom: "32px" }}>
            Kami terbuka untuk mendiskusikan kebutuhan spesifik Anda. Hubungi kami dan kita rancang paket yang sempurna.
          </p>
          <Link
            href="/kontak"
            style={{
              display: "inline-block",
              padding: "14px 40px",
              background: "#C9A96E",
              color: "#fff",
              textDecoration: "none",
              fontSize: "14px",
              fontWeight: 500,
              letterSpacing: "0.08em",
            }}
          >
            Konsultasi Gratis
          </Link>
        </div>
      </section>
    </>
  );
}
