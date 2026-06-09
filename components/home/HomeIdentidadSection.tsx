import Image from "next/image";

import { Reveal, RevealItem, RevealStagger } from "@/components/motion/Reveal";
import { BrandDivider } from "@/components/ui/BrandDivider";
import { Button } from "@/components/ui/Button";
import { FILOSOFIA_COPY } from "@/data/home";
import { REVEAL } from "@/lib/motion";

export function HomeIdentidadSection() {
  return (
    <section
      id="sobre"
      className="overflow-x-clip border-b border-terracota/15 bg-carbon"
      aria-labelledby="home-identidad-heading"
    >
      <div className="grid lg:grid-cols-2 lg:min-h-[640px]">

        {/* Lado imagen */}
        <Reveal
          as="figure"
          variant="scaleIn"
          duration={REVEAL.durationImage}
          className="relative aspect-4/3 w-full overflow-hidden lg:aspect-auto"
        >
          <Image
            src="/imagenes/imagen-c1.jpeg"
            alt="Clase de cocina en grupo en Menesteres"
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover photo-editorial"
          />
          {/* Patrón de marca superpuesto */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 select-none"
            style={{
              backgroundImage: "url('/patrones/carpeta-patrones/Mesa%20de%20trabajo%2013.png')",
              backgroundSize: "cover",
              backgroundPosition: "center",
              opacity: 0.06,
              mixBlendMode: "screen" as const,
            }}
          />
          {/* Degradado hacia el lado de texto en desktop */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-linear-to-b from-transparent to-carbon/25 lg:bg-linear-to-r lg:from-transparent lg:to-carbon/40"
          />
        </Reveal>

        {/* Lado texto */}
        <div className="relative flex flex-col justify-center px-8 py-16 sm:px-10 sm:py-20 lg:px-12 lg:py-20">
          {/* Patrón decorativo en esquina superior derecha */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute right-0 top-0 h-48 w-48 select-none opacity-[0.045]"
            style={{
              backgroundImage: "url('/patrones/carpeta-patrones/Mesa%20de%20trabajo%2012.png')",
              backgroundSize: "cover",
              backgroundPosition: "right top",
            }}
          />

          {/* Hoja de laurel — acento botánico, esquina inferior */}
          <Image
            src="/brand-elements/menesteres-elements/hoja-laurel-menesteres.svg"
            alt=""
            aria-hidden="true"
            width={240}
            height={240}
            className="pointer-events-none select-none absolute bottom-8 right-6 w-16 h-16 rotate-20 opacity-[0.09] lg:w-20 lg:h-20 lg:bottom-12 lg:right-10"
            style={{ filter: "brightness(0) invert(1)" }}
          />

          <RevealStagger className="relative z-10 max-w-[min(100%,32rem)]">
            <RevealItem
              as="p"
              className="font-mono text-[0.65rem] font-medium uppercase tracking-eyebrow text-terracota"
            >
              <span aria-hidden="true">— </span>En Menesteres
            </RevealItem>

            <RevealItem
              as="h2"
              id="home-identidad-heading"
              className="mt-5 max-w-[12ch] font-display text-[clamp(2.25rem,5vw,4rem)] font-normal leading-[1.02] tracking-tightish text-crema"
            >
              Más que cocina.
            </RevealItem>

            <RevealItem
              as="p"
              className="mt-3 font-serif text-[1.05rem] font-medium italic leading-[1.55] tracking-editorial text-terracota-soft"
            >
              Una forma de estar juntos.
            </RevealItem>

            <div className="my-7">
              <BrandDivider variant="trama" className="w-[110px]" color="rgba(255,250,243,0.18)" />
            </div>

            <RevealItem
              as="p"
              className="max-w-[44ch] font-body text-[0.96rem] leading-[1.82] text-crema/62"
            >
              En Menesteres creemos que la cocina no es trabajo: es una manera de dar amor. Un espacio donde cocinar sea encuentro, celebración y emoción compartida. Porque una mesa no es solo un lugar donde se come: es donde se une la familia, se abrazan amigos y se construyen recuerdos.
            </RevealItem>

            <RevealItem className="mt-5">
              <p className="font-mono text-[0.63rem] font-medium uppercase tracking-meta text-crema/30">
                {FILOSOFIA_COPY.cierre}
              </p>
            </RevealItem>

            <RevealItem variant="fadeUp" className="mt-9">
              <Button href="/nosotros" variant="outline-cream" size="default">
                Conocer Menesteres
              </Button>
            </RevealItem>
          </RevealStagger>
        </div>
      </div>
    </section>
  );
}
