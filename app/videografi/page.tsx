import Image from "next/image";
import NotifyForm from "../components/NotifyForm";

export const metadata = {
  title: "Videografi — Segera Hadir | Fenoma",
  description: "Fenoma segera hadir dengan layanan videografi pernikahan sinematik. Daftarkan diri Anda untuk mendapat informasi pertama.",
};

export default function VideografiPage() {
  return (
    <>
      {/* Hero Coming Soon */}
      <section style={{ position: "relative", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Image
          src="https://picsum.photos/seed/video-hero/1920/1080"
          alt="Fenoma Videografi Coming Soon"
          fill
          priority
          style={{ objectFit: "cover", objectPosition: "center", filter: "grayscale(30%)" }}
        />
        <div style={{ position: "absolute", inset: 0, background: "rgba(10,8,5,0.72)" }} />

        <div style={{ position: "relative", zIndex: 1, textAlign: "center", padding: "120px 24px 80px", maxWidth: "720px", margin: "0 auto" }}>
          <div
            style={{
              display: "inline-block",
              border: "1px solid rgba(201,169,110,0.5)",
              color: "#C9A96E",
              fontSize: "11px",
              padding: "8px 24px",
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              marginBottom: "32px",
              fontWeight: 600,
            }}
          >
            Coming Soon
          </div>

          <h1
            style={{
              fontFamily: "var(--font-playfair, Georgia, serif)",
              fontSize: "clamp(32px, 6vw, 64px)",
              color: "#FDFCF8",
              fontWeight: 700,
              lineHeight: 1.15,
              marginBottom: "24px",
            }}
          >
            Sebentar lagi, Fenoma hadir dalam gerak.
          </h1>

          <p style={{ fontSize: "clamp(15px, 2vw, 18px)", color: "rgba(255,255,255,0.7)", lineHeight: 1.8, marginBottom: "16px" }}>
            Kami sedang menyiapkan sesuatu yang istimewa — film pernikahan sinematik yang akan menceritakan kisah cinta Anda
            dengan cara yang belum pernah Anda bayangkan sebelumnya.
          </p>
          <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.5)", marginBottom: "56px" }}>
            Daftarkan diri Anda dan jadilah yang pertama mengetahui saat kami resmi diluncurkan.
          </p>

          {/* Notify Form */}
          <div style={{ background: "rgba(253,252,248,0.05)", border: "1px solid rgba(201,169,110,0.2)", padding: "40px", backdropFilter: "blur(8px)" }}>
            <h2
              style={{
                fontFamily: "var(--font-playfair, Georgia, serif)",
                fontSize: "22px",
                color: "#FDFCF8",
                marginBottom: "8px",
                fontWeight: 600,
              }}
            >
              Beritahu Saya
            </h2>
            <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.55)", marginBottom: "28px" }}>
              Masukkan kontak Anda dan kami akan menghubungi Anda saat Videografi Fenoma resmi diluncurkan.
            </p>
            <NotifyForm />
          </div>
        </div>
      </section>

      {/* Teaser Features */}
      <section style={{ padding: "80px 24px", background: "#1C1C1C" }}>
        <div style={{ maxWidth: "1000px", margin: "0 auto", textAlign: "center" }}>
          <p style={{ fontSize: "12px", letterSpacing: "0.3em", textTransform: "uppercase", color: "#C9A96E", marginBottom: "40px" }}>Yang Akan Datang</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "40px" }}>
            {[
              { icon: "🎬", title: "Film Sinematik", desc: "Setiap frame dirancang seperti karya film profesional." },
              { icon: "🎵", title: "Musik Personal", desc: "Diiringi musik yang mencerminkan cerita cinta Anda." },
              { icon: "✂️", title: "Highlight Reel", desc: "Rangkuman momen terbaik dalam 3–5 menit yang memukau." },
              { icon: "📽️", title: "Full Documentary", desc: "Dokumentasi lengkap dari pagi hingga malam hari istimewa." },
            ].map((item) => (
              <div key={item.title}>
                <div style={{ fontSize: "36px", marginBottom: "16px" }}>{item.icon}</div>
                <h3 style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: "18px", color: "#FDFCF8", marginBottom: "10px", fontWeight: 600 }}>
                  {item.title}
                </h3>
                <p style={{ fontSize: "14px", color: "#8A8A8A", lineHeight: 1.7 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
