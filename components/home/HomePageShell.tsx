"use client";

import * as React from "react";

import { Hero } from "@/components/home/Hero";
import { ServicesIndex } from "@/components/home/ServicesIndex";
import { SplashIntro } from "@/components/home/SplashIntro";
import { useReducedMotion } from "@/lib/useReducedMotion";

// Maximum time to wait for the video before forcing the intro to end
const VIDEO_FALLBACK_MS = 8000;

export function HomePageShell() {
  const reduced = useReducedMotion();
  const [splashDone, setSplashDone] = React.useState(false);
  const [videoReady, setVideoReady] = React.useState(false);

  React.useLayoutEffect(() => {
    if (reduced) setSplashDone(true);
  }, [reduced]);

  // Safety net: if canplay never fires (slow network, error), unblock after fallback
  React.useEffect(() => {
    if (reduced) return;
    const id = window.setTimeout(() => setVideoReady(true), VIDEO_FALLBACK_MS);
    return () => window.clearTimeout(id);
  }, [reduced]);

  const showSplash = !reduced && !splashDone;

  return (
    <>
      {showSplash ? (
        <SplashIntro
          onComplete={() => setSplashDone(true)}
          videoReady={videoReady}
        />
      ) : null}
      <main className="flex-1">
        <Hero
          introReveal={splashDone}
          staggerProfile={reduced ? "default" : "afterSplash"}
          onVideoReady={() => setVideoReady(true)}
        />
        <ServicesIndex />
      </main>
    </>
  );
}
