import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/Button";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { NEXT_CLASS } from "@/lib/classes";

export interface NextClassTeaserProps {
  className?: string;
}

export function NextClassTeaser({ className }: NextClassTeaserProps) {
  return (
    <section className={["border-t border-terracota/15 py-20 lg:py-28", className ?? ""].join(" ")} aria-label="Próxima clase">
      <Container as="div">
        <SectionLabel>PRÓXIMA CLASE</SectionLabel>

        <div className="mt-12 grid gap-6 sm:gap-8 md:grid-cols-[1fr_auto] md:items-end">
          <div className="min-w-0 border-l-4 border-terracota pl-4 sm:pl-6">
            <p className="font-mono text-[0.75rem] font-medium uppercase tracking-eyebrow text-terracota">
              {NEXT_CLASS.dateLabel}
            </p>
            <h3 className="mt-3 max-w-[min(100%,20ch)] text-balance font-display text-3xl font-normal tracking-tightish text-carbon sm:text-4xl md:text-5xl lg:text-6xl">
              {NEXT_CLASS.title}
            </h3>
          </div>

          <Button href={NEXT_CLASS.href} variant="primary" className="w-full shrink-0 md:w-auto">
            Reservar
          </Button>
        </div>
      </Container>
    </section>
  );
}

