'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Check } from 'lucide-react';
import { Package } from '@/lib/data';

interface PackageCardProps {
  pkg: Package;
  index: number;
}

export default function PackageCard({ pkg, index }: PackageCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      style={{
        background: pkg.highlight ? '#1C1C1C' : '#FDFCF8',
        border: pkg.highlight ? '2px solid #C9A96E' : '1px solid #E8E2D8',
        borderRadius: '2px',
        padding: '40px 32px',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {pkg.highlight && (
        <div
          style={{
            position: 'absolute',
            top: '-12px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#C9A96E',
            color: '#fff',
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            padding: '4px 16px',
            borderRadius: '2px',
          }}
        >
          Terpopuler
        </div>
      )}

      <div style={{ marginBottom: '8px' }}>
        <p
          style={{
            fontSize: '11px',
            fontWeight: 600,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            color: '#C9A96E',
            marginBottom: '8px',
          }}
        >
          Paket
        </p>
        <h3
          style={{
            fontFamily: 'var(--font-playfair)',
            fontSize: '28px',
            fontWeight: 700,
            color: pkg.highlight ? '#FDFCF8' : '#1C1C1C',
            marginBottom: '4px',
          }}
        >
          {pkg.name}
        </h3>
      </div>

      <div style={{ marginBottom: '32px' }}>
        <span
          style={{
            fontFamily: 'var(--font-playfair)',
            fontSize: '32px',
            fontWeight: 700,
            color: pkg.highlight ? '#C9A96E' : '#1C1C1C',
          }}
        >
          {pkg.price}
        </span>
        <span
          style={{
            fontSize: '13px',
            color: '#8A8A8A',
            marginLeft: '8px',
          }}
        >
          {pkg.priceNote}
        </span>
      </div>

      <div style={{ flex: 1, marginBottom: '32px' }}>
        {pkg.features.map((feature, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              padding: '10px 0',
              borderBottom: `1px solid ${pkg.highlight ? 'rgba(255,255,255,0.06)' : '#F0EBE2'}`,
            }}
          >
            <Check
              size={16}
              style={{ color: '#C9A96E', flexShrink: 0, marginTop: '2px' }}
            />
            <span style={{ fontSize: '14px', color: pkg.highlight ? '#D4C5A9' : '#3a3a3a', lineHeight: 1.5 }}>
              {feature}
            </span>
          </div>
        ))}
      </div>

      <Link
        href="/kontak"
        style={{
          display: 'block',
          textAlign: 'center',
          padding: '14px 24px',
          background: pkg.highlight ? '#C9A96E' : 'transparent',
          border: `1px solid ${pkg.highlight ? '#C9A96E' : '#C9A96E'}`,
          color: pkg.highlight ? '#fff' : '#C9A96E',
          borderRadius: '2px',
          fontWeight: 600,
          fontSize: '13px',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          textDecoration: 'none',
          transition: 'all 0.2s',
        }}
      >
        Pesan Sekarang
      </Link>
    </motion.div>
  );
}
