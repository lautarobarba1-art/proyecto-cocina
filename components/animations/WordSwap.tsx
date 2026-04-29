"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";

import { DURATION, EASE } from "@/lib/motion";
import { useReducedMotion } from "@/lib/useReducedMotion";

export interface WordSwapProps {
  words: readonly string[];
  intervalMs?: number;
  className?: string;
}

export function WordSwap({ words, intervalMs = 8000, className }: WordSwapProps) {
  const reduced = useReducedMotion();
  const [index, setIndex] = React.useState<number>(0);

  React.useEffect(() => {
    if (reduced) return;
    if (words.length <= 1) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % words.length);
    }, intervalMs);
    return () => {
      window.clearInterval(id);
    };
  }, [intervalMs, reduced, words.length]);

  const word = words[index] ?? "";

  return (
    <span className={["relative inline-flex h-[1.2em] overflow-hidden align-baseline", className ?? ""].join(" ")}>
      {reduced ? (
        <span className="italic text-terracota">{words[0] ?? ""}</span>
      ) : (
        <AnimatePresence mode="popLayout">
          <motion.span
            key={word}
            initial={{ y: "110%", opacity: 0 }}
            animate={{ y: "0%", opacity: 1 }}
            exit={{ y: "-110%", opacity: 0 }}
            transition={{ duration: DURATION.editorial, ease: EASE.soft }}
            className="italic text-terracota"
          >
            {word}
          </motion.span>
        </AnimatePresence>
      )}
    </span>
  );
}

