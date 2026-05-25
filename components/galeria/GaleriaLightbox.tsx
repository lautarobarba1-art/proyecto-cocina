"use client";

import * as React from "react";
import Image from "next/image";
import type { GaleriaItem } from "@/lib/galeria";

interface GaleriaLightboxProps {
  items: readonly GaleriaItem[];
  initialIndex: number;
  onClose: () => void;
}

export function GaleriaLightbox({
  items,
  initialIndex,
  onClose,
}: GaleriaLightboxProps) {
  const [index, setIndex] = React.useState(initialIndex);
  const item = items[index]!;

  const prev = () => setIndex((i) => (i - 1 + items.length) % items.length);
  const next = () => setIndex((i) => (i + 1) % items.length);

  // Cerrar con Escape, navegar con flechas
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Bloquear scroll del body mientras está abierto
  React.useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={item.alt}
      className="fixed inset-0 z-9999 flex items-center justify-center bg-carbon/92 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Contenedor del media — detiene el click para no cerrar */}
      <div
        className="relative flex h-full w-full max-h-[90vh] max-w-5xl items-center justify-center px-16"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Media */}
        <div className="relative h-full w-full">
          {item.type === "video" ? (
            <video
              key={item.id}
              className="h-full w-full object-contain"
              src={item.src}
              controls
              autoPlay
              loop
              muted
              aria-label={item.alt}
            />
          ) : (
            <Image
              key={item.id}
              src={item.src}
              alt={item.alt}
              fill
              sizes="90vw"
              className="object-contain"
              priority
            />
          )}
        </div>

        {/* Caption */}
        {item.alt && (
          <p className="absolute bottom-4 left-0 right-0 text-center font-mono text-[0.65rem] uppercase tracking-meta text-crema-light/70">
            {item.alt}
          </p>
        )}
      </div>

      {/* Botón prev */}
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); prev(); }}
        className="absolute left-4 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-carbon/60 text-crema-light hover:bg-carbon/80"
        aria-label="Anterior"
      >
        ←
      </button>

      {/* Botón next */}
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); next(); }}
        className="absolute right-4 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-carbon/60 text-crema-light hover:bg-carbon/80"
        aria-label="Siguiente"
      >
        →
      </button>

      {/* Botón cerrar */}
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-carbon/60 text-crema-light hover:bg-carbon/80"
        aria-label="Cerrar galería"
      >
        ✕
      </button>

      {/* Indicador de posición */}
      <p className="absolute bottom-4 right-4 font-mono text-[0.65rem] text-crema-light/40">
        {index + 1} / {items.length}
      </p>
    </div>
  );
}