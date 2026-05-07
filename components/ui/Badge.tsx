import * as React from "react";

/**
 * Badge — pill editorial del Design System Menesteres.
 *
 * Variantes (manual oficial):
 *  - orange       → "Reservas abiertas"
 *  - orange-light → "Pocos cupos"
 *  - cream        → "Próximamente" (sobre fondos cálidos)
 *  - black        → "Agotado"
 *  - olive        → "Eventos"
 *  - outline      → "Niños" (pill transparente con borde carbon)
 *
 * Especificación: 11px / 700 / tracking 0.12em / uppercase / radius pill.
 */

export type BadgeVariant =
  | "orange"
  | "orange-light"
  | "cream"
  | "black"
  | "olive"
  | "outline";

const BASE =
  "inline-flex items-center gap-2 rounded-pill px-3.5 py-1.5 font-sans text-[11px] font-bold uppercase tracking-caps leading-none";

const VARIANT: Record<BadgeVariant, string> = {
  orange: "bg-terracota text-crema",
  "orange-light": "bg-terracota-soft text-carbon",
  cream: "bg-crema-deep text-marron border border-line",
  black: "bg-carbon text-crema",
  olive: "bg-oliva text-crema",
  outline: "bg-transparent text-carbon border-[1.5px] border-carbon",
};

export interface BadgeProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, "children"> {
  variant?: BadgeVariant;
  children: React.ReactNode;
}

export function Badge({ variant = "orange", className, children, ...rest }: BadgeProps) {
  return (
    <span {...rest} className={[BASE, VARIANT[variant], className ?? ""].filter(Boolean).join(" ")}>
      {children}
    </span>
  );
}
