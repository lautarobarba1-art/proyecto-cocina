import { type ReactNode } from "react";

import Image from "next/image";
import Link from "next/link";

import { Reveal, RevealItem, RevealStagger } from "@/components/motion/Reveal";
import { BrandDivider } from "@/components/ui/BrandDivider";

/* ── Bloque de servicio ──────────────────────────────────────────────────── */

interface FormaProps {
  num: string;
  icon: ReactNode;
  title: string;
  text: string;
  href: string;
  cta: string;
  delay?: number;
  hasBorderRight?: boolean;
}

function FormaBlock({ num, icon, title, text, href, cta, delay = 0, hasBorderRight = false }: FormaProps) {
  return (
    <RevealStagger
      delayChildren={delay}
      className={[
        "group flex flex-col gap-5 px-0 py-10 sm:py-12 lg:px-10 lg:py-14",
        hasBorderRight ? "lg:border-r lg:border-carbon/10" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {/* Ícono de marca */}
      <RevealItem variant="fadeIn">
        {icon}
      </RevealItem>

      {/* Número */}
      <RevealItem
        as="p"
        className="font-mono text-[0.62rem] font-medium uppercase tracking-eyebrow text-carbon/35"
      >
        {num}
      </RevealItem>

      {/* Título */}
      <RevealItem
        as="h3"
        className="max-w-[14ch] font-display text-[1.45rem] font-normal leading-[1.1] tracking-tightish text-carbon sm:text-[1.6rem]"
      >
        {title}
      </RevealItem>

      {/* Separador artesanal */}
      <BrandDivider variant="trama" className="w-[80px]" color="rgba(214,82,38,0.22)" />

      {/* Descripción */}
      <RevealItem
        as="p"
        className="max-w-[38ch] font-body text-[0.95rem] leading-[1.78] text-carbon/65"
      >
        {text}
      </RevealItem>

      {/* CTA link */}
      <RevealItem className="mt-auto">
        <Link
          href={href}
          className="mt-1 inline-flex items-center gap-2 font-mono text-[0.68rem] font-medium uppercase tracking-eyebrow text-terracota transition-all hover:gap-3 hover:text-terracota-deep"
        >
          {cta}
          <span aria-hidden="true">→</span>
        </Link>
      </RevealItem>
    </RevealStagger>
  );
}

/* ── Sección principal ───────────────────────────────────────────────────── */

export function HomeTresFormasSection() {
  return (
    <section
      id="servicios"
      className="home-pad-x relative overflow-x-clip border-b border-carbon/10 bg-crema-deep py-16 sm:py-20"
      aria-labelledby="home-tres-formas-heading"
    >
      {/* Textura de patrón de fondo — sutil, no invasiva */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 select-none"
        style={{
          backgroundImage: "url('/patrones/carpeta-patrones/Mesa%20de%20trabajo%209.png')",
          backgroundSize: "480px",
          backgroundRepeat: "repeat",
          opacity: 0.04,
        }}
      />

      <div className="relative mx-auto max-w-7xl">

        {/* Encabezado editorial */}
        <RevealStagger className="mb-2">
          <RevealItem
            as="p"
            className="font-mono text-[0.65rem] font-medium uppercase tracking-eyebrow text-terracota"
          >
            <span aria-hidden="true">— </span>Tres formas de vivirlo
          </RevealItem>

          <RevealItem
            as="h2"
            id="home-tres-formas-heading"
            className="mt-5 max-w-[22ch] font-display text-[clamp(1.7rem,4vw,2.9rem)] font-normal leading-[1.07] tracking-tightish text-carbon"
          >
            Todo lo que podemos{" "}
            <em className="italic text-terracota">compartir.</em>
          </RevealItem>
        </RevealStagger>

        {/* Grid de tres formas */}
        <Reveal variant="fadeIn" duration={0.1}>
          <div className="mt-6 grid gap-x-0 gap-y-2 sm:grid-cols-1 lg:grid-cols-3">

            <FormaBlock
              num="01"
              icon={
                <Image
                  src="/brand-elements/menesteres-elements/batidor-menesteres.svg"
                  alt=""
                  aria-hidden="true"
                  width={240}
                  height={240}
                  className="w-12 h-12 pointer-events-none select-none opacity-40"
                />
              }
              title="Clases de cocina"
              text="Talleres para adultos y niños. Grupos chicos, fechas que se renuevan cada mes y aprendizaje real."
              href="/clases"
              cta="Ver clases"
              delay={0}
              hasBorderRight
            />

            {/* Separador horizontal en mobile */}
            <div className="border-t border-carbon/8 lg:hidden" />

            <FormaBlock
              num="02"
              icon={
                <Image
                  src="/brand-elements/menesteres-elements/copa-brindis-menesteres.svg"
                  alt=""
                  aria-hidden="true"
                  width={240}
                  height={240}
                  className="w-12 h-12 pointer-events-none select-none opacity-40"
                />
              }
              title="Eventos privados"
              text="Cenas, cumpleaños y encuentros a medida. Lo coordinamos con vos, respuesta en 24–48 hs."
              href="/contacto?tipo=evento"
              cta="Consultar"
              delay={0.06}
              hasBorderRight
            />

            {/* Separador horizontal en mobile */}
            <div className="border-t border-carbon/8 lg:hidden" />

            <FormaBlock
              num="03"
              icon={
                <Image
                  src="/brand-elements/menesteres-elements/cuchillo-chef-menesteres.svg"
                  alt=""
                  aria-hidden="true"
                  width={240}
                  height={240}
                  className="w-12 h-12 pointer-events-none select-none opacity-40"
                />
              }
              title="Alquiler del espacio"
              text="Para fotógrafos, talleristas y pequeñas producciones. Cocina equipada, luz natural, ambiente único."
              href="/espacio"
              cta="Conocer el espacio"
              delay={0.12}
            />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
