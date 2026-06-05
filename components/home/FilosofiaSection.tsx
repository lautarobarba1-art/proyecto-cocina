import { FILOSOFIA_COPY } from "@/data/home";
import { highlightWords } from "@/lib/text-utils";
import { BrandDivider } from "@/components/ui/BrandDivider";
import { FadeInView } from "@/components/ui/FadeInView";
import { SectionWrapper } from "@/components/ui/SectionWrapper";

export function FilosofiaSection() {
  return (
    <SectionWrapper className="bg-crema">
      <FadeInView delay={0} duration={0.6} className="mx-auto max-w-[680px] text-center">
        <BrandDivider variant="trama" className="mx-auto mb-10 w-[120px]" />
        <p className="whitespace-pre-line font-serif text-[clamp(1.0625rem,2.5vw,1.25rem)] font-normal italic leading-[1.8] text-carbon">
          {highlightWords(FILOSOFIA_COPY.parrafo, ["encuentro", "celebración", "recuerdos"])}
        </p>
        <p className="mt-8 font-sans text-[0.9375rem] font-semibold not-italic text-carbon/50">
          {FILOSOFIA_COPY.cierre}
        </p>
        <BrandDivider variant="trama" className="mx-auto mt-10 w-[120px]" />
      </FadeInView>
    </SectionWrapper>
  );
}
