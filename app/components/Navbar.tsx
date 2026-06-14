'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';

const navLinks = [
  { href: '/', label: 'Beranda' },
  { href: '/portfolio', label: 'Portofolio' },
  { href: '/paket', label: 'Paket' },
  { href: '/videografi', label: 'Videografi', badge: 'Segera' },
  { href: '/tentang', label: 'Tentang' },
  { href: '/kontak', label: 'Kontak' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  return (
    <nav
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        transition: 'background 0.3s ease, box-shadow 0.3s ease',
        background: scrolled ? 'rgba(253, 252, 248, 0.97)' : 'transparent',
        boxShadow: scrolled ? '0 1px 20px rgba(0,0,0,0.08)' : 'none',
        backdropFilter: scrolled ? 'blur(10px)' : 'none',
      }}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '72px' }}>
        {/* Logo */}
        <Link href="/" style={{ textDecoration: 'none' }}>
          <span style={{ fontFamily: 'var(--font-playfair, Georgia, serif)', fontSize: '24px', fontWeight: 700, color: '#C9A96E', letterSpacing: '0.1em' }}>
            FENOMA
          </span>
        </Link>

        {/* Desktop Nav */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }} className="desktop-nav">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              style={{
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: 500,
                letterSpacing: '0.05em',
                color: pathname === link.href ? '#C9A96E' : '#1C1C1C',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'color 0.2s',
              }}
            >
              {link.label}
              {link.badge && (
                <span style={{
                  background: '#C9A96E',
                  color: '#fff',
                  fontSize: '10px',
                  padding: '2px 6px',
                  borderRadius: '999px',
                  fontWeight: 600,
                  letterSpacing: '0.03em',
                }}>
                  {link.badge}
                </span>
              )}
            </Link>
          ))}
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1C1C1C', padding: '8px' }}
          className="mobile-menu-btn"
          aria-label="Toggle menu"
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div style={{
          background: 'rgba(253,252,248,0.98)',
          backdropFilter: 'blur(10px)',
          borderTop: '1px solid rgba(201,169,110,0.2)',
          padding: '20px 24px',
        }}>
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '14px 0',
                textDecoration: 'none',
                fontSize: '16px',
                fontWeight: 500,
                color: pathname === link.href ? '#C9A96E' : '#1C1C1C',
                borderBottom: '1px solid rgba(0,0,0,0.06)',
              }}
            >
              {link.label}
              {link.badge && (
                <span style={{
                  background: '#C9A96E',
                  color: '#fff',
                  fontSize: '10px',
                  padding: '2px 6px',
                  borderRadius: '999px',
                  fontWeight: 600,
                }}>
                  {link.badge}
                </span>
              )}
            </Link>
          ))}
        </div>
      )}

      <style>{`
        @media (min-width: 769px) { .mobile-menu-btn { display: none; } }
        @media (max-width: 768px) { .desktop-nav { display: none; } }
      `}</style>
    </nav>
  );
}
