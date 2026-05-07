import Image from "next/image";
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
 * ClaseCard — fiel al design system Menesteres (v2).
 *
 * Patrón de navegación:
 *   - <Link> absoluto (inset-0, z-0) cubre toda la card para click en cualquier punto.
 *   - aria-hidden + tabIndex={-1}: invisible a SR y teclado (el Button CTA es el
 *     elemento de navegación accesible).
 *   - Image div y Body div: relative z-10 → siempre sobre el overlay.
 *   - Button CTA (ghost + arrow): único foco de teclado, tabIndex natural.
 *
 * CTA — variant="ghost":
 *   Correcto para este contexto. "ghost" es el patrón DS para links de
 *   descubrimiento/navegación dentro de una card. "primary" u "outline"
 *   compiten visualmente con los badges de estado. tracking-[0.15em] está
 *   en la variante ghost del Button (no override manual).
 *
 * soldOut:
 *   - Sin overlay Link → no navegable por click.
 *   - Sin Button CTA → no navegable por teclado.
 *   - cursor-not-allowed comunica el estado visualmente.
 *   - aria-label en el article para screen readers.
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

      {/* ── Imagen 5:3 — z-10 sobre el overlay Link ── */}
      <div className="relative z-10 aspect-5/3 overflow-hidden bg-crema-deep">
        <Image
          src={item.image.src}
          alt={item.image.alt}
          fill
          sizes={
            isFeatured
              ? "(max-width: 1023px) 100vw, 50vw"
              : "(max-width: 767px) 100vw, (max-width: 1023px) 50vw, 25vw"
          }
          className={[
            "object-cover transition-transform duration-600 ease-out",
            soldOut ? "grayscale-[0.45]" : "group-hover:scale-[1.04]",
          ].join(" ")}
        />

        {/* Tag categoría — top-left */}
        <div className="pointer-events-none absolute left-4 top-4 z-10">
          <Badge variant="orange">{item.category}</Badge>
        </div>

        {/* Estado: últimos cupos — top-right para no solapar categoría */}
        {lastSpots && (
          <div className="pointer-events-none absolute right-4 top-4 z-10">
            <Badge variant="orange-light">Últimos cupos</Badge>
          </div>
        )}

        {/* Estado: agotado — overlay centrado sobre imagen */}
        {soldOut && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-carbon/20">
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
