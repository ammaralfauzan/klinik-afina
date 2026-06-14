import ContactForm from "../components/ContactForm";

export const metadata = {
  title: "Kontak — Fenoma Wedding Photography",
  description: "Hubungi Fenoma untuk konsultasi dan pemesanan fotografi pernikahan Anda. Kami siap membantu mewujudkan kenangan istimewa.",
};

export default function KontakPage() {
  return (
    <>
      {/* Header */}
      <div style={{ padding: "120px 24px 60px", background: "#F5F0E8", textAlign: "center" }}>
        <p style={{ fontSize: "12px", letterSpacing: "0.3em", textTransform: "uppercase", color: "#C9A96E", marginBottom: "16px" }}>Hubungi Kami</p>
        <h1 style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: "clamp(32px, 5vw, 52px)", color: "#1C1C1C", fontWeight: 700, marginBottom: "16px" }}>
          Mari Berbincang
        </h1>
        <p style={{ fontSize: "15px", color: "#8A8A8A", maxWidth: "480px", margin: "0 auto", lineHeight: 1.7 }}>
          Ceritakan tentang hari istimewa Anda dan biarkan kami merancang pengalaman fotografi yang sempurna untuk Anda.
        </p>
      </div>

      {/* Content */}
      <section style={{ padding: "80px 24px" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "64px" }}>
          {/* Info */}
          <div>
            <h2 style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: "28px", color: "#1C1C1C", fontWeight: 700, marginBottom: "32px" }}>
              Informasi Kontak
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
              {/* WhatsApp */}
              <div>
                <p style={{ fontSize: "12px", letterSpacing: "0.2em", textTransform: "uppercase", color: "#C9A96E", marginBottom: "8px", fontWeight: 600 }}>WhatsApp</p>
                <a
                  href="https://wa.me/6281234567890"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: "18px", color: "#1C1C1C", textDecoration: "none", fontWeight: 500 }}
                >
                  +62 812-3456-7890
                </a>
                <p style={{ fontSize: "13px", color: "#8A8A8A", marginTop: "4px" }}>Respon cepat di jam kerja (08.00–20.00)</p>
              </div>

              {/* Email */}
              <div>
                <p style={{ fontSize: "12px", letterSpacing: "0.2em", textTransform: "uppercase", color: "#C9A96E", marginBottom: "8px", fontWeight: 600 }}>Email</p>
                <a href="mailto:hello@fenoma.id" style={{ fontSize: "18px", color: "#1C1C1C", textDecoration: "none", fontWeight: 500 }}>
                  hello@fenoma.id
                </a>
              </div>

              {/* Social */}
              <div>
                <p style={{ fontSize: "12px", letterSpacing: "0.2em", textTransform: "uppercase", color: "#C9A96E", marginBottom: "8px", fontWeight: 600 }}>Instagram</p>
                <a
                  href="https://instagram.com/fenoma.photography"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: "18px", color: "#1C1C1C", textDecoration: "none", fontWeight: 500 }}
                >
                  @fenoma.photography
                </a>
              </div>

              {/* Area */}
              <div>
                <p style={{ fontSize: "12px", letterSpacing: "0.2em", textTransform: "uppercase", color: "#C9A96E", marginBottom: "8px", fontWeight: 600 }}>Area Layanan</p>
                <p style={{ fontSize: "15px", color: "#4A4A4A", lineHeight: 1.7 }}>
                  Jakarta, Bogor, Depok, Tangerang, Bekasi,<br />Bandung, Yogyakarta, Bali & sekitarnya.
                </p>
                <p style={{ fontSize: "13px", color: "#8A8A8A", marginTop: "8px" }}>Untuk luar kota, hubungi kami untuk diskusi biaya perjalanan.</p>
              </div>
            </div>

            {/* WhatsApp CTA */}
            <a
              href="https://wa.me/6281234567890?text=Halo%20Fenoma%2C%20saya%20ingin%20menanyakan%20tentang%20layanan%20fotografi%20pernikahan."
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "10px",
                marginTop: "40px",
                padding: "14px 28px",
                background: "#25D366",
                color: "#fff",
                textDecoration: "none",
                fontSize: "14px",
                fontWeight: 500,
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Chat via WhatsApp
            </a>
          </div>

          {/* Form */}
          <div>
            <h2 style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: "28px", color: "#1C1C1C", fontWeight: 700, marginBottom: "32px" }}>
              Kirim Pesan
            </h2>
            <ContactForm />
          </div>
        </div>
      </section>
    </>
  );
}
