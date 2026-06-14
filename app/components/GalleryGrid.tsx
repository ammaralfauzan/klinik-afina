'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { PortfolioItem, Category } from '@/lib/data';
import Lightbox from './Lightbox';

interface GalleryGridProps {
  items: PortfolioItem[];
  showFilters?: boolean;
}

const categories: Category[] = ['Prewedding', 'Akad', 'Resepsi', 'Engagement'];

export default function GalleryGrid({ items, showFilters = false }: GalleryGridProps) {
  const [activeCategory, setActiveCategory] = useState<Category | 'All'>('All');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const filtered = activeCategory === 'All' ? items : items.filter((i) => i.category === activeCategory);

  return (
    <div>
      {showFilters && (
        <div
          style={{
            display: 'flex',
            gap: '8px',
            justifyContent: 'center',
            flexWrap: 'wrap',
            marginBottom: '48px',
          }}
        >
          {(['All', ...categories] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                padding: '8px 20px',
                borderRadius: '2px',
                border: '1px solid',
                borderColor: activeCategory === cat ? '#C9A96E' : '#E0D9CC',
                background: activeCategory === cat ? '#C9A96E' : 'transparent',
                color: activeCategory === cat ? '#fff' : '#8A8A8A',
                fontSize: '12px',
                fontWeight: 600,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {cat === 'All' ? 'Semua' : cat}
            </button>
          ))}
        </div>
      )}

      <div
        style={{
          columns: '3 300px',
          gap: '16px',
        }}
      >
        {filtered.map((item, idx) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: idx * 0.05 }}
            onClick={() => setLightboxIndex(idx)}
            style={{
              breakInside: 'avoid',
              marginBottom: '16px',
              cursor: 'pointer',
              position: 'relative',
              overflow: 'hidden',
              borderRadius: '2px',
            }}
          >
            <div style={{ position: 'relative', width: '100%' }}>
              <Image
                src={item.imageUrl}
                alt={item.title}
                width={item.width}
                height={item.height}
                style={{
                  width: '100%',
                  height: 'auto',
                  display: 'block',
                  transition: 'transform 0.4s ease',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(0,0,0,0)',
                  transition: 'background 0.3s ease',
                  display: 'flex',
                  alignItems: 'flex-end',
                  padding: '16px',
                }}
                className="gallery-overlay"
              >
                <div style={{ opacity: 0, transition: 'opacity 0.3s' }} className="gallery-info">
                  <p style={{ color: '#C9A96E', fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '4px' }}>
                    {item.category}
                  </p>
                  <p style={{ color: '#fff', fontSize: '14px', fontFamily: 'var(--font-playfair)' }}>
                    {item.title}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <style>{`
        .gallery-overlay:hover {
          background: rgba(0,0,0,0.45) !important;
        }
        .gallery-overlay:hover .gallery-info {
          opacity: 1 !important;
        }
      `}</style>

      {lightboxIndex !== null && (
        <Lightbox
          items={filtered}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </div>
  );
}
