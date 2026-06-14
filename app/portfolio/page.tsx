import { portfolioItems } from "@/lib/data";
import GalleryGrid from "../components/GalleryGrid";

export const metadata = {
  title: "Portofolio — Fenoma Wedding Photography",
  description: "Galeri foto pernikahan, prewedding, akad nikah, resepsi, dan engagement dari Fenoma Photography.",
};

export default function PortfolioPage() {
  return (
    <>
      {/* Page Header */}
      <div style={{ padding: "120px 24px 60px", background: "#F5F0E8", textAlign: "center" }}>
        <p
          style={{
            fontSize: "12px",
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            color: "#C9A96E",
            marginBottom: "16px",
          }}
        >
          Galeri
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
          Portofolio
        </h1>
        <p style={{ fontSize: "15px", color: "#8A8A8A", maxWidth: "480px", margin: "0 auto", lineHeight: 1.7 }}>
          Koleksi karya terpilih dari berbagai momen pernikahan yang telah kami abadikan dengan penuh ketulusan.
        </p>
      </div>

      {/* Gallery with filters */}
      <section style={{ padding: "60px 24px 80px", maxWidth: "1200px", margin: "0 auto" }}>
        <GalleryGrid items={portfolioItems} showFilters={true} />
      </section>
    </>
  );
}
