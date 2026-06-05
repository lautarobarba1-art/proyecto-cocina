import Image from "next/image";

import { Reveal, RevealItem, RevealStagger } from "@/components/motion/Reveal";
import { Button } from "@/components/ui/Button";

export function HomeCTAFinal() {
  return (
    <section
      className="home-pad-x relative overflow-hidden bg-terracota py-24 sm:py-28 lg:py-32"
      aria-labelledby="home-cta-final-heading"
    >
      {/* Patrón de marca de fondo */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 select-none"
        style={{
          backgroundImage: "url('/patrones/carpeta-patrones/Mesa%20de%20trabajo%2012.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          opacity: 0.1,
          mixBlendMode: "multiply" as const,
        }}
      />

      {/* Tomate — elemento de marca, lado izquierdo */}
      <Image
        src="/brand-elements/menesteres-elements/tomate-menesteres.svg"
        alt=""
        aria-hidden="true"
        width={240}
        height={240}
        className="pointer-events-none select-none absolute left-4 top-1/2 -translate-y-1/2 w-16 h-16 -rotate-6 opacity-[0.20] hidden sm:block sm:w-20 sm:h-20 lg:left-12 lg:w-24 lg:h-24"
        style={{ filter: "brightness(0) invert(1)" }}
      />

      {/* Olla — elemento de marca, lado derecho */}
      <Image
        src="/brand-elements/menesteres-elements/olla-menesteres.svg"
        alt=""
        aria-hidden="true"
        width={240}
        height={240}
        className="pointer-events-none select-none absolute right-4 top-1/2 -translate-y-1/2 w-16 h-16 rotate-12 opacity-[0.18] hidden sm:block sm:w-20 sm:h-20 lg:right-12 lg:w-24 lg:h-24"
        style={{ filter: "brightness(0) invert(1)" }}
      />

      {/* Contenido central */}
      <div className="relative mx-auto max-w-2xl text-center">
        <RevealStagger>
          <RevealItem
            as="p"
            className="font-mono text-[0.65rem] font-medium uppercase tracking-eyebrow text-crema/60"
          >
            <span aria-hidden="true">✦ </span>Menesteres
          </RevealItem>

          <RevealItem
            as="h2"
            id="home-cta-final-heading"
            className="mt-5 font-display text-[clamp(1.75rem,5vw,3.5rem)] font-normal leading-[1.08] tracking-tightish text-crema"
          >
            ¿Nos encontramos en la próxima mesa?
          </RevealItem>

          <RevealItem
            as="p"
            className="mt-5 font-body text-[1rem] leading-[1.72] text-crema/70"
          >
            Reservá tu lugar en la próxima clase. Los cupos son limitados.
          </RevealItem>

          <RevealItem variant="fadeUp" className="mt-10">
            <Button href="/clases" variant="outline-cream" size="lg">
              Ver próximas clases
            </Button>
          </RevealItem>
        </RevealStagger>
      </div>
    </section>
  );
}
