"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { Link2, MessageCircle, Share2 } from "lucide-react";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import type { ClassEvent } from "@/lib/calendar/types";
import { formatPreviewDateLabel } from "@/lib/calendar/helpers";

function formatArs(value: number): string {
  if (value <= 0) return "Consultar";
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(value);
}

type StatusInfo = { label: string; variant: import("@/components/ui/Badge").BadgeVariant };

function statusBlock(event: ClassEvent): StatusInfo {
  if (event.status === "cancelled") return { label: "Cancelada", variant: "cream" };
  if (event.status === "full") return { label: "Lleno", variant: "cream" };
  if (event.status === "few-spots") return { label: "Pocos lugares", variant: "orange-light" };
  if (event.spotsLeft != null) return { label: `${event.spotsLeft} cupos`, variant: "orange" };
  return { label: "Cupos", variant: "orange" };
}

function titleWithAccent(title: string) {
  const parts = title.trim().split(/\s+/);
  if (parts.length <= 1) {
    return (
      <>
        <em className="not-italic text-terracota-soft">{title}</em>
      </>
    );
  }
  const last = parts.pop()!;
  const head = parts.join(" ");
  return (
    <>
      {head}{" "}
      <em className="italic text-terracota-soft">{last}</em>
    </>
  );
}

export interface ClassPreviewProps {
  event: ClassEvent;
  onClose: () => void;
}

export function ClassPreview({ event, onClose }: ClassPreviewProps) {
  const reduced = useReducedMotion();
  const pathname = usePathname();
  const [shareUrl, setShareUrl] = React.useState("");
  const status = statusBlock(event);
  const reserveHref = `/clases/${event.slug}?fecha=${encodeURIComponent(event.date)}`;
  const shareText = `${event.title} · ${event.date}`;

  React.useEffect(() => {
    setShareUrl(typeof window !== "undefined" ? window.location.href : "");
  }, [pathname, event.id]);

  const copyLink = React.useCallback(async () => {
    const target = shareUrl || (typeof window !== "undefined" ? window.location.href : "");
    try {
      await navigator.clipboard.writeText(target);
    } catch {
      /* noop */
    }
  }, [shareUrl]);

  const waHref =
    shareUrl.length > 0 ? `https://wa.me/?text=${encodeURIComponent(`${shareText}\n${shareUrl}`)}` : "#";

  return (
    <motion.div
      role="region"
      aria-live="polite"
      aria-label="Detalle de la clase"
      initial={reduced ? undefined : { opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="relative mt-8 rounded-sm bg-carbon p-8 text-crema md:p-10"
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-3 top-3 inline-flex min-h-[44px] min-w-[44px] items-center justify-center font-mono text-xl leading-none text-crema/50 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-crema/30"
        aria-label="Cerrar"
      >
        ×
      </button>

      <div className="grid gap-10 md:grid-cols-[1fr_360px] md:gap-12">
        <div className="min-w-0">
          <p className="font-mono text-[11px] font-medium uppercase tracking-meta text-crema/70">
            {formatPreviewDateLabel(event.date, event.startTime, event.endTime)}
          </p>
          <h2 className="mt-4 font-display text-[clamp(2rem,3.5vw,2.75rem)] font-normal leading-[1.05] text-crema">{titleWithAccent(event.title)}</h2>
          <p className="mt-6 max-w-[540px] font-display text-[1.05rem] font-normal leading-[1.7] text-crema/85">{event.shortDesc}</p>

          <div className="mt-10 grid gap-10 sm:grid-cols-2">
            <div>
              <p className="font-mono text-[10px] font-medium uppercase tracking-meta text-crema/55">Qué traer</p>
              <ul className="mt-3 space-y-2 font-display text-[0.95rem] leading-relaxed text-crema/85">
                <li className="relative pl-4 before:absolute before:left-0 before:top-[0.55em] before:block before:h-px before:w-2 before:bg-terracota-soft/80 before:content-['']">
                  Delantal cómodo y calzado cerrado.
                </li>
                <li className="relative pl-4 before:absolute before:left-0 before:top-[0.55em] before:block before:h-px before:w-2 before:bg-terracota-soft/80 before:content-['']">
                  Tupper chico por si sobra algo para llevar.
                </li>
                <li className="relative pl-4 before:absolute before:left-0 before:top-[0.55em] before:block before:h-px before:w-2 before:bg-terracota-soft/80 before:content-['']">
                  Ganas de mancharse las manos.
                </li>
              </ul>
            </div>
            <div>
              <p className="font-mono text-[10px] font-medium uppercase tracking-meta text-crema/55">Qué incluye</p>
              <ul className="mt-3 space-y-2 font-display text-[0.95rem] leading-relaxed text-crema/85">
                <li className="relative pl-4 before:absolute before:left-0 before:top-[0.55em] before:block before:h-px before:w-2 before:bg-terracota-soft/80 before:content-['']">
                  Insumos medidos para la clase.
                </li>
                <li className="relative pl-4 before:absolute before:left-0 before:top-[0.55em] before:block before:h-px before:w-2 before:bg-terracota-soft/80 before:content-['']">
                  Vajilla, delantales y bebida sin alcohol.
                </li>
                <li className="relative pl-4 before:absolute before:left-0 before:top-[0.55em] before:block before:h-px before:w-2 before:bg-terracota-soft/80 before:content-['']">
                  Recetas impresas para repetir en casa.
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6 border-t border-crema/10 pt-8 md:border-t-0 md:border-l md:pl-10 md:pt-0">
          <div>
            <Badge variant={status.variant}>{status.label}</Badge>
          </div>
          <p className="font-display text-[2rem] font-normal italic text-terracota-soft">{formatArs(event.price)}</p>
          <div>
            <p className="font-mono text-[10px] font-medium uppercase tracking-meta text-crema/55">Incluye también</p>
            <ul className="mt-2 space-y-1 font-display text-[0.95rem] text-crema/80">
              <li>Insumos de la cartilla del día</li>
              <li>Vajilla y servilleta</li>
              <li>Agua saborizada</li>
            </ul>
          </div>
          {event.status !== "cancelled" && event.status !== "full" ? (
            <Button href={reserveHref} variant="primary" className="w-full">
              Reservar mi lugar
            </Button>
          ) : event.status === "cancelled" ? (
            <p className="font-display text-[1rem] italic text-crema/70">Esta fecha fue cancelada. Mirá el calendario para nuevas fechas.</p>
          ) : null}

          <div className="mt-2 flex flex-wrap items-center gap-4 border-t border-crema/10 pt-6 font-mono text-[10px] uppercase tracking-meta text-crema/55">
            <span className="flex items-center gap-1.5">
              <Share2 className="h-3.5 w-3.5" aria-hidden="true" />
              Compartir
            </span>
            <a
              href={waHref}
              target="_blank"
              rel="noreferrer"
              className={[
                "flex items-center gap-1.5 text-crema/70 transition-colors hover:text-terracota-soft",
                shareUrl.length === 0 ? "pointer-events-none opacity-40" : "",
              ].join(" ")}
              aria-disabled={shareUrl.length === 0}
            >
              <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
              WhatsApp
            </a>
            <button type="button" onClick={copyLink} className="flex items-center gap-1.5 text-crema/70 transition-colors hover:text-terracota-soft">
              <Link2 className="h-3.5 w-3.5" aria-hidden="true" />
              Copiar enlace
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
