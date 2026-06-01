"use client";

import { motion, useReducedMotion } from "framer-motion";

const STROKE = {
  cap: "round" as const,
  join: "round" as const,
};

const DRAW_EASE = [0.22, 1, 0.36, 1] as const;

type SketchStroke = {
  d: string;
  opacity: number;
  strokeWidth: number;
  delay: number;
};

const OVAL_STROKES: SketchStroke[] = [
  {
    d: `M 21 31
        C 14 22, 16 11, 38 7
        C 62 3, 108 2, 152 5
        C 188 8, 214 14, 220 24
        C 226 34, 212 44, 168 48
        C 118 52, 58 49, 32 42
        C 22 38, 18 34, 21 31`,
    opacity: 0.95,
    strokeWidth: 1.15,
    delay: 0,
  },
  {
    d: `M 15 28
        C 10 18, 12 8, 34 5
        C 68 1, 118 0, 162 4
        C 198 7, 222 16, 224 27
        C 226 38, 206 47, 158 50
        C 102 53, 46 48, 26 40
        C 16 35, 12 32, 15 28`,
    opacity: 0.72,
    strokeWidth: 1.05,
    delay: 0.16,
  },
  {
    d: `M 44 8
        Q 78 3, 118 4
        Q 158 5, 192 11
        Q 208 15, 214 22`,
    opacity: 0.58,
    strokeWidth: 1,
    delay: 0.3,
  },
  {
    d: `M 178 47
        Q 200 49, 216 42
        Q 222 36, 218 30`,
    opacity: 0.5,
    strokeWidth: 0.95,
    delay: 0.42,
  },
];

const ARROW_STROKES: SketchStroke[] = [
  {
    d: `M 2.5 8.4
        L 19 8.2
        M 15.8 4.2
        L 21.5 8.1
        L 15.6 11.8`,
    opacity: 0.9,
    strokeWidth: 1.15,
    delay: 0.08,
  },
  {
    d: `M 2 8.8
        L 18.2 8.5
        M 15.2 4.8
        L 20.8 8.6
        L 15 12.2`,
    opacity: 0.55,
    strokeWidth: 0.9,
    delay: 0.2,
  },
];

function AnimatedStroke({
  d,
  opacity,
  strokeWidth,
  delay,
  reduced,
}: SketchStroke & { reduced: boolean }) {
  return (
    <motion.path
      d={d}
      pathLength={1}
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap={STROKE.cap}
      strokeLinejoin={STROKE.join}
      vectorEffect="non-scaling-stroke"
      fill="none"
      className="sketch-stroke"
      initial={
        reduced
          ? { pathLength: 1, opacity }
          : { pathLength: 0, opacity: 0 }
      }
      animate={{ pathLength: 1, opacity }}
      transition={{
        pathLength: {
          duration: reduced ? 0 : 0.58,
          delay: reduced ? 0 : delay,
          ease: DRAW_EASE,
        },
        opacity: {
          duration: reduced ? 0 : 0.22,
          delay: reduced ? 0 : delay * 0.6,
        },
      }}
    />
  );
}

/**
 * Óvalo tipo marcador — trazos superpuestos con animación de dibujo.
 */
export function SketchOval({ className }: { className?: string }) {
  const reduced = useReducedMotion();

  return (
    <motion.svg
      aria-hidden="true"
      viewBox="0 0 240 58"
      preserveAspectRatio="none"
      className={["sketch-oval-wrap", className].filter(Boolean).join(" ")}
      fill="none"
      initial={false}
    >
      {OVAL_STROKES.map((stroke, index) => (
        <AnimatedStroke
          key={index}
          {...stroke}
          reduced={reduced ?? false}
        />
      ))}
    </motion.svg>
  );
}

/** Flecha sketch — dibujo rápido al aparecer. */
export function SketchArrow({ className }: { className?: string }) {
  const reduced = useReducedMotion();

  return (
    <motion.svg
      aria-hidden="true"
      viewBox="0 0 28 16"
      className={["sketch-arrow-wrap", className].filter(Boolean).join(" ")}
      fill="none"
      initial={false}
    >
      {ARROW_STROKES.map((stroke, index) => (
        <AnimatedStroke
          key={index}
          {...stroke}
          reduced={reduced ?? false}
        />
      ))}
    </motion.svg>
  );
}
