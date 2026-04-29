"use client";

import * as React from "react";

import { Container } from "@/components/layout/Container";
import { useReducedMotion } from "@/lib/useReducedMotion";

export interface MarqueeProps {
  className?: string;
}

const PHRASE = "sabores que nos encuentran ✦ desde 2019 ✦ en rafaela ✦ cocinar juntos";

export function Marquee({ className }: MarqueeProps) {
  const reduced = useReducedMotion();

  return (
    <section
      className={[
        "border-y border-terracota-deep/40 bg-terracota py-4 sm:py-5 lg:py-6",
        className ?? "",
      ].join(" ")}
      aria-label="Marquee"
    >
      <Container as="div">
        <p
          className={[
            "mb-2 text-center font-script text-[1.5rem] leading-none text-crema-light sm:text-[1.65rem] lg:text-[1.75rem]",
            reduced ? "" : "script-wiggle",
          ].join(" ")}
          aria-hidden="true"
        >
          sabores
        </p>
        <div className="overflow-hidden">
          {reduced ? (
            <p className="font-mono text-[0.7rem] font-medium uppercase tracking-meta text-crema-light/95 sm:text-[0.75rem]">
              {PHRASE}
            </p>
          ) : (
            <div className="marquee">
              <p className="marquee-track font-mono text-[0.7rem] font-medium uppercase tracking-meta text-crema-light/95 sm:text-[0.75rem]">
                <span className="mr-12">{PHRASE}</span>
                <span className="mr-12">{PHRASE}</span>
                <span className="mr-12">{PHRASE}</span>
              </p>
            </div>
          )}
        </div>
      </Container>
    </section>
  );
}
