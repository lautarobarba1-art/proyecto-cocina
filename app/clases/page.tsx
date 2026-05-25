import { ClassesCatalog } from "@/components/clases/ClassesCatalog";
import { Container } from "@/components/layout/Container";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { getAllClasses } from "@/lib/classes-mock";

export const dynamic = "force-dynamic";

export default async function ClasesPage() {
  const classes = await getAllClasses();

  return (
    <main className="min-w-0 flex-1 py-20 lg:py-28">
      <Container as="div">
        <SectionLabel>CLASES</SectionLabel>
        <div className="mt-12 min-w-0 max-w-[min(100%,85ch)]">
          <SectionTitle>
            Un catálogo para <em>encontrarnos</em>
          </SectionTitle>
          <p className="mt-10 max-w-[62ch] text-[1.05rem] leading-[1.7] text-carbon/80">
            Elegí categoría y recorré propuestas pensadas para cocinar en serio — con tiempo, buena mesa y
            acompañamiento.
          </p>
        </div>

        <ClassesCatalog classes={classes} className="mt-20 lg:mt-24" />
      </Container>
    </main>
  );
}
