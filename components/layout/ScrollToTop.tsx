"use client";

import * as React from "react";
import { ChevronUp } from "lucide-react";

import { useReducedMotion } from "@/lib/useReducedMotion";

const SHOW_AFTER_PX = 320;

export function ScrollToTop() {
  const reduced = useReducedMotion();
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > SHOW_AFTER_PX);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const goTop = React.useCallback(() => {
    window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
  }, [reduced]);

  return (
    <button
      type="button"
      onClick={goTop}
      aria-label="Volver al inicio de la página"
      title="Volver arriba"
      className={[
        "fixed bottom-[max(1.25rem,env(safe-area-inset-bottom,0px))] right-[max(1.25rem,env(safe-area-inset-right,0px))] z-40",
        "flex h-12 w-12 items-center justify-center rounded-full border border-terracota/45 bg-crema-light/95 text-terracota shadow-(--mn-shadow-deep) backdrop-blur-sm transition-[opacity,transform,background-color,color,border-color] duration-300 ease-snap",
        "hover:border-terracota hover:bg-terracota hover:text-crema-light",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracota/45 focus-visible:ring-offset-2 focus-visible:ring-offset-crema",
        visible ? "pointer-events-auto translate-y-0 opacity-100" : "pointer-events-none translate-y-2 opacity-0",
      ].join(" ")}
      tabIndex={visible ? 0 : -1}
    >
      <ChevronUp className="h-6 w-6" aria-hidden="true" strokeWidth={1.75} />
    </button>
  );
}
