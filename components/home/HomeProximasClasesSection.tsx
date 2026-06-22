import Image from "next/image";
import Link from "next/link";

import { HomeProximasHeading } from "@/components/home/HomeProximasHeading";
import { ProximasClases } from "@/components/home/ProximasClases";
import { Reveal, RevealItem, RevealStagger } from "@/components/motion/Reveal";
import { Button } from "@/components/ui/Button";

export function HomeProximasClasesSection() {
  return (
    <section
      className="home-pad-x overflow-x-clip border-b border-carbon/10 bg-crema py-20 sm:py-24 lg:py-28"
      aria-labelledby="home-proximas-heading"
    >
      <div className="mx-auto grid min-w-0 max-w-7xl gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-16 lg:items-start">

        {/* Columna izquierda: texto editorial */}
        <div className="relative order-1 min-w-0 lg:col-start-1 lg:row-start-1">

          <RevealStagger>
            {/* Columna derecha: lista de clases */}
        <Reveal
          variant="fadeUp"
          delay={0.14}
          className="order-4 min-w-0 lg:order-0 lg:col-start-2 lg:row-start-1"
        >
          <div className="relative min-w-0 overflow-hidden rounded-sm border border-carbon/8 bg-crema-deep px-6 py-7 sm:px-8 sm:py-9">
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
            <HomeProximasHeading />
            <ProximasClases />
            <div className="mt-8 border-t border-carbon/10 pt-6">
              <Button href="/clases" variant="sketch" size="default">
                Reservar una clase
              </Button>
            </div>
          </div>
        </Reveal>

            <RevealItem
              as="p"
              className="mt-5 max-w-[38ch] font-body text-[1rem] leading-[1.78] text-carbon/68"
            >
              Grupos chicos, ambiente cálido y fechas que se renuevan cada mes. Para adultos y niños.
            </RevealItem>
          </RevealStagger>
        </div>

        <div className="order-3 min-w-0 lg:col-start-1 lg:row-start-2">
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
