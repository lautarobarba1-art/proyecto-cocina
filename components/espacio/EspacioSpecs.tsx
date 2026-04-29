import { ESPACIO_SPECS } from "@/lib/espacio";

export interface EspacioSpecsProps {
  className?: string;
}

export function EspacioSpecs({ className }: EspacioSpecsProps) {
  return (
    <div className={className ?? ""}>
      <p className="font-mono text-[0.65rem] font-medium uppercase tracking-eyebrow text-terracota">
        Especificaciones
      </p>
      <ul className="mt-8 grid grid-cols-1 gap-10 border-t border-carbon/10 pt-10 sm:grid-cols-2 sm:gap-x-12 sm:gap-y-12 lg:gap-x-16 lg:gap-y-14">
        {ESPACIO_SPECS.map((spec) => (
          <li key={spec.label}>
            <p className="font-mono text-[0.58rem] font-medium uppercase tracking-[0.2em] text-carbon/45">
              {spec.label}
            </p>
            <p className="mt-3 max-w-[42ch] font-body text-[0.95rem] font-normal leading-[1.65] text-carbon/80">
              {spec.value}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
