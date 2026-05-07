import * as React from "react";
import Image from "next/image";

/**
 * Logotype — wordmark oficial Menesteres.
 *
 * Decisión del manual: el logo usa la tipografía Nersans Two (paga, sin
 * licencia web). Por eso siempre se renderiza como imagen, nunca como CSS.
 *
 * Variantes:
 *   - default → wordmark con colores originales (sobre fondos claros)
 *   - onDark  → invertido a crema (sobre hero / footer / navbar oscuro)
 *
 * Tamaños (ratio aproximado del asset 1-Logo.webp):
 *   xs → 96px   (navbar)
 *   sm → 140px  (cards / inline)
 *   md → 200px  (footer)
 *   lg → 320px  (hero mobile)
 *   xl → 460px  (hero desktop / splash)
 */

export type LogotypeVariant = "default" | "onDark";
export type LogotypeSize = "xs" | "sm" | "md" | "lg" | "xl";

const SIZE: Record<LogotypeSize, { width: number; height: number; widthClass: string }> = {
  xs: { width: 192, height: 64, widthClass: "w-24" },
  sm: { width: 280, height: 96, widthClass: "w-[140px]" },
  md: { width: 400, height: 136, widthClass: "w-[200px]" },
  lg: { width: 640, height: 220, widthClass: "w-[260px] sm:w-[320px]" },
  xl: { width: 920, height: 320, widthClass: "w-[280px] sm:w-[380px] md:w-[460px]" },
};

export interface LogotypeProps {
  className?: string;
  variant?: LogotypeVariant;
  size?: LogotypeSize;
  /** Sólo para el primer LCP candidate (hero / splash). */
  priority?: boolean;
}

export function Logotype({
  className,
  variant = "default",
  size = "sm",
  priority,
}: LogotypeProps) {
  const s = SIZE[size];
  const filterClass = variant === "onDark" ? "logotype--on-dark" : "";

  return (
    <Image
      src="/imagenes/1-Logo.webp"
      alt="Menesteres"
      width={s.width}
      height={s.height}
      priority={priority}
      className={["block h-auto select-none", s.widthClass, filterClass, className ?? ""]
        .filter(Boolean)
        .join(" ")}
    />
  );
}
