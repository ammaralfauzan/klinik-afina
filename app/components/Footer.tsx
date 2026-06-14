import Link from 'next/link';

export default function Footer() {
  return (
    <footer style={{ background: '#1C1C1C', color: '#fff', padding: '60px 24px 30px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '40px', marginBottom: '48px' }}>
          {/* Brand */}
          <div>
            <h3 style={{ fontFamily: 'var(--font-playfair, Georgia, serif)', fontSize: '28px', color: '#C9A96E', marginBottom: '12px', letterSpacing: '0.1em' }}>FENOMA</h3>
            <p style={{ fontSize: '14px', color: '#8A8A8A', lineHeight: '1.7', maxWidth: '240px' }}>
              Mengabadikan setiap momen berharga perjalanan cinta Anda dengan sentuhan seni yang timeless.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h4 style={{ fontSize: '13px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#C9A96E', marginBottom: '16px' }}>Navigasi</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {([['/', 'Beranda'], ['/portfolio', 'Portofolio'], ['/paket', 'Paket'], ['/videografi', 'Videografi'], ['/tentang', 'Tentang'], ['/kontak', 'Kontak']] as const).map(([href, label]) => (
                <Link key={href} href={href} style={{ color: '#8A8A8A', textDecoration: 'none', fontSize: '14px', transition: 'color 0.2s' }}>{label}</Link>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 style={{ fontSize: '13px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#C9A96E', marginBottom: '16px' }}>Kontak</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px', color: '#8A8A8A' }}>
              <a href="https://wa.me/6281234567890" style={{ color: '#8A8A8A', textDecoration: 'none' }}>WhatsApp: +62 812-3456-7890</a>
              <a href="mailto:hello@fenoma.id" style={{ color: '#8A8A8A', textDecoration: 'none' }}>hello@fenoma.id</a>
              <p>Instagram: @fenoma.photography</p>
            </div>
          </div>
        </div>

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <p style={{ fontSize: '13px', color: '#8A8A8A' }}>© 2024 Fenoma. All rights reserved.</p>
          <p style={{ fontSize: '13px', color: '#8A8A8A' }}>Wedding Photography & Videography</p>
        </div>
      </div>
    </footer>
  );
}
