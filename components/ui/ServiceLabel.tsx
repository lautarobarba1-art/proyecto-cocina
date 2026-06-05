import * as React from "react";
import { SERVICE_COLORS, type ServiceType } from "@/lib/brand";

export interface ServiceLabelProps {
  service: ServiceType;
  text?: string;
  className?: string;
}

// Dot is cream when used on the orange (clases) background; orange otherwise.
const DOT_COLOR: Record<ServiceType, string> = {
  clases: SERVICE_COLORS.clases.text,
  eventos: SERVICE_COLORS.clases.bg,
  alquiler: SERVICE_COLORS.clases.bg,
};

export function ServiceLabel({ service, text, className }: ServiceLabelProps) {
  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 font-serif tracking-[0.1em] uppercase",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={{ fontSize: "var(--text-label)" }}
    >
      <span aria-hidden="true" style={{ color: DOT_COLOR[service] }}>
        ●
      </span>
      {text ?? SERVICE_COLORS[service].label}
    </span>
  );
}
