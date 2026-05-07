import Image from "next/image";
import Link from "next/link";

import { Container } from "@/components/layout/Container";
import { Marquee } from "@/components/home/Marquee";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { IMAGES } from "@/lib/images";

export interface ServicesIndexProps {
  className?: string;
}

export function ServicesIndex({ className }: ServicesIndexProps) {
  return (
    <section className={className ?? ""} aria-label="Servicios">
      <Container as="div" className="py-20 lg:py-28">
        <SectionLabel>LO QUE HACEMOS</SectionLabel>
      </Container>

      <div className="border-t border-terracota/25">
        <div className="grid min-w-0 grid-cols-1 items-stretch gap-0 md:grid-cols-2 md:gap-0">
          <Link
            href="/clases?cat=adultos"
            className="group relative block w-full min-w-0 overflow-hidden border-b border-carbon/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-terracota/50 md:border-r md:border-carbon/15 lg:border-b-0 lg:border-r"
          >
            <div className="relative aspect-4/5 w-full min-h-[240px] sm:min-h-[280px] md:aspect-16/10 md:min-h-[320px] lg:aspect-auto lg:min-h-[min(52vh,560px)]">
              <Image
                src={IMAGES.servicesAdultos.src}
                alt={IMAGES.servicesAdultos.alt}
                fill
                sizes="(max-width: 1023px) 100vw, 50vw"
                className="object-cover photo-editorial"
              />
            </div>
            <div
              className="pointer-events-none absolute inset-0 bg-linear-to-t from-carbon/85 via-carbon/35 to-transparent"
              aria-hidden="true"
            />
            <div className="absolute inset-x-0 bottom-0 z-10 px-6 py-10 lg:px-10 lg:py-12">
              <p className="font-mono text-[0.7rem] font-medium uppercase tracking-eyebrow text-crema-light/90">
                01 — Clases
              </p>
              <h2 className="mt-3 max-w-[min(100%,18ch)] text-balance font-display text-3xl font-normal leading-none tracking-tightish text-crema-light sm:text-4xl md:text-5xl lg:text-6xl">
                Clases para <em className="italic text-terracota-soft">adultos</em>
              </h2>
              <p className="mt-6 font-mono text-[0.7rem] font-medium uppercase tracking-eyebrow text-crema-light/80 transition-[letter-spacing] duration-300 ease-snap group-hover:tracking-meta">
                Ver entradas —→
              </p>
            </div>
          </Link>

          <Link
            href="/clases?cat=ninos"
            className="group relative block w-full min-w-0 overflow-hidden border-b border-carbon/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-terracota/50 md:border-b-0"
          >
            <div className="relative aspect-4/5 w-full min-h-[240px] sm:min-h-[280px] md:aspect-16/10 md:min-h-[320px] lg:aspect-auto lg:min-h-[min(52vh,560px)]">
              <Image
                src={IMAGES.servicesNinos.src}
                alt={IMAGES.servicesNinos.alt}
                fill
                sizes="(max-width: 1023px) 100vw, 50vw"
                className="object-cover photo-editorial"
              />
            </div>
            <div
              className="pointer-events-none absolute inset-0 bg-linear-to-t from-carbon/85 via-carbon/35 to-transparent"
              aria-hidden="true"
            />
            <div className="absolute inset-x-0 bottom-0 z-10 px-6 py-10 text-right lg:px-10 lg:py-12">
              <p className="font-mono text-[0.7rem] font-medium uppercase tracking-eyebrow text-crema-light/90">
                02 — Clases
              </p>
              <h2 className="mt-3 max-w-[min(100%,18ch)] text-balance font-display text-3xl font-normal leading-none tracking-tightish text-crema-light sm:text-4xl md:text-5xl lg:text-6xl">
                Clases para <em className="italic text-terracota-soft">niños</em>
              </h2>
              <p className="mt-6 font-mono text-[0.7rem] font-medium uppercase tracking-eyebrow text-crema-light/80 transition-[letter-spacing] duration-300 ease-snap group-hover:tracking-meta">
                ←— Ver entradas
              </p>
            </div>
          </Link>
        </div>
      </div>

      <Link
        href="/contacto?tipo=eventos"
        className="group block border-t border-carbon/15 bg-crema-deep px-6 py-20 transition-colors duration-300 ease-snap hover:bg-crema-deep/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-terracota/50 lg:px-12 lg:py-24"
      >
        <Container as="div">
          <div className="flex flex-col gap-10 sm:gap-12 md:flex-row md:items-start md:justify-between md:gap-x-10 md:gap-y-0 lg:gap-x-16 xl:gap-x-24">
            <div className="min-w-0 md:max-w-[58%]">
              <p className="font-mono text-[0.7rem] font-medium uppercase tracking-eyebrow text-terracota">
                03 — Encuentros
              </p>
              <h2 className="mt-4 max-w-[min(100%,20ch)] text-balance font-display text-3xl font-normal leading-[1.05] tracking-tightish text-carbon sm:text-4xl md:text-5xl lg:text-6xl">
                Eventos privados
              </h2>
              <p className="mt-8 max-w-[52ch] font-body text-[1.05rem] leading-[1.7] text-carbon/80">
                Cenas, cumpleaños y encuentros a medida. Lo coordinamos con vos.
              </p>
            </div>

            <div className="flex min-w-0 shrink-0 flex-col gap-8 md:max-w-[min(280px,38%)] md:gap-10 md:pt-2 lg:pt-12">
              <ul className="space-y-3" aria-label="Detalles">
                <li className="font-body text-[0.65rem] font-light uppercase leading-relaxed tracking-[0.2em] text-carbon/55">
                  Respuesta en 24–48 hs
                </li>
                <li className="font-body text-[0.65rem] font-light uppercase leading-relaxed tracking-[0.2em] text-carbon/55">
                  Para grupos chicos
                </li>
              </ul>
              <p className="font-mono text-[0.7rem] font-medium uppercase tracking-eyebrow text-carbon/75">
                Escribinos{" "}
                <span className="text-terracota transition-transform duration-300 ease-snap group-hover:translate-x-0.5">
                  —→
                </span>
              </p>
            </div>
          </div>
        </Container>
      </Link>

      <Marquee />

      <Link
        href="/espacio"
        className="group block border-t border-carbon/15 bg-crema-light px-6 py-20 transition-colors duration-300 ease-snap hover:bg-crema focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-terracota/50 lg:px-12 lg:py-24"
      >
        <Container as="div">
          <div className="flex flex-col gap-10 sm:gap-12 md:flex-row-reverse md:items-start md:justify-between md:gap-x-10 md:gap-y-0 lg:gap-x-16 xl:gap-x-24">
            <div className="min-w-0 md:max-w-[58%]">
              <p className="font-mono text-[0.7rem] font-medium uppercase tracking-eyebrow text-terracota">
                04 — Espacio
              </p>
              <h2 className="mt-4 max-w-[min(100%,22ch)] text-balance font-display text-3xl font-normal leading-[1.05] tracking-tightish text-carbon sm:text-4xl md:text-5xl lg:text-6xl">
                Alquiler del espacio
              </h2>
              <p className="mt-8 max-w-[52ch] font-body text-[1.05rem] leading-[1.7] text-carbon/80">
                Para fotógrafos, talleres y pequeñas producciones. Pedí disponibilidad.
              </p>
            </div>

            <div className="flex min-w-0 shrink-0 flex-col gap-8 md:max-w-[min(280px,38%)] md:gap-10 md:pt-2 lg:pt-12">
              <ul className="space-y-3" aria-label="Detalles del espacio">
                <li className="font-body text-[0.65rem] font-light uppercase leading-relaxed tracking-[0.2em] text-carbon/55">
                  Cocina equipada
                </li>
                <li className="font-body text-[0.65rem] font-light uppercase leading-relaxed tracking-[0.2em] text-carbon/55">
                  Luz natural
                </li>
              </ul>
              <p className="font-mono text-[0.7rem] font-medium uppercase tracking-eyebrow text-carbon/75">
                Conocer el espacio{" "}
                <span className="text-terracota transition-transform duration-300 ease-snap group-hover:translate-x-0.5">
                  —→
                </span>
              </p>
            </div>
          </div>
        </Container>
      </Link>
    </section>
  );
}
