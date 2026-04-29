import * as React from "react";

export type LogotypeVariant = "default" | "onDark";

export interface LogotypeProps {
  className?: string;
  variant?: LogotypeVariant;
}

const ROOT_BY_VARIANT: Record<LogotypeVariant, string> = {
  default: "font-display font-normal tracking-hero text-carbon",
  onDark: "font-display font-normal tracking-editorial text-crema",
};

const EM_BY_VARIANT: Record<LogotypeVariant, string> = {
  default: "italic font-normal text-terracota",
  onDark: "italic font-normal text-terracota-soft",
};

export function Logotype({ className, variant = "default" }: LogotypeProps) {
  return (
    <span
      className={[ROOT_BY_VARIANT[variant], className ?? ""].join(" ")}
      aria-label="Menesteres"
    >
      MENE
      <em className={EM_BY_VARIANT[variant]}>STE</em>
      RES
    </span>
  );
}
