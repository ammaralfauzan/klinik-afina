import Image from "next/image";
import Link from "next/link";

export const metadata = {
  title: "Tentang Kami — Fenoma Wedding Photography",
  description: "Kenali Fenoma lebih dekat — fotografer pernikahan profesional yang berdedikasi mengabadikan setiap momen berharga Anda.",
};

export default function TentangPage() {
  return (
    <>
      {/* Header */}
      <div style={{ padding: "120px 24px 60px", background: "#F5F0E8", textAlign: "center" }}>
        <p style={{ fontSize: "12px", letterSpacing: "0.3em", textTransform: "uppercase", color: "#C9A96E", marginBottom: "16px" }}>Tentang Kami</p>
        <h1 style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: "clamp(32px, 5vw, 52px)", color: "#1C1C1C", fontWeight: 700 }}>
          Kami Adalah Fenoma
        </h1>
      </div>

      {/* Story */}
      <section style={{ padding: "80px 24px" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "64px", alignItems: "center" }}>
          <div style={{ position: "relative", aspectRatio: "4/5", minHeight: "400px" }}>
            <Image
              src="https://picsum.photos/seed/team-about/800/1000"
              alt="Tim Fenoma"
              fill
              style={{ objectFit: "cover" }}
            />
          </div>
          <div>
            <p style={{ fontSize: "12px", letterSpacing: "0.3em", textTransform: "uppercase", color: "#C9A96E", marginBottom: "20px" }}>Kisah Kami</p>
            <h2 style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: "clamp(26px, 3vw, 38px)", color: "#1C1C1C", fontWeight: 700, lineHeight: 1.25, marginBottom: "24px" }}>
              Mengabadikan Cinta Sejak 2018
            </h2>
            <p style={{ fontSize: "15px", color: "#4A4A4A", lineHeight: 1.85, marginBottom: "20px" }}>
              Fenoma lahir dari sebuah keyakinan sederhana: setiap momen pernikahan layak diabadikan dengan indah dan penuh ketulusan. Berdiri sejak 2018, kami telah menjadi saksi ratusan kisah cinta yang unik dan penuh makna.
            </p>
            <p style={{ fontSize: "15px", color: "#4A4A4A", lineHeight: 1.85, marginBottom: "20px" }}>
              Tim fotografer kami tidak sekadar memotret — kami mengamati, merasakan, dan menangkap emosi sejati di balik setiap momen. Dari senyum tulus di altar akad hingga tawa bahagia di resepsi, kami ada di sana.
            </p>
            <p style={{ fontSize: "15px", color: "#4A4A4A", lineHeight: 1.85 }}>
              Dengan pendekatan yang personal dan penuh perhatian, kami memastikan pengalaman foto Anda terasa nyaman dan menghasilkan karya yang timeless.
            </p>
          </div>
        </div>
      </section>

      {/* Values */}
      <section style={{ padding: "80px 24px", background: "#F5F0E8" }}>
        <div style={{ maxWidth: "1000px", margin: "0 auto", textAlign: "center" }}>
          <p style={{ fontSize: "12px", letterSpacing: "0.3em", textTransform: "uppercase", color: "#C9A96E", marginBottom: "16px" }}>Filosofi Kami</p>
          <h2 style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: "clamp(26px, 3vw, 38px)", color: "#1C1C1C", fontWeight: 700, marginBottom: "56px" }}>
            Nilai yang Kami Pegang
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "40px" }}>
            {[
              { icon: "✦", title: "Autentik", desc: "Kami menangkap momen nyata, bukan momen yang dibuat-buat. Emosi sejati adalah karya terbaik." },
              { icon: "◈", title: "Artistik", desc: "Setiap foto adalah komposisi yang dipikirkan matang — cahaya, sudut, momen yang sempurna." },
              { icon: "◇", title: "Personal", desc: "Kami meluangkan waktu untuk mengenal Anda sebelum hari H, agar hasilnya benar-benar mencerminkan Anda." },
              { icon: "○", title: "Timeless", desc: "Hasil karya kami dirancang untuk tetap indah puluhan tahun kemudian, bukan sekadar tren sesaat." },
            ].map((item) => (
              <div key={item.title} style={{ padding: "40px 28px", background: "#FDFCF8" }}>
                <div style={{ fontSize: "28px", color: "#C9A96E", marginBottom: "16px" }}>{item.icon}</div>
                <h3 style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: "20px", color: "#1C1C1C", fontWeight: 600, marginBottom: "12px" }}>{item.title}</h3>
                <p style={{ fontSize: "14px", color: "#8A8A8A", lineHeight: 1.75 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section style={{ padding: "80px 24px", background: "#1C1C1C" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "40px", textAlign: "center" }}>
            {[
              { number: "500+", label: "Pasangan Bahagia" },
              { number: "6+", label: "Tahun Pengalaman" },
              { number: "20+", label: "Kota Dijangkau" },
              { number: "1000+", label: "Jam Dokumentasi" },
            ].map((stat) => (
              <div key={stat.label}>
                <p style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: "48px", color: "#C9A96E", fontWeight: 700, marginBottom: "8px", lineHeight: 1 }}>{stat.number}</p>
                <p style={{ fontSize: "13px", color: "#8A8A8A", letterSpacing: "0.05em" }}>{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section style={{ padding: "80px 24px" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "56px" }}>
            <p style={{ fontSize: "12px", letterSpacing: "0.3em", textTransform: "uppercase", color: "#C9A96E", marginBottom: "16px" }}>Tim Kami</p>
            <h2 style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: "clamp(26px, 3vw, 38px)", color: "#1C1C1C", fontWeight: 700 }}>
              Orang-Orang di Balik Fenoma
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "40px" }}>
            {[
              { name: "Andi Pratama", role: "Lead Photographer & Founder", seed: "team1" },
              { name: "Rini Kusuma", role: "Senior Photographer", seed: "team2" },
              { name: "Bagas Wibowo", role: "Photographer & Editor", seed: "team3" },
            ].map((member) => (
              <div key={member.name} style={{ textAlign: "center" }}>
                <div style={{ position: "relative", width: "200px", height: "200px", borderRadius: "50%", overflow: "hidden", margin: "0 auto 20px" }}>
                  <Image
                    src={`https://picsum.photos/seed/${member.seed}/400/400`}
                    alt={member.name}
                    fill
                    style={{ objectFit: "cover" }}
                  />
                </div>
                <h3 style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: "20px", color: "#1C1C1C", fontWeight: 600, marginBottom: "6px" }}>{member.name}</h3>
                <p style={{ fontSize: "13px", color: "#8A8A8A" }}>{member.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "60px 24px 80px", background: "#F5F0E8", textAlign: "center" }}>
        <div style={{ maxWidth: "560px", margin: "0 auto" }}>
          <h2 style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: "clamp(24px, 3vw, 36px)", color: "#1C1C1C", fontWeight: 700, marginBottom: "16px" }}>
            Mari Bekerja Bersama
          </h2>
          <p style={{ fontSize: "15px", color: "#8A8A8A", lineHeight: 1.7, marginBottom: "32px" }}>
            Percayakan momen pernikahan Anda kepada kami. Kami siap mengabadikannya dengan sepenuh hati.
          </p>
          <Link href="/kontak" style={{ display: "inline-block", padding: "14px 40px", background: "#C9A96E", color: "#fff", textDecoration: "none", fontSize: "14px", fontWeight: 500, letterSpacing: "0.08em" }}>
            Hubungi Kami
          </Link>
        </div>
      </section>
    </>
  );
}
