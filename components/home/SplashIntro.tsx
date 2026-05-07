"use client";

import * as React from "react";
import { motion } from "framer-motion";

import { Logotype } from "@/components/brand/Logotype";
import { EASE, SPLASH_INTRO } from "@/lib/motion";
import { useReducedMotion } from "@/lib/useReducedMotion";

export interface SplashIntroProps {
  onComplete: () => void;
}

export function SplashIntro({ onComplete }: SplashIntroProps) {
  const reduced = useReducedMotion();
  const finishedRef = React.useRef(false);

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

  React.useEffect(() => {
    if (reduced) return;
    const ms = (SPLASH_INTRO.curtainDelay + SPLASH_INTRO.curtainDuration) * 1000 + 120;
    const id = window.setTimeout(finish, ms);
    return () => window.clearTimeout(id);
  }, [reduced, finish]);

  if (reduced) {
    return null;
  }

  return (
    <motion.div
      className="fixed inset-0 z-200 flex items-center justify-center bg-terracota"
      aria-hidden="true"
      initial={{ y: 0 }}
      animate={{ y: "-100%" }}
      transition={{
        delay: SPLASH_INTRO.curtainDelay,
        duration: SPLASH_INTRO.curtainDuration,
        ease: EASE.soft,
      }}
    >
      <motion.div
        className="flex justify-center px-6"
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
