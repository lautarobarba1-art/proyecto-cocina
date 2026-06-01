"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";

import { HomeMarquee } from "@/components/home/HomeMarquee";
import { Lookbook } from "@/components/home/Lookbook";
import { Container } from "@/components/layout/Container";
import { Reveal, RevealItem, RevealStagger } from "@/components/motion/Reveal";
import { Button } from "@/components/ui/Button";
import { IMAGES } from "@/lib/images";
import { REVEAL } from "@/lib/motion";

export interface ServicesIndexProps {
  className?: string;
}

const SERVICE_BLOCKS = [
  {
    num: "02",
    title: "Eventos privados",
    line: "Cenas, cumpleaños y encuentros a medida. Lo coordinamos con vos.",
    detail: "Respuesta en 24–48 hs · grupos chicos",
    href: "/contacto?tipo=eventos",
    cta: "Escribinos",
    image: IMAGES.services.eventos,
    imageAlt: "Copas y encuentro en Menesteres",
  },
  {
    num: "03",
    title: "Alquiler del espacio",
    line: "Para fotógrafos, talleres y pequeñas producciones.",
    detail: "Cocina equipada · luz natural",
    href: "/espacio",
    cta: "Conocer el espacio",
    image: IMAGES.services.espacio,
    imageAlt: "Interior del espacio Menesteres",
  },
] as const;

function HomeOpening() {
  return (
    <Container as="div" className="home-opening home-pad-x px-0! border-b border-carbon/10 bg-crema py-20 sm:py-24 lg:py-28">
      <RevealStagger>
        <RevealItem
          as="p"
          className="font-mono text-[0.65rem] font-medium uppercase tracking-hero text-terracota"
        >
          <span aria-hidden="true">— </span>En Menesteres
        </RevealItem>
        <RevealItem
          as="h2"
          id="home-opening-heading"
          className="mt-6 max-w-[min(100%,18ch)] font-display text-[clamp(2rem,5.5vw,3.5rem)] font-normal leading-[1.06] tracking-tightish text-carbon"
        >
          Cocinamos en grupo.{" "}
          <span className="block">
            Abrimos el espacio.{" "}
            <em className="italic text-terracota">Armamos encuentros.</em>
          </span>
        </RevealItem>
      </RevealStagger>
    </Container>
  );
}

function ClasesSplit() {
  return (
    <div className="home-clases border-b border-carbon/10 bg-crema-deep">
      <Container as="div" className="px-0 sm:px-6">
        <div className="grid min-h-[min(88vh,720px)] lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-stretch">
          <Reveal
            as="figure"
            variant="scaleIn"
            duration={REVEAL.durationImage}
            className="relative aspect-4/5 min-h-[280px] w-full overflow-hidden sm:aspect-5/6 lg:aspect-auto lg:min-h-0"
          >
            <Image
              src={IMAGES.services.clases}
              alt="Clase de cocina en grupo en Menesteres"
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 55vw"
              className="object-cover photo-editorial"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-linear-to-t from-carbon/25 via-transparent to-transparent lg:bg-linear-to-r lg:from-transparent lg:via-transparent lg:to-crema-deep/20"
            />
          </Reveal>

          <div className="relative flex flex-col justify-center px-8 py-14 sm:px-8 sm:py-16 lg:px-10 lg:py-16">
            <Reveal
              variant="fadeIn"
              duration={0.8}
              delay={0.15}
              className="pointer-events-none absolute right-4 top-8 select-none font-display text-[clamp(5rem,14vw,9rem)] font-normal italic leading-none text-terracota/10 lg:right-8 lg:top-10"
              aria-hidden="true"
            >
              C
            </Reveal>

            <RevealStagger className="relative z-10 ml-auto max-w-[min(100%,28rem)] text-right">
              <RevealItem
                as="p"
                variant="slideRight"
                className="font-mono text-[0.7rem] font-medium uppercase tracking-eyebrow text-terracota"
              >
                01 — Clases
              </RevealItem>
              <RevealItem
                as="h3"
                variant="slideRight"
                className="ml-auto mt-4 max-w-[14ch] text-balance font-display text-3xl font-normal leading-[1.05] tracking-tightish text-carbon sm:text-4xl lg:text-[2.75rem]"
              >
                Cocina en grupo
              </RevealItem>
              <RevealItem
                as="p"
                variant="slideRight"
                className="ml-auto mt-7 max-w-[44ch] font-body text-[1.02rem] leading-[1.75] text-carbon/75"
              >
                Talleres para adultos, propuestas para niños y fechas que se renuevan cada mes.
              </RevealItem>
              <RevealItem
                variant="fadeUp"
                className="mt-12 flex flex-wrap items-center justify-end gap-x-5 gap-y-4"
              >
                <Button href="/clases" variant="sketch" size="default">
                  Ver clases
                </Button>
                <Button href="/calendario" variant="sketch-ghost" size="default">
                  Ver calendario
                </Button>
              </RevealItem>
              <RevealItem
                as="nav"
                variant="fadeIn"
                className="mt-10 flex flex-wrap items-center justify-end gap-x-3 gap-y-2 font-mono text-[0.65rem] font-medium uppercase tracking-meta text-carbon/45"
                aria-label="Accesos rápidos a clases"
              >
                <Link href="/clases" className="transition-colors hover:text-terracota">
                  Adultos
                </Link>
                <span aria-hidden="true">·</span>
                <Link href="/clases" className="transition-colors hover:text-terracota">
                  Niños
                </Link>
                <span aria-hidden="true">·</span>
                <Link href="/calendario" className="transition-colors hover:text-terracota">
                  Calendario
                </Link>
              </RevealItem>
            </RevealStagger>
          </div>
        </div>
      </Container>
    </div>
  );
}

