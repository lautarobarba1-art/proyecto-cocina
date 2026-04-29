import { Container } from "@/components/layout/Container";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { SectionTitle } from "@/components/ui/SectionTitle";

export default function RecetasPage() {
  return (
    <main className="flex-1 py-20 lg:py-28">
      <Container as="div">
        <SectionLabel>RECETAS</SectionLabel>
        <div className="mt-12">
          <SectionTitle>
            Recetas para <em>volver</em>
          </SectionTitle>
          <p className="mt-10 max-w-[70ch] text-[1.05rem] leading-[1.7] text-carbon/80">
            Próximamente.
          </p>
        </div>
      </Container>
    </main>
  );
}

