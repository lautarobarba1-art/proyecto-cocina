import { GaleriaGrid } from "@/components/galeria/GaleriaGrid";
import { GaleriaGrid as GaleriaGridItems } from "@/lib/galeria";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/Button";

export const metadata = {
  title: "Galería · Menesteres",
};

export default function GaleriaPage() {
  return (
    <main className="flex-1 pb-20 lg:pb-28">
      <Container as="div" className="pt-12 pb-10 lg:pt-16 lg:pb-12">
        <p className="font-mono text-[0.7rem] font-medium uppercase tracking-eyebrow text-terracota">
          #GaleríaMenesteres
        </p>
        <h1 className="mt-3 font-display text-3xl font-normal tracking-tightish text-carbon sm:text-4xl">
          Galería
        </h1>
        <p className="mt-4 max-w-[48ch] font-body text-[0.95rem] leading-relaxed text-carbon/65">
          Diferentes momentos que nos hacen ser Menesteres.
        </p>
      </Container>

      <GaleriaGrid items={GaleriaGridItems} />

      <Container as="div" className="mt-12 flex justify-center">
        <Button href="/" variant="ghost" size="sm">
          ← Volver al inicio
        </Button>
      </Container>
    </main>
  );
}