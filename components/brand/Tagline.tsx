import * as React from "react";

export interface TaglineProps {
  className?: string;
}

export function Tagline({ className }: TaglineProps) {
  return (
    <p
      className={["font-script text-[1.8rem] leading-none", className ?? "text-terracota"].join(" ")}
    >
      sabores que nos encuentran
    </p>
  );
}

