"use client";

import * as React from "react";

import { Hero } from "@/components/home/Hero";
import { Lookbook } from "@/components/home/Lookbook";
import { ServicesIndex } from "@/components/home/ServicesIndex";
import { SplashIntro } from "@/components/home/SplashIntro";
import { useReducedMotion } from "@/lib/useReducedMotion";

export function HomePageShell() {
  const reduced = useReducedMotion();
  const [splashDone, setSplashDone] = React.useState(false);

  React.useLayoutEffect(() => {
    if (reduced) {
      setSplashDone(true);
    }
  }, [reduced]);

  const showSplash = !reduced && !splashDone;

  return (
    <>
      {showSplash ? <SplashIntro onComplete={() => setSplashDone(true)} /> : null}
      <main className="flex-1">
        <Hero introReveal={splashDone} staggerProfile={reduced ? "default" : "afterSplash"} />
        <ServicesIndex />
        <Lookbook />
      </main>
    </>
  );
}
