import { EspacioAlquilerForm } from "@/components/espacio/EspacioAlquilerForm";
import { EspacioGallery } from "@/components/espacio/EspacioGallery";
import { EspacioSpecs } from "@/components/espacio/EspacioSpecs";
import { Container } from "@/components/layout/Container";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { SectionTitle } from "@/components/ui/SectionTitle";

export default function EspacioPage() {
  return (
    <main className="flex-1">
      <Container as="div" className="py-20 lg:py-28">
        <SectionLabel>ALQUILER DEL ESPACIO</SectionLabel>

        <div className="mt-12 max-w-[72ch]">
          <SectionTitle>
            Un lugar listo para <em>rodar</em>
          </SectionTitle>
          <p className="mt-8 font-display text-[clamp(1.35rem,2.5vw,1.85rem)] font-normal leading-[1.35] tracking-tightish text-carbon/90">
            Estético por defecto: quien alquila se ahorra la escenografía. Cocina a la vista, luz honesta y
            silencio de fondo — para foto, video, talleres chicos o sesiones que piden rigor sin montar un set
            desde cero.
          </p>
          <p className="mt-6 max-w-[62ch] font-body text-[1.02rem] leading-[1.75] text-carbon/75">
            Ficha técnica resumida y referencias visuales. Si tu proyecto necesita otra logística (horario,
            catering externo, equipo extra), lo vemos en la consulta.
          </p>
        </div>

        <EspacioSpecs className="mt-20 lg:mt-24" />
      </Container>

      <Container as="div" className="py-24 lg:py-32">
        <EspacioGallery />
      </Container>

      <Container as="div" className="border-t border-carbon/10 pb-24 pt-20 lg:pb-32 lg:pt-24">
        <EspacioAlquilerForm />
      </Container>
    </main>
  );
}
