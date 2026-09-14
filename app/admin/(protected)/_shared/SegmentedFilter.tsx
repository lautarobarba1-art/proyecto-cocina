import Link from "next/link";

/**
 * SegmentedFilter — grupo de links tipo pill usado para los filtros
 * del panel (estado, categoría, tipo, etc). Server component: la
 * navegación sigue siendo por URL, sin JS de por medio.
 */

export interface SegmentedFilterOption {
  href: string;
  label: string;
  active: boolean;
}

export interface SegmentedFilterProps {
  options: SegmentedFilterOption[];
  label?: string;
  /**
   * true = envuelve en varias líneas (para usar dentro de un contenedor con
   * espacio propio, ej. FilterDisclosure). Por defecto es una tira con
   * scroll horizontal, pensada para vivir en una fila junto a otros
   * elementos del header sin romper el layout.
   */
  wrap?: boolean;
}

export function SegmentedFilter({ options, label, wrap = false }: SegmentedFilterProps) {
  return (
    <div className="min-w-0">
      {label ? (
        <p className="mb-1.5 font-mono text-[0.65rem] uppercase tracking-eyebrow text-carbon/55">
          {label}
        </p>
      ) : null}
      <div
        className={
          wrap
            ? "flex flex-wrap gap-1"
            : "flex flex-nowrap gap-1 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        }
      >
        {options.map((opt) => (
          <Link
            key={opt.href}
            href={opt.href}
            className={[
              "shrink-0 whitespace-nowrap border px-3 py-1.5 font-sans text-[0.78rem] transition",
              opt.active
                ? "border-carbon bg-carbon text-crema"
                : "border-carbon/20 bg-white text-carbon/70 hover:border-carbon/40",
            ].join(" ")}
          >
            {opt.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
