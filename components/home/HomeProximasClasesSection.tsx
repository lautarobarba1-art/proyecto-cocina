import Image from "next/image";
import Link from "next/link";

import { MenesteresLineSeparator } from "@/components/brand/MenesteresLineSeparator";
import { ProximasClases } from "@/components/home/ProximasClases";
import { Reveal, RevealItem, RevealStagger } from "@/components/motion/Reveal";
import { Button } from "@/components/ui/Button";

export function HomeProximasClasesSection() {
  return (
    <section
      className="home-pad-x overflow-x-clip border-b border-carbon/10 bg-crema py-20 sm:py-24 lg:py-28"
      aria-labelledby="home-proximas-heading"
    >
      <div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-[1fr_1.15fr] lg:gap-16 lg:items-start">

        {/* Columna izquierda: texto editorial */}
        <div className="relative order-1 lg:col-start-1 lg:row-start-1">
          {/* Batidor — acento gastronómico flotante */}
          <Image
            src="/brand-elements/menesteres-elements/batidor-menesteres.svg"
            alt=""
            aria-hidden="true"
            width={240}
            height={240}
            className="pointer-events-none select-none absolute -top-2 right-0 w-[72px] h-[72px] -rotate-12 opacity-[0.13] lg:w-20 lg:h-20"
          />

          <RevealStagger>
            <RevealItem
              as="p"
              className="font-mono text-[0.65rem] font-medium uppercase tracking-eyebrow text-terracota"
            >
              <span aria-hidden="true">— </span>Próximas clases
            </RevealItem>

            <RevealItem
              as="h2"
              id="home-proximas-heading"
              className="mt-5 max-w-[12ch] font-display text-[clamp(1.85rem,4.5vw,3.25rem)] font-normal leading-[1.05] tracking-tightish text-carbon"
            >
              ¿Cuándo nos juntamos?
            </RevealItem>

            <RevealItem
              as="p"
              className="mt-5 max-w-[38ch] font-body text-[1rem] leading-[1.78] text-carbon/68"
            >
              Grupos chicos, ambiente cálido y fechas que se renuevan cada mes. Para adultos y niños.
            </RevealItem>
          </RevealStagger>
        </div>

        {/* Columna derecha: lista de clases */}
        <Reveal variant="fadeUp" delay={0.14} className="order-4 lg:order-0 lg:col-start-2 lg:row-start-1">
          <div className="relative overflow-hidden rounded-sm border border-carbon/8 bg-crema-deep px-6 py-7 sm:px-8 sm:py-9">
            {/* Patrón sutil en esquina */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute right-0 top-0 h-32 w-32 select-none opacity-[0.07]"
              style={{
                backgroundImage: "url('/patrones/carpeta-patrones/Mesa%20de%20trabajo%2014.png')",
                backgroundSize: "cover",
                backgroundPosition: "right top",
              }}
            />
            <ProximasClases />
            <div className="mt-8 border-t border-carbon/10 pt-6">
              <Button href="/clases" variant="sketch" size="default">
                Reservar una clase
              </Button>
            </div>
          </div>
        </Reveal>

        {/* Separador a ancho de página — debajo del bloque texto + card en desktop */}
        <div className="order-2 col-span-full lg:row-start-2">
          <MenesteresLineSeparator className="mt-8 mb-2" />
        </div>

        <div className="order-3 lg:col-start-1 lg:row-start-3">
          <Link
            href="/clases"
            className="inline-block font-mono text-[0.68rem] font-medium uppercase tracking-eyebrow text-carbon/45 transition-colors hover:text-terracota"
          >
            Ver calendario completo →
          </Link>
        </div>
      </div>
    </section>
  );
}
