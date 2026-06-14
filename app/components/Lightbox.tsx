'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { PortfolioItem } from '@/lib/data';
import { motion, AnimatePresence } from 'framer-motion';

interface LightboxProps {
  items: PortfolioItem[];
  initialIndex: number;
  onClose: () => void;
}

export default function Lightbox({ items, initialIndex, onClose }: LightboxProps) {
  const [index, setIndex] = useState(initialIndex);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') setIndex((i) => (i > 0 ? i - 1 : items.length - 1));
      if (e.key === 'ArrowRight') setIndex((i) => (i < items.length - 1 ? i + 1 : 0));
    };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [items.length, onClose]);

  const current = items[index];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.92)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
        }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '24px',
            right: '24px',
            background: 'rgba(255,255,255,0.1)',
            border: 'none',
            borderRadius: '50%',
            width: '44px',
            height: '44px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#fff',
            transition: 'background 0.2s',
          }}
        >
          <X size={20} />
        </button>

        {/* Prev */}
        <button
          onClick={(e) => { e.stopPropagation(); setIndex((i) => (i > 0 ? i - 1 : items.length - 1)); }}
          style={{
            position: 'absolute',
            left: '16px',
            background: 'rgba(255,255,255,0.1)',
            border: 'none',
            borderRadius: '50%',
            width: '44px',
            height: '44px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#fff',
          }}
        >
          <ChevronLeft size={22} />
        </button>

        {/* Image */}
        <motion.div
          key={index}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.25 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            maxWidth: '90vw',
            maxHeight: '85vh',
            position: 'relative',
          }}
        >
          <Image
            src={current.imageUrl}
            alt={current.title}
            width={current.width}
            height={current.height}
            style={{
              maxWidth: '90vw',
              maxHeight: '85vh',
              width: 'auto',
              height: 'auto',
              objectFit: 'contain',
              borderRadius: '2px',
            }}
          />
          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            <p style={{ color: '#C9A96E', fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              {current.category}
            </p>
            <p style={{ color: '#fff', fontFamily: 'var(--font-playfair)', fontSize: '16px', marginTop: '4px' }}>
              {current.title}
            </p>
          </div>
        </motion.div>

        {/* Next */}
        <button
          onClick={(e) => { e.stopPropagation(); setIndex((i) => (i < items.length - 1 ? i + 1 : 0)); }}
          style={{
            position: 'absolute',
            right: '16px',
            background: 'rgba(255,255,255,0.1)',
            border: 'none',
            borderRadius: '50%',
            width: '44px',
            height: '44px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#fff',
          }}
        >
          <ChevronRight size={22} />
        </button>

        {/* Counter */}
        <div
          style={{
            position: 'absolute',
            bottom: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            color: 'rgba(255,255,255,0.5)',
            fontSize: '12px',
          }}
        >
          {index + 1} / {items.length}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
