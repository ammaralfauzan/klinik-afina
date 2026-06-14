import Link from "next/link";
import { packages } from "@/lib/data";

export const metadata = {
  title: "Paket & Harga — Fenoma Wedding Photography",
  description: "Pilih paket fotografi pernikahan Fenoma yang sesuai dengan kebutuhan dan impian hari spesial Anda.",
};

export default function PaketPage() {
  return (
    <>
      {/* Header */}
      <div style={{ padding: "120px 24px 60px", background: "#F5F0E8", textAlign: "center" }}>
        <p style={{ fontSize: "12px", letterSpacing: "0.3em", textTransform: "uppercase", color: "#C9A96E", marginBottom: "16px" }}>Paket & Harga</p>
        <h1 style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: "clamp(32px, 5vw, 52px)", color: "#1C1C1C", fontWeight: 700, marginBottom: "16px" }}>
          Pilih Paket Terbaik Anda
        </h1>
        <p style={{ fontSize: "15px", color: "#8A8A8A", maxWidth: "480px", margin: "0 auto", lineHeight: 1.7 }}>
          Setiap paket dirancang untuk memberikan kenangan terbaik dari hari istimewa Anda.
        </p>
      </div>

      {/* Packages */}
      <section style={{ padding: "60px 24px 80px" }}>
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
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              style={{
                background: pkg.highlight ? "#1C1C1C" : "#FDFCF8",
                border: pkg.highlight ? "none" : "1px solid rgba(201,169,110,0.2)",
                padding: "48px 36px",
                position: "relative",
              }}
            >
              {pkg.highlight && (
                <span
                  style={{
                    position: "absolute",
                    top: "-1px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    background: "#C9A96E",
                    color: "#fff",
                    fontSize: "11px",
                    padding: "6px 20px",
                    fontWeight: 600,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    whiteSpace: "nowrap",
                  }}
                >
                  Paling Populer
                </span>
              )}
              <p
                style={{
                  fontSize: "12px",
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  color: "#C9A96E",
                  marginBottom: "12px",
                  fontWeight: 600,
                }}
              >
                Photography
              </p>
              <h2
                style={{
                  fontFamily: "var(--font-playfair, Georgia, serif)",
                  fontSize: "32px",
                  color: pkg.highlight ? "#FDFCF8" : "#1C1C1C",
                  fontWeight: 700,
                  marginBottom: "8px",
                }}
              >
                {pkg.name}
              </h2>
              <p
                style={{
                  fontSize: "22px",
                  fontWeight: 700,
                  color: "#C9A96E",
                  marginBottom: "32px",
                }}
              >
                {pkg.price}
              </p>

              <ul style={{ listStyle: "none", padding: 0, margin: "0 0 40px", display: "flex", flexDirection: "column", gap: "14px" }}>
                {pkg.features.map((feature, idx) => (
                  <li key={idx} style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                    <span style={{ color: "#C9A96E", fontSize: "14px", flexShrink: 0, marginTop: "1px" }}>✓</span>
                    <span style={{ fontSize: "14px", color: pkg.highlight ? "#D4C9BC" : "#4A4A4A", lineHeight: 1.5 }}>{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={`/kontak?paket=${pkg.name.toLowerCase()}`}
                style={{
                  display: "block",
                  textAlign: "center",
                  padding: "14px 24px",
                  background: pkg.highlight ? "#C9A96E" : "transparent",
                  border: pkg.highlight ? "none" : "1px solid #C9A96E",
                  color: pkg.highlight ? "#fff" : "#C9A96E",
                  textDecoration: "none",
                  fontSize: "14px",
                  fontWeight: 500,
                  letterSpacing: "0.08em",
                }}
              >
                Pilih Paket Ini
              </Link>
            </div>
          ))}
        </div>

        {/* Note */}
        <p style={{ textAlign: "center", color: "#8A8A8A", fontSize: "13px", marginTop: "48px" }}>
          * Harga belum termasuk biaya transportasi. Hubungi kami untuk diskusi kebutuhan khusus Anda.
        </p>
      </section>

      {/* CTA */}
      <section style={{ padding: "60px 24px 80px", background: "#F5F0E8", textAlign: "center" }}>
        <div style={{ maxWidth: "560px", margin: "0 auto" }}>
          <h2 style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: "clamp(24px, 3vw, 36px)", color: "#1C1C1C", fontWeight: 700, marginBottom: "16px" }}>
            Butuh Paket Khusus?
          </h2>
          <p style={{ fontSize: "15px", color: "#8A8A8A", lineHeight: 1.7, marginBottom: "32px" }}>
            Kami terbuka untuk mendiskusikan kebutuhan spesifik Anda. Hubungi kami dan kita rancang paket yang sempurna.
          </p>
          <Link
            href="/kontak"
            style={{ display: "inline-block", padding: "14px 40px", background: "#C9A96E", color: "#fff", textDecoration: "none", fontSize: "14px", fontWeight: 500, letterSpacing: "0.08em" }}
          >
            Konsultasi Gratis
          </Link>
        </div>
      </section>
    </>
  );
}
