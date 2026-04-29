import type { Metadata } from "next";

import { Archive } from "@/components/nosotros/Archive";
import { ChapterFooter } from "@/components/nosotros/ChapterFooter";
import { ChapterHeader } from "@/components/nosotros/ChapterHeader";
import { HouseRules } from "@/components/nosotros/HouseRules";
import { Interview } from "@/components/nosotros/Interview";
import { OpenLetter } from "@/components/nosotros/OpenLetter";
import { OpeningStatement } from "@/components/nosotros/OpeningStatement";
import { PullQuote } from "@/components/nosotros/PullQuote";

export const metadata: Metadata = {
  title: "Nosotros — Menesteres",
  description:
    "Antes de ser una cocina, Menesteres fue una excusa para juntarse. Conocé la historia, las reglas no escritas y la filosofía de nuestras clases en Rafaela.",
  openGraph: {
    title: "Nosotros — Menesteres",
    description: "La historia detrás de Menesteres, una cocina en Rafaela.",
    type: "article",
  },
};

export default function NosotrosPage() {
  return (
    <main className="flex-1">
      <ChapterHeader chapter="UNO" section="NOSOTROS" totalPages={6} />
      <OpeningStatement />
      <PullQuote />
      <Interview />
      <Archive />
      <HouseRules />
      <OpenLetter />
      <ChapterFooter />
    </main>
  );
}
