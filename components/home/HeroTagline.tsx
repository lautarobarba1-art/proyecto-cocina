"use client";

import * as React from "react";

import { WordSwap } from "@/components/animations/WordSwap";
import { Container } from "@/components/layout/Container";

export interface HeroTaglineProps {
  className?: string;
}

export function HeroTagline({ className }: HeroTaglineProps) {
  return (
    <section
      className={["border-b border-terracota/20 py-20 lg:py-28", className ?? ""].join(" ")}
      aria-label="Invitación"
    >
      <Container as="div">
        <p className="mx-auto max-w-[min(100%,42rem)] text-balance text-center font-display text-3xl font-normal tracking-tightish text-carbon sm:text-4xl md:text-5xl lg:text-6xl">
          Vení a{" "}
          <WordSwap words={["cocinar", "aprender", "compartir", "celebrar"] as const} />
        </p>
      </Container>
    </section>
  );
}

