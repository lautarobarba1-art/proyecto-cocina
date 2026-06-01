import { Button } from "@/components/ui/Button";

interface PastSessionCardProps {
  className?: string;
}

export function PastSessionCard({ className }: PastSessionCardProps) {
  const cardClass = [
    "border border-carbon/10 bg-crema-light p-8 lg:p-10",
    "shadow-brand-lg",
    className ?? "",
  ].join(" ");

  return (
    <div className={cardClass}>
      <p className="font-mono text-[0.7rem] font-medium uppercase tracking-eyebrow text-carbon/50">
        Fecha pasada
      </p>
      <h3 className="mt-4 font-display text-2xl font-normal tracking-tightish text-carbon">
        Esta clase ya se realizó
      </h3>
      <p className="mt-4 font-body text-[0.95rem] leading-relaxed text-carbon/75">
        La fecha que elegiste ya pasó. Mirá el calendario para ver próximas
        fechas de esta misma propuesta.
      </p>
      <Button
        href="/calendario"
        variant="primary"
        size="default"
        className="mt-8 w-full"
      >
        Ver calendario
      </Button>
    </div>
  );
}
