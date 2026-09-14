/**
 * SummaryPill — pill de resumen numérico (ej. "Pendientes: 3").
 *
 * Consolida las copias locales casi idénticas en reservas, clases,
 * inquiries, notificaciones y clases/[id]/reservas.
 */

export type SummaryPillTone = "neutral" | "brand" | "danger";

const TONE: Record<SummaryPillTone, { wrapper: string; value: string }> = {
  neutral: {
    wrapper: "border-carbon/10 bg-white",
    value: "text-carbon",
  },
  brand: {
    wrapper: "border-terracota/40 bg-terracota/5",
    value: "text-terracota",
  },
  danger: {
    wrapper: "border-rojo/30 bg-rojo/5",
    value: "text-rojo",
  },
};

export interface SummaryPillProps {
  label: string;
  value: number | string;
  tone?: SummaryPillTone;
}

export function SummaryPill({ label, value, tone = "neutral" }: SummaryPillProps) {
  const t = TONE[tone];
  return (
    <div className={["border px-4 py-2", t.wrapper].join(" ")}>
      <p className="font-mono text-[0.65rem] uppercase tracking-eyebrow text-carbon/55">
        {label}
      </p>
      <p className={["font-display text-lg", t.value].join(" ")}>{value}</p>
    </div>
  );
}
