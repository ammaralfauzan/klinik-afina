import Image from "next/image";
import Link from "next/link";
import Gallery from "./components/Gallery";
import { testimonials } from "@/lib/data";

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section style={{ position: "relative", height: "100vh", minHeight: "600px" }}>
        <Image
          src="https://picsum.photos/seed/fenoma-hero/1920/1080"
          alt="Fenoma Wedding Photography"
          fill
          priority
          style={{ objectFit: "cover", objectPosition: "center" }}
        />
        <div style={{ position: "absolute", inset: 0, background: "rgba(15,10,5,0.5)" }} />
        <div
          style={{
            position: "relative",
            zIndex: 1,
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            padding: "0 24px",
          }}
        >
          <p style={{ fontSize: "13px", letterSpacing: "0.3em", textTransform: "uppercase", color: "#C9A96E", marginBottom: "20px" }}>
            Wedding Photography
          </p>
          <h1
            style={{
              fontFamily: "var(--font-playfair, Georgia, serif)",
              fontSize: "clamp(36px, 7vw, 76px)",
              fontWeight: 700,
              color: "#FFFFFF",
              lineHeight: 1.15,
              maxWidth: "780px",
              marginBottom: "24px",
            }}
          >
            Abadikan Setiap Momen Tak Terlupakan
          </h1>
          <p style={{ fontSize: "clamp(15px, 2vw, 18px)", color: "rgba(255,255,255,0.8)", maxWidth: "520px", lineHeight: 1.7, marginBottom: "40px" }}>
            Fotografi pernikahan yang menangkap detail keindahan, kebahagiaan, dan cinta dalam setiap frame.
          </p>
          <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", justifyContent: "center" }}>
            <Link
              href="/portfolio"
              style={{ padding: "14px 32px", background: "#C9A96E", color: "#fff", textDecoration: "none", fontSize: "14px", fontWeight: 500, letterSpacing: "0.08em" }}
            >
              Lihat Portofolio
            </Link>
            <Link
              href="/kontak"
              style={{ padding: "14px 32px", background: "transparent", color: "#fff", border: "1px solid rgba(255,255,255,0.6)", textDecoration: "none", fontSize: "14px", fontWeight: 500, letterSpacing: "0.08em" }}
            >
              Hubungi Kami
            </Link>
          </div>
        </div>
      </section>

      {/* Services Highlight */}
      <section style={{ padding: "80px 24px", background: "#F5F0E8" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", textAlign: "center" }}>
          <p style={{ fontSize: "12px", letterSpacing: "0.3em", textTransform: "uppercase", color: "#C9A96E", marginBottom: "16px" }}>Layanan Kami</p>
          <h2 style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: "clamp(28px, 4vw, 42px)", color: "#1C1C1C", marginBottom: "56px", fontWeight: 700 }}>
            Ceritakan Kisah Cinta Anda
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "32px" }}>
            <Link href="/portfolio" style={{ display: "block", background: "#FDFCF8", padding: "48px 40px", textDecoration: "none", border: "1px solid rgba(201,169,110,0.2)" }}>
              <div style={{ fontSize: "28px", marginBottom: "20px", color: "#C9A96E" }}>✦</div>
              <h3 style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: "24px", color: "#1C1C1C", marginBottom: "12px", fontWeight: 600 }}>Photography</h3>
              <p style={{ fontSize: "14px", color: "#8A8A8A", lineHeight: 1.7, marginBottom: "20px" }}>
                Prewedding, Akad Nikah, Resepsi, Engagement — setiap momen diabadikan dengan penuh jiwa.
              </p>
              <span style={{ fontSize: "13px", color: "#C9A96E", fontWeight: 500 }}>Lihat Galeri →</span>
            </Link>
            <div style={{ background: "#1C1C1C", padding: "48px 40px", position: "relative" }}>
              <span style={{ position: "absolute", top: "20px", right: "20px", background: "#C9A96E", color: "#fff", fontSize: "11px", padding: "4px 12px", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600 }}>Coming Soon</span>
              <div style={{ fontSize: "28px", marginBottom: "20px", color: "#C9A96E" }}>▶</div>
              <h3 style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: "24px", color: "#FDFCF8", marginBottom: "12px", fontWeight: 600 }}>Videografi</h3>
              <p style={{ fontSize: "14px", color: "#8A8A8A", lineHeight: 1.7, marginBottom: "20px" }}>
                Sebentar lagi, Fenoma hadir dalam gerak. Film pernikahan sinematik yang menceritakan kisah Anda.
              </p>
              <Link href="/videografi" style={{ fontSize: "13px", color: "#C9A96E", fontWeight: 500, textDecoration: "none" }}>Daftar Waitlist →</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Gallery Preview */}
      <section style={{ padding: "80px 24px" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "48px" }}>
            <p style={{ fontSize: "12px", letterSpacing: "0.3em", textTransform: "uppercase", color: "#C9A96E", marginBottom: "16px" }}>Portofolio</p>
            <h2 style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: "clamp(28px, 4vw, 42px)", color: "#1C1C1C", marginBottom: "16px", fontWeight: 700 }}>
              Hasil Karya Kami
            </h2>
            <p style={{ fontSize: "15px", color: "#8A8A8A", maxWidth: "480px", margin: "0 auto" }}>
              Berikut sebagian karya terpilih dari berbagai momen istimewa yang telah kami abadikan.
            </p>
          </div>
          <Gallery limit={6} showFilter={false} />
          <div style={{ textAlign: "center", marginTop: "48px" }}>
            <Link href="/portfolio" style={{ display: "inline-block", padding: "14px 40px", border: "1px solid #C9A96E", color: "#C9A96E", textDecoration: "none", fontSize: "14px", fontWeight: 500, letterSpacing: "0.08em" }}>
              Lihat Semua Foto
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section style={{ padding: "80px 24px", background: "#F5F0E8" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "48px" }}>
            <p style={{ fontSize: "12px", letterSpacing: "0.3em", textTransform: "uppercase", color: "#C9A96E", marginBottom: "16px" }}>Testimoni</p>
            <h2 style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: "clamp(28px, 4vw, 42px)", color: "#1C1C1C", fontWeight: 700 }}>
              Kata Mereka
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "24px" }}>
            {testimonials.slice(0, 3).map((t) => (
              <div key={t.id} style={{ background: "#FDFCF8", padding: "36px 32px", borderTop: "2px solid #C9A96E" }}>
                <div style={{ color: "#C9A96E", fontSize: "18px", marginBottom: "16px", letterSpacing: "4px" }}>★★★★★</div>
                <p style={{ fontSize: "15px", color: "#4A4A4A", lineHeight: 1.75, fontStyle: "italic", marginBottom: "24px" }}>
                  &ldquo;{t.content}&rdquo;
                </p>
                <div>
                  <p style={{ fontWeight: 600, color: "#1C1C1C", fontSize: "15px" }}>{t.name}</p>
                  <p style={{ fontSize: "13px", color: "#8A8A8A", marginTop: "4px" }}>{t.eventType} — {t.location}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "80px 24px", background: "#1C1C1C", textAlign: "center" }}>
        <div style={{ maxWidth: "640px", margin: "0 auto" }}>
          <p style={{ fontSize: "12px", letterSpacing: "0.3em", textTransform: "uppercase", color: "#C9A96E", marginBottom: "20px" }}>Mulai Sekarang</p>
          <h2 style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: "clamp(28px, 4vw, 44px)", color: "#FDFCF8", fontWeight: 700, marginBottom: "20px", lineHeight: 1.2 }}>
            Jadikan Hari Istimewa Anda Abadi
          </h2>
          <p style={{ fontSize: "15px", color: "#8A8A8A", lineHeight: 1.7, marginBottom: "40px" }}>
            Hubungi kami dan ceritakan kisah cinta Anda. Kami siap mengabadikannya dengan sepenuh hati.
          </p>
          <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/kontak" style={{ padding: "14px 36px", background: "#C9A96E", color: "#fff", textDecoration: "none", fontSize: "14px", fontWeight: 500, letterSpacing: "0.08em" }}>
              Hubungi Kami
            </Link>
            <Link href="/paket" style={{ padding: "14px 36px", border: "1px solid rgba(255,255,255,0.25)", color: "#fff", textDecoration: "none", fontSize: "14px", fontWeight: 500, letterSpacing: "0.08em" }}>
              Lihat Paket
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
