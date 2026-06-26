import type { Metadata } from "next";
import { EspacioAlquilerForm } from "@/components/espacio/EspacioAlquilerForm";
import { EspacioGallery } from "@/components/espacio/EspacioGallery";
import { EspacioSpecs } from "@/components/espacio/EspacioSpecs";
import { Container } from "@/components/layout/Container";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { BrandIllustration } from "@/components/ui/BrandIllustration";
import { BrandPatternBackground } from "@/components/ui/BrandPatternBackground";
import { ESPACIO_INTRO } from "@/lib/espacio";

export const metadata: Metadata = {
  title: "Alquiler del espacio · Menesteres",
  description: "Espacio gastronómico disponible para fotógrafos, talleres y producciones en Rafaela, Santa Fe. Cocina equipada y luz natural.",
};

export default function EspacioPage() {
  return (
    <main className="flex-1 overflow-x-clip pt-14 lg:pt-24">
      {/* Sección intro con textura editorial */}
      <div className="relative overflow-hidden">
        <BrandPatternBackground
          src="/patrones/carpeta-patrones/Mesa%20de%20trabajo%2012.png"
          opacity={0.04}
          tileSize={340}
        />
        <Container as="div" className="py-12 lg:py-28">
          <SectionLabel>ALQUILER DEL ESPACIO</SectionLabel>

          <div className="relative mt-6 max-w-[72ch]">
            <BrandIllustration
              src="/brand-elements/menesteres-elements/tabla-cocina-menesteres.svg"
              size={90}
              opacity={0.18}
              rotate={8}
              hideOnMobile
              className="absolute -right-24 top-4"
            />
            <SectionTitle>
              Un lugar listo para <em>rodar</em>
            </SectionTitle>
            <p className="mt-5 font-display text-[clamp(1.35rem,2.5vw,1.85rem)] font-normal leading-[1.35] tracking-tightish text-carbon/90">
              {ESPACIO_INTRO.lead}
            </p>
            <p className="mt-3 max-w-[62ch] font-body text-[1.02rem] leading-[1.75] text-carbon/75">
              {ESPACIO_INTRO.body}
            </p>
          </div>

          <EspacioSpecs className="mt-12 lg:mt-24" />
        </Container>
      </div>

      <Container as="div" className="py-12 lg:py-28">
        <EspacioGallery />
      </Container>

      <Container as="div" className="border-t border-carbon/10 pb-12 pt-12 lg:pb-28 lg:pt-28">
        <EspacioAlquilerForm />
      </Container>
    </main>
  );
}
