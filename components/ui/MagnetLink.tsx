import * as React from "react";
import Link from "next/link";

export interface MagnetLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

/** Enlace editorial (CTA sutil). Sin efecto magnético en V1 — reservado para evolución. */
export function MagnetLink({ href, children, className }: MagnetLinkProps) {
  return (
    <Link
      href={href}
      className={[
        "transition-[opacity,color] duration-300 ease-snap hover:opacity-100 hover:text-crema",
        className ?? "",
      ].join(" ")}
    >
      {children}
    </Link>
  );
}
