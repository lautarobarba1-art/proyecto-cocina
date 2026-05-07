import * as React from "react";

/**
 * Tagline — slogan editorial "sabores que nos encuentran".
 *
 * Especificación del DS:
 *   font-family: Cinzel (sustituto web de Copperplate)
 *   font-size:   1.25rem
 *   font-weight: 500
 *   tracking:    0.15em
 *   uppercase
 *   color:       --m-orange (default) o --m-cream sobre fondos oscuros
 *
 * El slogan formal puede ir acompañado de un borde-izquierdo terracota
 * usando la prop `withRule`.
 */
export interface TaglineProps {
  className?: string;
  withRule?: boolean;
}

export function Tagline({ className, withRule }: TaglineProps) {
  return (
    <p
      className={[
        "font-serif text-[1.25rem] font-medium uppercase leading-[1.4] tracking-[0.15em]",
        withRule ? "border-l-[3px] border-terracota pl-6" : "",
        className ?? "text-terracota",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      Sabores que nos encuentran
    </p>
  );
}
