import * as React from "react";

/**
 * StatusBadge — pill de estado del panel admin.
 *
 * Consolida los distintos `statusClass`/`categoryBadgeClass` locales
 * (reservas, clases, inquiries, notificaciones) en un único mapeo de
 * tono semántico → clases, usando los tokens de marca en vez de
 * colores crudos de Tailwind.
 */

export type StatusTone =
  | "neutral"
  | "warning"
  | "success"
  | "danger"
  | "brand"
  | "olive";

export type StatusBadgeSize = "default" | "sm";

const TONE: Record<StatusTone, string> = {
  neutral: "bg-carbon/5 text-mute border-carbon/15",
  warning: "bg-terracota-soft/20 text-terracota-deep border-terracota-soft/50",
  success: "bg-exito-soft text-exito border-exito/30",
  danger: "bg-rojo/5 text-rojo border-rojo/30",
  brand: "bg-terracota/10 text-terracota border-terracota/30",
  olive: "bg-oliva/10 text-oliva border-oliva/30",
};

const SIZE: Record<StatusBadgeSize, string> = {
  default: "px-2 py-1 text-[0.72rem]",
  sm: "px-2 py-0.5 text-[0.68rem]",
};

export interface StatusBadgeProps {
  tone: StatusTone;
  size?: StatusBadgeSize;
  className?: string;
  children: React.ReactNode;
}

export function StatusBadge({
  tone,
  size = "default",
  className,
  children,
}: StatusBadgeProps) {
  return (
    <span
      className={[
        "inline-block rounded border font-medium uppercase tracking-wide",
        SIZE[size],
        TONE[tone],
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </span>
  );
}
