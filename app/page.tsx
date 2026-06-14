import Link from 'next/link';
import HeroSection from './components/HeroSection';
import TestimonialCard from './components/TestimonialCard';
import { portfolioItems, testimonials } from '@/lib/data';
import GalleryGrid from './components/GalleryGrid';

const services = [
  {
    title: 'Prewedding',
    description: 'Sesi foto sebelum hari H, mengabadikan keromantisan Anda di lokasi pilihan.',
    icon: '✦',
  },
  {
    title: 'Akad Nikah',
    description: 'Momen sakral ijab kabul yang diabadikan dengan penuh khidmat dan keindahan.',
    icon: '◆',
  },
  {
    title: 'Resepsi',
    description: 'Pesta pernikahan Anda, dari dekorasi hingga tawa bahagia semua tamu.',
    icon: '❋',
  },
  {
    title: 'Engagement',
    description: 'Sesi lamaran yang romantic dan tak terlupakan, sebelum perjalanan baru dimulai.',
    icon: '◇',
  },
];

export default function HomePage() {
  const galleryPreview = portfolioItems.slice(0, 6);

  return (
    <>
      <HeroSection />

      {/* Services Section */}
      <section style={{ padding: '96px 24px', background: '#FDFCF8' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <p style={{ color: '#C9A96E', fontSize: '11px', fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '16px' }}>
              Layanan Kami
            </p>
            <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 700, color: '#1C1C1C', lineHeight: 1.3 }}>
              Dokumentasi Terbaik
              <br />
              <em>Untuk Hari Terbaik Anda</em>
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '32px' }}>
            {services.map((service, i) => (
              <div
                key={i}
                style={{
                  textAlign: 'center',
                  padding: '40px 24px',
                  background: '#F5F0E8',
                  borderRadius: '2px',
                }}
              >
                <div style={{ fontSize: '28px', color: '#C9A96E', marginBottom: '20px' }}>{service.icon}</div>
                <h3 style={{ fontFamily: 'var(--font-playfair)', fontSize: '20px', fontWeight: 700, color: '#1C1C1C', marginBottom: '12px' }}>
                  {service.title}
                </h3>
                <p style={{ fontSize: '14px', color: '#8A8A8A', lineHeight: 1.8 }}>{service.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery Preview */}
      <section style={{ padding: '96px 24px', background: '#F5F0E8' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <p style={{ color: '#C9A96E', fontSize: '11px', fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '16px' }}>
              Portofolio
            </p>
            <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 700, color: '#1C1C1C', lineHeight: 1.3, marginBottom: '16px' }}>
              Momen Yang Kami Abadikan
            </h2>
            <p style={{ color: '#8A8A8A', fontSize: '15px', maxWidth: '480px', margin: '0 auto' }}>
              Setiap foto adalah cerita. Setiap momen adalah kenangan yang akan selalu dikenang.
            </p>
          </div>

          <GalleryGrid items={galleryPreview} />

          <div style={{ textAlign: 'center', marginTop: '48px' }}>
            <Link
              href="/portfolio"
              style={{
                border: '1px solid #C9A96E',
                color: '#C9A96E',
                padding: '14px 40px',
                borderRadius: '2px',
                fontWeight: 600,
                fontSize: '13px',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                textDecoration: 'none',
                display: 'inline-block',
                transition: 'all 0.2s',
              }}
            >
              Lihat Semua Portofolio
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section style={{ padding: '80px 24px', background: '#1C1C1C' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '32px', textAlign: 'center' }}>
            {[
              { number: '500+', label: 'Pasangan Bahagia' },
              { number: '5 Tahun', label: 'Pengalaman' },
              { number: '12+', label: 'Kota di Indonesia' },
              { number: '4.9★', label: 'Rating Klien' },
            ].map((stat, i) => (
              <div key={i}>
                <div style={{ fontFamily: 'var(--font-playfair)', fontSize: '36px', fontWeight: 700, color: '#C9A96E', marginBottom: '8px' }}>
                  {stat.number}
                </div>
                <div style={{ fontSize: '13px', color: '#8A8A8A', letterSpacing: '0.05em' }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section style={{ padding: '96px 24px', background: '#F5F0E8' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <p style={{ color: '#C9A96E', fontSize: '11px', fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '16px' }}>
              Kata Mereka
            </p>
            <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 700, color: '#1C1C1C', lineHeight: 1.3 }}>
              Cerita Bahagia Klien Kami
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
            {testimonials.map((t, i) => (
              <TestimonialCard key={t.id} testimonial={t} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section
        style={{
          padding: '96px 24px',
          background: '#1C1C1C',
          position: 'relative',
          overflow: 'hidden',
          textAlign: 'center',
        }}
      >
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '600px', margin: '0 auto' }}>
          <p style={{ color: '#C9A96E', fontSize: '11px', fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '16px' }}>
            Mulai Perjalanan Anda
          </p>
          <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 700, color: '#FDFCF8', lineHeight: 1.3, marginBottom: '20px' }}>
            Siap Mengabadikan
            <br />
            <em>Hari Istimewa Anda?</em>
          </h2>
          <p style={{ color: '#8A8A8A', fontSize: '15px', lineHeight: 1.8, marginBottom: '40px' }}>
            Hubungi kami sekarang untuk konsultasi gratis dan jadwalkan sesi foto pernikahan impian Anda.
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link
              href="/kontak"
              style={{
                background: '#C9A96E',
                color: '#fff',
                padding: '14px 36px',
                borderRadius: '2px',
                fontWeight: 600,
                fontSize: '13px',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                textDecoration: 'none',
              }}
            >
              Hubungi Kami
            </Link>
            <a
              href="https://wa.me/6281234567890"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                border: '1px solid rgba(253,252,248,0.3)',
                color: '#FDFCF8',
                padding: '14px 36px',
                borderRadius: '2px',
                fontWeight: 600,
                fontSize: '13px',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                textDecoration: 'none',
              }}
            >
              WhatsApp
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
