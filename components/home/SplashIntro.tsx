"use client";

import * as React from "react";
import { motion } from "framer-motion";

import { Logotype } from "@/components/brand/Logotype";
import { EASE, SPLASH_INTRO } from "@/lib/motion";
import { useReducedMotion } from "@/lib/useReducedMotion";

export interface SplashIntroProps {
  onComplete: () => void;
  videoReady: boolean;
}

export function SplashIntro({ onComplete, videoReady }: SplashIntroProps) {
  const reduced = useReducedMotion();
  const finishedRef = React.useRef(false);
  const curtainStartedRef = React.useRef(false);
  // True once the minimum logo display time has elapsed
  const [logoHeld, setLogoHeld] = React.useState(false);

  const finish = React.useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    onComplete();
  }, [onComplete]);

  React.useLayoutEffect(() => {
    if (reduced) {
      finish();
    }
  }, [reduced, finish]);

  React.useEffect(() => {
    if (reduced) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [reduced]);

  // Minimum logo hold time — the curtain won't lift before this
  React.useEffect(() => {
    if (reduced) return;
    const id = window.setTimeout(() => setLogoHeld(true), SPLASH_INTRO.curtainDelay * 1000);
    return () => window.clearTimeout(id);
  }, [reduced]);

  // Curtain lifts only when logo has been shown long enough AND video is ready
  const curtainGo = logoHeld && videoReady;

  React.useEffect(() => {
    if (curtainGo) curtainStartedRef.current = true;
  }, [curtainGo]);

  if (reduced) {
    return null;
  }

  return (
    <motion.div
      className="fixed inset-0 z-200 flex items-center justify-center bg-terracota overflow-hidden"
      aria-hidden="true"
      initial={{ y: 0 }}
      animate={curtainGo ? { y: "-100%" } : { y: 0 }}
      transition={
        curtainGo
          ? { duration: SPLASH_INTRO.curtainDuration, ease: EASE.soft }
          : { duration: 0 }
      }
      onAnimationComplete={() => {
        if (curtainStartedRef.current) finish();
      }}
    >
      
      {/* Logo — encima del patrón */}
      <motion.div
        className="relative z-10 flex justify-center px-6"
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{
          duration: SPLASH_INTRO.logoDuration,
          ease: EASE.soft,
        }}
      >
        <h1 className="hero-mn__title select-none">
          <Logotype variant="onDark" size="xl" priority />
        </h1>
      </motion.div>
    </motion.div>
  );
}
