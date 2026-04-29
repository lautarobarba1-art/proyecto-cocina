import Image from "next/image";
import Link from "next/link";

import type { ClassMock } from "@/lib/classes-mock";

export interface ClaseCardProps {
  item: ClassMock;
  isFeatured?: boolean;
  className?: string;
}

export function ClaseCard({ item, isFeatured, className }: ClaseCardProps) {
  const soldOut = item.status === "agotado";
  const lastSpots = item.status === "últimos cupos";

  return (
    <Link
      href={`/clases/${item.slug}`}
      className={[
        "group flex h-full flex-col overflow-hidden border border-carbon/10 bg-crema-light shadow-[var(--mn-shadow-deep)] transition-[box-shadow,opacity] duration-500 ease-snap hover:shadow-lg",
        "aspect-[4/5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracota/40 focus-visible:ring-offset-2 focus-visible:ring-offset-crema",
        soldOut ? "opacity-[0.92]" : "",
        className ?? "",
      ].join(" ")}
    >
      <div className="relative min-h-0 flex-[7] overflow-hidden bg-carbon-soft/20">
        <Image
          src={item.image.src}
          alt={item.image.alt}
          fill
          sizes={isFeatured ? "(max-width: 1023px) 100vw, 50vw" : "(max-width: 1023px) 100vw, 25vw"}
          className={[
            "object-cover transition-transform duration-700 ease-soft",
            soldOut ? "grayscale-[0.35]" : "group-hover:scale-105",
          ].join(" ")}
        />
        {lastSpots ? (
          <div className="pointer-events-none absolute left-4 top-4 z-10">
            <span className="inline-block border border-crema-light/50 bg-carbon/75 px-2.5 py-1 font-mono text-[0.6rem] font-medium uppercase tracking-[0.18em] text-crema-light backdrop-blur-[2px]">
              Últimos cupos
            </span>
          </div>
        ) : null}
        {soldOut ? (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-carbon/25">
            <span className="border border-crema-light/40 bg-carbon/80 px-3 py-1.5 font-mono text-[0.6rem] font-medium uppercase tracking-[0.2em] text-crema-light">
              Agotado
            </span>
          </div>
        ) : null}
      </div>

      <div className="flex min-h-0 flex-[3] flex-col justify-between gap-3 px-5 pb-5 pt-4">
        <div>
          <p className="font-mono text-[0.65rem] font-medium uppercase tracking-eyebrow text-terracota">
            {item.category}
          </p>
          <h3
            className={[
              "mt-2 max-w-full text-balance font-display font-normal leading-[1.08] tracking-tightish text-carbon transition-colors duration-300 ease-snap group-hover:text-terracota-deep",
              isFeatured
                ? "text-xl sm:text-2xl md:text-3xl lg:text-[clamp(1.35rem,2.2vw,1.85rem)]"
                : "text-lg sm:text-xl md:text-2xl lg:text-[clamp(1.15rem,1.8vw,1.45rem)]",
            ].join(" ")}
          >
            {item.title}
          </h3>
          <p className="mt-2 line-clamp-2 font-body text-[0.8rem] leading-relaxed text-carbon/65">
            {item.description}
          </p>
        </div>

        <div className="flex flex-wrap items-end justify-between gap-3 border-t border-carbon/10 pt-3">
          <p className="font-body text-[0.72rem] font-normal uppercase tracking-[0.14em] text-carbon/55">
            <span>{item.duration}</span>
            <span className="mx-2 text-carbon/25">·</span>
            <span>{item.price}</span>
          </p>
          {soldOut ? (
            <span className="font-mono text-[0.65rem] font-medium uppercase tracking-eyebrow text-carbon/45">
              Sin cupos
            </span>
          ) : (
            <span className="font-mono text-[0.65rem] font-medium uppercase tracking-eyebrow text-carbon/80 underline decoration-transparent decoration-1 underline-offset-4 transition-[text-decoration-color,color] duration-300 ease-snap group-hover:text-terracota group-hover:decoration-terracota">
              Reservar lugar{" "}
              <span className="inline-block transition-transform duration-300 ease-snap group-hover:translate-x-0.5">
                →
              </span>
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
