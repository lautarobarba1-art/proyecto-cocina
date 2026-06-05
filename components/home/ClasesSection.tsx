import Image from "next/image";

import { ProximasClases } from "@/components/home/ProximasClases";
import { BrandButton } from "@/components/ui/BrandButton";
import { FadeInView } from "@/components/ui/FadeInView";
import { ServiceLabel } from "@/components/ui/ServiceLabel";
import { CLASES_COPY } from "@/data/home";

export interface ClasesSectionProps {
  imageSrc?: string;
}

export function ClasesSection({ imageSrc }: ClasesSectionProps) {
  return (
    <section className="grid bg-carbon md:min-h-[560px] md:grid-cols-[55%_45%]" aria-labelledby="clases-home-title">
      <div className="relative h-[280px] overflow-hidden md:h-full md:min-h-[560px]">
        {imageSrc ? (
          <Image src={imageSrc} alt="" fill sizes="(max-width: 767px) 100vw, 55vw" className="object-cover object-center" />
        ) : (
          <div className="h-full w-full bg-[linear-gradient(145deg,#2C1810_0%,#8B4513_100%)]" />
        )}
        <div aria-hidden="true" className="absolute inset-0 bg-linear-to-b from-transparent to-carbon/35 md:hidden" />
      </div>

      <div className="flex items-center bg-carbon p-8 md:p-12">
        <FadeInView delay={0.2} className="flex w-full flex-col gap-5">
          <ServiceLabel service="clases" className="text-crema" />
          <h2 id="clases-home-title" className="font-sans text-(length:--text-section) font-bold leading-[1.2] text-crema">
            {CLASES_COPY.headline}
          </h2>
          <p className="whitespace-pre-line font-sans text-base leading-[1.7] text-crema/75">
            {CLASES_COPY.descripcion}
          </p>
          <ul className="flex flex-wrap gap-2" aria-label="Características de las clases">
            {CLASES_COPY.tags.map((tag) => (
              <li key={tag} className="rounded-pill border border-crema/20 px-3.5 py-1 font-sans text-[0.8125rem] text-crema/60">
                {tag}
              </li>
            ))}
          </ul>
          <ProximasClases />
          <div className="flex flex-wrap gap-3">
            <BrandButton href={CLASES_COPY.ctaPrimario.href} variant="primary" size="md">
              {CLASES_COPY.ctaPrimario.texto}
            </BrandButton>
            <BrandButton href={CLASES_COPY.ctaSecundario.href} variant="ghost" size="sm">
              {CLASES_COPY.ctaSecundario.texto}
            </BrandButton>
          </div>
        </FadeInView>
      </div>
    </section>
  );
}
