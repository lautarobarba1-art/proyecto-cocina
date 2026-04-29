"use client";

import nextDynamic from "next/dynamic";

import type { CalendarioPageClientProps } from "@/components/calendario/CalendarioPageClient";

const CalendarioPageClient = nextDynamic(
  () => import("@/components/calendario/CalendarioPageClient").then((mod) => ({ default: mod.CalendarioPageClient })),
  { ssr: false, loading: () => <div className="min-h-[45vh] bg-crema" role="status" aria-live="polite" /> },
);

export function CalendarioPageGate(props: CalendarioPageClientProps) {
  return <CalendarioPageClient {...props} />;
}
