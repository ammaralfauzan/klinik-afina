'use client';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';

export default function HeroSection() {
  return (
    <section style={{ position: 'relative', width: '100%', height: '100vh', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {/* Background image */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        <Image
          src="https://picsum.photos/seed/hero1/1600/900"
          alt="Fenoma Wedding Photography"
          fill
          style={{ objectFit: 'cover' }}
          priority
        />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)' }} />
      </div>

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', padding: '0 24px', maxWidth: '800px' }}>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          style={{ fontSize: '13px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#C9A96E', marginBottom: '20px', fontWeight: 500 }}
        >
          Wedding Photography
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.4 }}
          style={{
            fontFamily: 'var(--font-playfair, Georgia, serif)',
            fontSize: 'clamp(42px, 7vw, 80px)',
            fontWeight: 700,
            color: '#fff',
            lineHeight: 1.15,
            marginBottom: '24px',
          }}
        >
          Abadikan Momen<br />Paling Berharga
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          style={{ fontSize: '18px', color: 'rgba(255,255,255,0.85)', lineHeight: 1.7, marginBottom: '40px' }}
        >
          Kami percaya setiap pernikahan adalah cerita yang layak diceritakan kembali — dengan foto yang memancarkan keindahan, ketulusan, dan cinta.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}
        >
          <Link href="/portfolio" style={{
            background: '#C9A96E',
            color: '#fff',
            padding: '14px 32px',
            textDecoration: 'none',
            fontSize: '15px',
            fontWeight: 600,
            letterSpacing: '0.05em',
            borderRadius: '2px',
            display: 'inline-block',
          }}>
            Lihat Portofolio
          </Link>
          <Link href="/kontak" style={{
            background: 'transparent',
            color: '#fff',
            padding: '14px 32px',
            textDecoration: 'none',
            fontSize: '15px',
            fontWeight: 600,
            letterSpacing: '0.05em',
            borderRadius: '2px',
            border: '1px solid rgba(255,255,255,0.6)',
            display: 'inline-block',
          }}>
            Hubungi Kami
          </Link>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 1 }}
        style={{ position: 'absolute', bottom: '32px', left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}
      >
        <span style={{ fontSize: '11px', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase' }}>Scroll</span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          style={{ width: '1px', height: '40px', background: 'linear-gradient(to bottom, rgba(255,255,255,0.6), transparent)' }}
        />
      </motion.div>
    </section>
  );
}
