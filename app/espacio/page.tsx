import { EspacioAlquilerForm } from "@/components/espacio/EspacioAlquilerForm";
import { EspacioGallery } from "@/components/espacio/EspacioGallery";
import { EspacioSpecs } from "@/components/espacio/EspacioSpecs";
import { Container } from "@/components/layout/Container";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { ESPACIO_INTRO } from "@/lib/espacio";

export default function EspacioPage() {
  return (
    <main className="flex-1 overflow-x-clip pt-20 lg:pt-24">
      <Container as="div" className="py-20 lg:py-28">
        <SectionLabel>ALQUILER DEL ESPACIO</SectionLabel>

        <div className="mt-12 max-w-[72ch]">
          <SectionTitle>
            Un lugar listo para <em>rodar</em>
          </SectionTitle>
          <p className="mt-8 font-display text-[clamp(1.35rem,2.5vw,1.85rem)] font-normal leading-[1.35] tracking-tightish text-carbon/90">
            {ESPACIO_INTRO.lead}
          </p>
          <p className="mt-6 max-w-[62ch] font-body text-[1.02rem] leading-[1.75] text-carbon/75">
            {ESPACIO_INTRO.body}
          </p>
        </div>

        <EspacioSpecs className="mt-20 lg:mt-24" />
      </Container>

      <Container as="div" className="py-20 lg:py-28">
        <EspacioGallery />
      </Container>

      <Container as="div" className="border-t border-carbon/10 pb-20 pt-20 lg:pb-28 lg:pt-28">
        <EspacioAlquilerForm />
      </Container>
    </main>
  );
}
