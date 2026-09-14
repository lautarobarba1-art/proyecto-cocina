import * as React from "react";

/**
 * FilterDisclosure — panel de filtros plegable (para agrupar varios
 * SegmentedFilter cuando tienen demasiadas opciones para vivir en una
 * fila del header sin verse desprolijas). Usa <details>/<summary>
 * nativos: no necesita JS ni "use client".
 */

export interface FilterDisclosureProps {
  label: string;
  /** Resumen de lo aplicado, visible aunque el panel esté cerrado. */
  activeSummary?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export function FilterDisclosure({
  label,
  activeSummary,
  children,
  defaultOpen = false,
}: FilterDisclosureProps) {
  return (
    <details
      className="group border border-carbon/10 bg-white"
      open={defaultOpen}
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden">
        <span className="font-mono text-[0.7rem] uppercase tracking-eyebrow text-carbon/70">
          {label}
          {activeSummary ? (
            <span className="ml-2 normal-case tracking-normal text-carbon/45">
              {activeSummary}
            </span>
          ) : null}
        </span>
        <span
          aria-hidden="true"
          className="text-carbon/40 transition-transform duration-200 group-open:rotate-180"
        >
          ▾
        </span>
      </summary>
      <div className="space-y-4 border-t border-carbon/10 px-4 py-4">
        {children}
      </div>
    </details>
  );
}
