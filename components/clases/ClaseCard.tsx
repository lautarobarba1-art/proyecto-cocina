import Link from "next/link";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import type { ClassMock } from "@/lib/classes-mock";

export interface ClaseCardProps {
  item: ClassMock;
  isFeatured?: boolean;
  className?: string;
}

/**
 * ClaseCard — text-forward, sin imagen (v3).
 *
 * Header band: fondo crema-deep con letra decorativa (primera letra del título)
 * como textura tipográfica. No requiere ninguna foto, cero mantenimiento visual.
 *
 * Patrón de navegación:
 *   - <Link> absoluto (inset-0, z-0) cubre toda la card.
 *   - Button CTA (ghost + arrow): único foco de teclado accesible.
 *
 * soldOut:
 *   - Sin overlay Link ni Button CTA.
 *   - cursor-not-allowed + aria-label para screen readers.
 */
export function ClaseCard({ item, isFeatured, className }: ClaseCardProps) {
  const soldOut = item.status === "agotado";
  const lastSpots = item.status === "últimos cupos";

  return (
    <article
      aria-label={soldOut ? `${item.title} — sin cupos` : item.title}
      className={[
        // Posicionamiento relativo requerido por el overlay Link (absolute inset-0)
        "relative group flex h-full flex-col overflow-hidden rounded-md bg-crema",
        "shadow-brand-sm",
        "transition-all duration-400 ease-out",
        soldOut
          ? "cursor-not-allowed opacity-90"
          : "hover:translate-y-[-6px] hover:shadow-brand-lg",
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {/*
        Overlay Link — cubre toda la card para click en cualquier punto.
        z-0: debajo de imagen y body (ambos z-10).
        aria-hidden + tabIndex={-1}: el Button CTA es el foco accesible.
        Solo presente cuando la clase tiene cupos.
      */}
      {!soldOut && (
        <Link
          href={`/clases/${item.slug}`}
          className="absolute inset-0 z-0"
          tabIndex={-1}
          aria-hidden="true"
        />
      )}

      {/* ── Header band — reemplaza la imagen ── */}
      <div
        className={[
          "relative z-10 flex h-32 items-end overflow-hidden p-4",
          soldOut ? "bg-crema-deep/60" : "bg-crema-deep",
        ].join(" ")}
      >
        {/* Letra decorativa — textura tipográfica sin foto */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 select-none font-display text-[7rem] font-normal italic leading-none text-terracota/10"
        >
          {item.title.charAt(0)}
        </span>

        {/* Tag categoría — bottom-left */}
        <div className="pointer-events-none relative z-10">
          <Badge variant="orange">{item.category}</Badge>
        </div>

        {/* Estado: últimos cupos — top-right */}
        {lastSpots && (
          <div className="pointer-events-none absolute right-4 top-4 z-10">
            <Badge variant="orange-light">Últimos cupos</Badge>
          </div>
        )}

        {/* Estado: agotado — overlay centrado */}
        {soldOut && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-carbon/10">
            <Badge variant="black">Agotado</Badge>
          </div>
        )}
      </div>

      {/* ── Body — z-10 sobre el overlay Link ── */}
      <div className="relative z-10 flex flex-1 flex-col gap-3 p-8">

        {/* Meta: duración — 11px / 700 / tracking 0.2em / uppercase / mute */}
        <p className="font-sans text-[11px] font-bold uppercase tracking-meta text-mute">
          {item.duration}
        </p>

        {/* Título: 1.5rem / 700 / lh 1.15 / tracking -0.015em / uppercase / carbon */}
        <h3
          className={[
            "font-sans font-bold uppercase leading-[1.15] tracking-tightish text-carbon",
            isFeatured ? "text-2xl sm:text-3xl" : "text-[1.5rem]",
          ].join(" ")}
        >
          {item.title}
        </h3>

        {/* Descripción: 14px / mute / lh 1.6 / clamp-2 */}
        <p className="line-clamp-2 text-[14px] leading-[1.6] text-mute">
          {item.description}
        </p>

        {/* ── Footer ── */}
        <div className="mt-auto flex items-end justify-between gap-3 border-t border-line pt-4">

          {/* Precio */}
          <div>
            <span className="mb-[2px] block font-sans text-[11px] font-bold uppercase tracking-meta text-mute">
              Inversión
            </span>
            <span className="font-sans text-[1.4rem] font-extrabold leading-none text-carbon">
              {item.price}
            </span>
          </div>

          {/*
            CTA — ghost + arrow:
            Variante correcta para discovery/nav dentro de card.
            tracking-[0.15em] viene del VARIANT ghost en Button.tsx (sin override).
            El Button es el único elemento interactivo accesible de la card.
          */}
          {soldOut ? (
            <span className="font-sans text-[11px] font-bold uppercase tracking-[0.15em] text-carbon/40">
              Sin cupos
            </span>
          ) : (
            <Button
              href={`/clases/${item.slug}`}
              variant="ghost"
              size="sm"
              withArrow={true}
            >
              Reservar
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}