function ServiceMiniBlock({
  num,
  title,
  line,
  detail,
  href,
  cta,
  image,
  imageAlt,
  index,
}: (typeof SERVICE_BLOCKS)[number] & { index: number }) {
  return (
    <Reveal
      as="article"
      variant="scaleIn"
      delay={index * 0.12}
      hoverLift
      className="home-service-mini group flex h-full flex-col overflow-hidden border border-carbon/10 bg-crema-deep transition-colors duration-300 hover:bg-crema"
    >
      <Reveal
        as="figure"
        variant="fadeIn"
        duration={REVEAL.durationImage}
        delay={index * 0.12 + 0.08}
        margin="-5% 0px"
        className="relative aspect-16/10 w-full overflow-hidden"
      >
        <Image
          src={image}
          alt={imageAlt}
          fill
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-cover photo-editorial transition-transform duration-500 ease-snap group-hover:scale-[1.04]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-linear-to-t from-carbon/30 via-transparent to-transparent"
        />
      </Reveal>

      <RevealStagger className="flex flex-1 flex-col px-8 py-9 sm:px-9 sm:py-10">
        <RevealItem
          as="p"
          className="font-mono text-[0.65rem] font-medium uppercase tracking-eyebrow text-terracota"
        >
          {num}
        </RevealItem>
        <RevealItem
          as="h3"
          className="mt-3 max-w-[16ch] font-display text-2xl font-normal leading-[1.08] tracking-tightish text-carbon sm:text-[1.75rem]"
        >
          {title}
        </RevealItem>
        <RevealItem
          as="p"
          className="mt-4 max-w-[42ch] font-body text-[0.98rem] leading-[1.7] text-carbon/75"
        >
          {line}
        </RevealItem>
        <RevealItem
          as="p"
          variant="fadeIn"
          className="mt-3 font-mono text-[0.62rem] font-medium uppercase tracking-meta text-carbon/45"
        >
          {detail}
        </RevealItem>
        <RevealItem variant="fadeUp" className="mt-auto pt-8">
          <Button href={href} variant="sketch" size="default">
            {cta}
          </Button>
        </RevealItem>
      </RevealStagger>
    </Reveal>
  );
}

function ServicesSecondary() {
  return (
    <div className="home-services-secondary home-pad-x border-b border-carbon/10 bg-crema py-14 sm:py-16 lg:py-20">
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-2 lg:gap-6">
        {SERVICE_BLOCKS.map((block, index) => (
          <ServiceMiniBlock key={block.num} {...block} index={index} />
        ))}
      </div>
    </div>
  );
}

export function ServicesIndex({ className }: ServicesIndexProps) {
  return (
    <div className={className ?? ""}>
      <section aria-labelledby="home-opening-heading">
        <HomeOpening />
        <ClasesSplit />
        <ServicesSecondary />
      </section>
      <Lookbook />
      <HomeMarquee />
    </div>
  );
}
