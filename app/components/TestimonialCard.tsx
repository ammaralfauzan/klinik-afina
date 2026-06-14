'use client';

import { motion } from 'framer-motion';
import { Testimonial } from '@/lib/data';

interface TestimonialCardProps {
  testimonial: Testimonial;
  index: number;
}

export default function TestimonialCard({ testimonial, index }: TestimonialCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      style={{
        background: '#FDFCF8',
        padding: '36px',
        borderRadius: '2px',
        position: 'relative',
      }}
    >
      {/* Quote mark */}
      <div
        style={{
          fontFamily: 'var(--font-playfair)',
          fontSize: '64px',
          color: '#C9A96E',
          lineHeight: 1,
          marginBottom: '16px',
          opacity: 0.4,
        }}
      >
        &ldquo;
      </div>
      <p
        style={{
          fontSize: '15px',
          lineHeight: 1.8,
          color: '#3a3a3a',
          marginBottom: '24px',
          fontStyle: 'italic',
        }}
      >
        {testimonial.content}
      </p>
      <div>
        <p style={{ fontWeight: 700, color: '#1C1C1C', fontSize: '14px', marginBottom: '2px' }}>
          {testimonial.name}
        </p>
        <p style={{ fontSize: '12px', color: '#C9A96E', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          {testimonial.eventType} · {testimonial.location}
        </p>
      </div>
    </motion.div>
  );
}
