import type { Metadata } from "next";
import { ClassesCatalog } from "@/components/clases/ClassesCatalog";
import { Container } from "@/components/layout/Container";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { BrandDivider } from "@/components/ui/BrandDivider";
import { BrandIllustration } from "@/components/ui/BrandIllustration";
import { BrandPatternBackground } from "@/components/ui/BrandPatternBackground";
import { getAllClasses } from "@/lib/classes-mock";

export const metadata: Metadata = {
  title: "Clases de cocina · Menesteres",
  description: "Catálogo de clases para adultos, niños y eventos privados en Rafaela, Santa Fe. Reservá tu lugar.",
};

export const dynamic = "force-dynamic";

export default async function ClasesPage() {
  const classes = await getAllClasses();

  return (
    <main className="min-w-0 flex-1 py-12 lg:py-28">
      <Container as="div">
        {/* Header editorial con textura sutil */}
        <div className="relative overflow-hidden pb-10 lg:pb-20">
          <BrandPatternBackground
            src="/patrones/carpeta-patrones/Mesa%20de%20trabajo%209.png"
            opacity={0.04}
            tileSize={320}
          />
          <SectionLabel>CLASES</SectionLabel>
          <div className="relative mt-6 min-w-0 max-w-[min(100%,85ch)]">
            <BrandIllustration
              src="/brand-elements/menesteres-elements/cuchara-menesteres.svg"
              size={80}
              opacity={0.2}
              rotate={-15}
              hideOnMobile
              className="absolute -right-2 top-2"
            />
            <SectionTitle>
              Un catálogo para <em>encontrarnos</em>
            </SectionTitle>
            <p className="mt-2 max-w-[62ch] text-[1.05rem] leading-[1.7] text-carbon/80">
              Elegí categoría y recorré propuestas pensadas para cocinar en serio — con tiempo, buena mesa y
              acompañamiento.
            </p>
          </div>
        </div>

        <BrandDivider variant="trama" />

        <ClassesCatalog classes={classes} className="mt-8 lg:mt-16" />
      </Container>
    </main>
  );
}
