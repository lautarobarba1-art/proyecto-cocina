import * as React from "react";

/**
 * Stamp — sello editorial circular del Design System Menesteres.
 *
 * Estructura del DS:
 *   <Stamp variant="orange">
 *     <span>SINCE</span>
 *     <Stamp.Main>2019</Stamp.Main>
 *     <span>RAFAELA SF</span>
 *   </Stamp>
 *
 * Especificación: 120×120, borde 2.5px currentColor, fontSize 9px / 700 /
 * tracking 0.18em / uppercase. La línea principal usa serif (Cinzel) 14px / 600.
 */

export type StampVariant = "orange" | "black" | "olive";

const VARIANT: Record<StampVariant, string> = {
  orange: "text-terracota",
  black: "text-carbon",
  olive: "text-oliva",
};

const BASE =
  "inline-flex h-[120px] w-[120px] flex-col items-center justify-center rounded-full border-[2.5px] border-current p-2.5 text-center font-sans text-[9px] font-bold uppercase leading-snug tracking-[0.18em]";

export interface StampProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  variant?: StampVariant;
  children: React.ReactNode;
}

interface StampMainProps {
  children: React.ReactNode;
  className?: string;
}

function StampMain({ children, className }: StampMainProps) {
  return (
    <span
      className={[
        "my-1 font-serif text-[14px] font-semibold tracking-widest",
        className ?? "",
      ].join(" ")}
    >
      {children}
    </span>
  );
}

export function Stamp({ variant = "orange", className, children, ...rest }: StampProps) {
  return (
    <div {...rest} className={[BASE, VARIANT[variant], className ?? ""].filter(Boolean).join(" ")}>
      {children}
    </div>
  );
}

Stamp.Main = StampMain;
