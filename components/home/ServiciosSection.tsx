import Image from "next/image";

import { BrandButton } from "@/components/ui/BrandButton";
import { FadeInView } from "@/components/ui/FadeInView";
import { SectionWrapper } from "@/components/ui/SectionWrapper";
import { ServiceLabel } from "@/components/ui/ServiceLabel";
import { SERVICIOS_COPY } from "@/data/home";

export interface ServiciosSectionProps {
  id?: string;
  eventosImageSrc?: string;
  alquilerImageSrc?: string;
}

interface ServiceBlockProps {
  service: "eventos" | "alquiler";
  imageSrc?: string;
  delay: number;
}

function ServiceBlock({ service, imageSrc, delay }: ServiceBlockProps) {
  const copy = SERVICIOS_COPY[service];
  const background = service === "eventos" ? "bg-marron" : "bg-oliva";
  const overlay =
    service === "eventos"
      ? "bg-[linear-gradient(rgba(129,52,8,0.7),rgba(20,20,20,0.85))]"
      : "bg-[linear-gradient(rgba(105,96,39,0.6),rgba(20,20,20,0.85))]";

  return (
    <FadeInView delay={delay} className={["relative min-h-[400px] overflow-hidden md:min-h-[520px]", background].join(" ")}>
      {imageSrc ? (
        <>
          <Image src={imageSrc} alt="" fill sizes="(max-width: 767px) 100vw, 50vw" className="object-cover" />
          <div aria-hidden="true" className={["absolute inset-0", overlay].join(" ")} />
        </>
      ) : null}
      <div className="absolute inset-x-0 bottom-0 flex flex-col gap-4 p-8 md:p-10">
        <ServiceLabel service={service} className="text-crema" />
        <h3 className="font-sans text-(length:--text-card) font-bold leading-[1.2] text-crema">
          {copy.headline}
        </h3>
        <p className="whitespace-pre-line font-sans text-[0.9375rem] leading-[1.7] text-crema/80">
          {copy.descripcion}
        </p>
        <p className="font-sans text-xs tracking-wider text-crema/50">{copy.detalle}</p>
        <div>
          <BrandButton href={copy.cta.href} variant="ghost" size="sm">
            {copy.cta.texto}
          </BrandButton>
        </div>
      </div>
    </FadeInView>
  );
}

export function ServiciosSection({
  id = "servicios",
  eventosImageSrc,
  alquilerImageSrc,
}: ServiciosSectionProps) {
  return (
    <SectionWrapper id={id} fullWidth className="bg-carbon">
      <div className="grid md:grid-cols-2">
        <ServiceBlock service="eventos" imageSrc={eventosImageSrc} delay={0} />
        <ServiceBlock service="alquiler" imageSrc={alquilerImageSrc} delay={0.15} />
      </div>
    </SectionWrapper>
  );
}
