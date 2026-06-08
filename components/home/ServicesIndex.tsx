"use client";

import { HomeCTAFinal } from "@/components/home/HomeCTAFinal";
import { HomeIdentidadSection } from "@/components/home/HomeIdentidadSection";
import { HomeMarquee } from "@/components/home/HomeMarquee";
import { HomeProximasClasesSection } from "@/components/home/HomeProximasClasesSection";
import { HomeTresFormasSection } from "@/components/home/HomeTresFormasSection";
import { Lookbook } from "@/components/home/Lookbook";

export interface ServicesIndexProps {
  className?: string;
}

export function ServicesIndex({ className }: ServicesIndexProps) {
  return (
    <div className={className ?? ""}>
      <HomeProximasClasesSection />
      <HomeMarquee className="mb-8 mt-10" />
      <HomeIdentidadSection />
      <HomeTresFormasSection />
      <Lookbook />
      <HomeCTAFinal />
    </div>
  );
}
