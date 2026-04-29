"use client";

import * as React from "react";
import { motion, useInView } from "framer-motion";

import { MagnetLink } from "@/components/ui/MagnetLink";
import { openLetter } from "@/lib/content/nosotros";
import { useReducedMotion } from "@/lib/useReducedMotion";

function TypewriterPhrase({
  text,
  active,
  reduced,
  onComplete,
}: {
  text: string;
  active: boolean;
  reduced: boolean;
  onComplete?: () => void;
}) {
  const [len, setLen] = React.useState(() => (reduced ? text.length : 0));
  const reported = React.useRef(false);

  React.useEffect(() => {
    if (reduced) {
      setLen(text.length);
      return;
    }
    if (!active) {
      setLen(0);
      reported.current = false;
      return;
    }
    let i = 0;
    let tid: number | undefined;
    const step = () => {
      i += 1;
      const next = Math.min(i, text.length);
      setLen(next);
      if (next < text.length) tid = window.setTimeout(step, 72 + Math.round(Math.random() * 40)) as unknown as number;
    };
    tid = window.setTimeout(step, 120) as unknown as number;
    return () => {
      if (tid !== undefined) window.clearTimeout(tid);
    };
  }, [active, reduced, text]);

  React.useEffect(() => {
    if (!onComplete || reported.current) return;
    if (len >= text.length && (active || reduced)) {
      reported.current = true;
      onComplete();
    }
  }, [len, text.length, active, reduced, onComplete]);

  return <span aria-hidden="true">{text.slice(0, len)}</span>;
}

export function OpenLetter() {
  const reduced = useReducedMotion();
  const rootRef = React.useRef<HTMLElement | null>(null);
  const inView = useInView(rootRef, { once: true, margin: "0px 0px -12% 0px" });
  const [bodiesVisible, setBodiesVisible] = React.useState(reduced);
  const [closeActive, setCloseActive] = React.useState(reduced);

  const onOpenComplete = React.useCallback(() => {
    setBodiesVisible(true);
    window.setTimeout(() => setCloseActive(true), 420);
  }, []);

  const srFull = `${openLetter.scriptOpen} ${openLetter.body1} ${openLetter.body2} ${openLetter.scriptClose}`;

  return (
    <section
      ref={rootRef}
      className="bg-terracota px-8 py-24 text-crema lg:px-10 lg:py-28"
      aria-labelledby="open-letter-dash-label"
    >
      <p className="sr-only">{srFull}</p>
      <div className="mx-auto max-w-[720px]">
        <p
          id="open-letter-dash-label"
          className="font-mono text-[10px] font-medium uppercase tracking-eyebrow text-crema/70"
        >
          06 — CARTA ABIERTA
        </p>

        <motion.div
          initial={reduced ? false : { opacity: 0, y: 16 }}
          animate={inView || reduced ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
          transition={{ duration: 0.55 }}
        >
          <p className="font-script text-[clamp(1.5rem,3vw,1.75rem)] leading-[1.4] text-crema">
            <TypewriterPhrase
              text={openLetter.scriptOpen}
              active={inView}
              reduced={reduced}
              onComplete={onOpenComplete}
            />
          </p>

          <motion.p
            className="mt-8 font-display text-[19px] leading-[1.65] text-crema"
            initial={false}
            animate={bodiesVisible ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.45 }}
          >
            {openLetter.body1}
          </motion.p>
          <motion.p
            className="mt-5 font-display text-[19px] leading-[1.65] text-crema"
            initial={false}
            animate={bodiesVisible ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.45, delay: 0.08 }}
          >
            {openLetter.body2}
          </motion.p>

          <p className="mb-14 mt-8 inline-block -rotate-1 font-script text-[clamp(1.5rem,3vw,1.75rem)] leading-[1.4] text-crema">
            <TypewriterPhrase text={openLetter.scriptClose} active={closeActive} reduced={reduced} />
          </p>

          <div className="flex flex-wrap items-end justify-between gap-6 border-t border-crema/30 pt-6">
            <MagnetLink
              href="/clases"
              className="font-mono text-[10px] font-medium uppercase tracking-meta text-crema/70"
            >
              RESERVÁ TU LUGAR <span aria-hidden="true">→</span>
            </MagnetLink>
            <p className="font-display text-[14px] italic text-crema/85">— Menesteres, abril 2026</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
