"use client";

import * as React from "react";

import { Reveal } from "@/components/motion/Reveal";
import { siteContact } from "@/lib/site/contact";
import { useReducedMotion } from "@/lib/useReducedMotion";

export interface HomeMarqueeProps {
  className?: string;
}

const PHRASE = [
  "sabores que nos encuentran",
  "clases de cocina",
  "eventos privados",
  "alquiler del espacio",
  `desde 2019 · ${siteContact.address.locality.toLowerCase()}`,
  "Malvinas Argentinas 1150",
  "Rafaela, Santa Fe, Argentina",
].join(" ✦ ");

/** Marquee en loop — cierre de la home antes del footer. */
export function HomeMarquee({ className }: HomeMarqueeProps) {
  const reduced = useReducedMotion();

  return (
    <section
      className={[
        "home-marquee border-t border-terracota-deep/35 bg-terracota py-5 sm:py-6",
        className ?? "",
      ].join(" ")}
      aria-label="Menesteres en movimiento"
    >
      <Reveal
        as="p"
        variant="fadeUp"
        className={[
          "home-marquee__script mb-3 text-center font-serif text-[1.35rem] leading-none text-crema-light sm:text-[1.5rem]",
          reduced ? "" : "script-wiggle",
        ].join(" ")}
        aria-hidden="true"
      >
        menesteres
      </Reveal>

      <div className="marquee" aria-hidden={!reduced}>
        {reduced ? (
          <p className="home-pad-x text-center font-mono text-[0.68rem] font-medium uppercase tracking-meta text-crema-light/95">
            {PHRASE}
          </p>
        ) : (
          <p className="marquee-track font-mono text-[0.68rem] font-medium uppercase tracking-meta text-crema-light/95 sm:text-[0.72rem]">
            <span className="mr-14">{PHRASE}</span>
            <span className="mr-14">{PHRASE}</span>
            <span className="mr-14">{PHRASE}</span>
          </p>
        )}
      </div>

      {reduced ? null : (
        <p className="sr-only">{PHRASE}</p>
      )}
    </section>
  );
}
