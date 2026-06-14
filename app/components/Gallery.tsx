"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { portfolioItems, PortfolioItem, Category } from "@/lib/data";

type FilterCategory = "Semua" | Category;

const CATEGORIES: { value: FilterCategory; label: string }[] = [
  { value: "Semua", label: "Semua" },
  { value: "Prewedding", label: "Prewedding" },
  { value: "Akad", label: "Akad" },
  { value: "Resepsi", label: "Resepsi" },
  { value: "Engagement", label: "Engagement" },
];

type Props = {
  limit?: number;
  showFilter?: boolean;
};

export default function Gallery({ limit, showFilter = true }: Props) {
  const [active, setActive] = useState<FilterCategory>("Semua");
  const [lightbox, setLightbox] = useState<PortfolioItem | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const filtered =
    active === "Semua"
      ? portfolioItems
      : portfolioItems.filter((i) => i.category === active);

  const displayed = limit ? filtered.slice(0, limit) : filtered;

  const openLightbox = (item: PortfolioItem) => {
    const idx = filtered.findIndex((i) => i.id === item.id);
    setLightboxIndex(idx);
    setLightbox(item);
  };

  const closeLightbox = () => setLightbox(null);

  const prev = useCallback(() => {
    const newIdx = (lightboxIndex - 1 + filtered.length) % filtered.length;
    setLightboxIndex(newIdx);
    setLightbox(filtered[newIdx]);
  }, [lightboxIndex, filtered]);

  const next = useCallback(() => {
    const newIdx = (lightboxIndex + 1) % filtered.length;
    setLightboxIndex(newIdx);
    setLightbox(filtered[newIdx]);
  }, [lightboxIndex, filtered]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!lightbox) return;
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [lightbox, prev, next]);

  useEffect(() => {
    document.body.style.overflow = lightbox ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [lightbox]);

  return (
    <>
      {showFilter && (
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "8px", marginBottom: "40px" }}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setActive(cat.value)}
              style={{
                padding: "8px 20px",
                fontSize: "14px",
                fontWeight: 500,
                letterSpacing: "0.03em",
                border: "1px solid",
                borderColor: active === cat.value ? "#C9A96E" : "#D4C9BC",
                background: active === cat.value ? "#C9A96E" : "transparent",
                color: active === cat.value ? "#fff" : "#1C1C1C",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>
      )}

      <div style={{ columns: "2 300px", gap: "16px" }}>
        {displayed.map((item) => (
          <div
            key={item.id}
            onClick={() => openLightbox(item)}
            style={{
              breakInside: "avoid",
              marginBottom: "16px",
              cursor: "pointer",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <Image
              src={item.imageUrl}
              alt={item.title}
              width={item.width}
              height={item.height}
              style={{ width: "100%", height: "auto", display: "block", transition: "transform 0.4s ease" }}
              loading="lazy"
              onMouseEnter={(e) => { (e.currentTarget as HTMLImageElement).style.transform = "scale(1.03)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLImageElement).style.transform = "scale(1)"; }}
            />
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          onClick={closeLightbox}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            background: "rgba(0,0,0,0.92)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
        >
          <button
            onClick={closeLightbox}
            style={{
              position: "absolute", top: "20px", right: "20px",
              background: "none", border: "none", color: "#fff",
              fontSize: "36px", cursor: "pointer", lineHeight: 1,
            }}
          >
            ×
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); prev(); }}
            style={{
              position: "absolute", left: "16px",
              background: "none", border: "none", color: "#fff",
              fontSize: "40px", cursor: "pointer", padding: "8px 16px",
            }}
          >
            ‹
          </button>
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "900px", width: "100%", textAlign: "center" }}
          >
            <Image
              src={lightbox.imageUrl}
              alt={lightbox.title}
              width={lightbox.width}
              height={lightbox.height}
              style={{ maxHeight: "80vh", width: "auto", maxWidth: "100%", margin: "0 auto", display: "block" }}
              priority
            />
            <p style={{ color: "#C9A96E", marginTop: "16px", fontSize: "14px" }}>{lightbox.title}</p>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); next(); }}
            style={{
              position: "absolute", right: "16px",
              background: "none", border: "none", color: "#fff",
              fontSize: "40px", cursor: "pointer", padding: "8px 16px",
            }}
          >
            ›
          </button>
        </div>
      )}
    </>
  );
}
