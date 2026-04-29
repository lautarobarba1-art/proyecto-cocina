import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ClassReservationForm } from "@/components/clases/ClassReservationForm";
import { Container } from "@/components/layout/Container";
import { CLASSES_MOCK, getClassBySlug } from "@/lib/classes-mock";

export interface ClaseDetallePageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return CLASSES_MOCK.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: ClaseDetallePageProps): Promise<Metadata> {
  const { slug } = await params;
  const clase = getClassBySlug(slug);
  if (!clase) return { title: "Clase · Menesteres" };
  return {
    title: `${clase.title} · Menesteres`,
    description: clase.description,
  };
}

const INCLUYE = [
  "Insumos y materiales incluidos",
  "Delantal para uso durante la clase",
  "Degustación compartida al finalizar",
  "Recetas en PDF por correo",
] as const;

export default async function ClaseDetallePage({ params }: ClaseDetallePageProps) {
  const { slug } = await params;
  const clase = getClassBySlug(slug);
  if (!clase) notFound();

  const lastSpots = clase.status === "últimos cupos";
  const soldOut = clase.status === "agotado";

  return (
    <main className="flex-1 pb-20 lg:pb-28">
      <div className="relative left-1/2 w-screen max-w-none -translate-x-1/2 border-b border-carbon/10">
        <div className="relative aspect-video min-h-[220px] max-h-[min(52vh,560px)] w-full bg-carbon-soft/30">
          <Image
            src={clase.image.src}
            alt={clase.image.alt}
            fill
            priority
            sizes="100vw"
            className={["object-cover object-center", soldOut ? "grayscale-[0.25]" : ""].join(" ")}
          />
          <div
            className="pointer-events-none absolute inset-0 bg-linear-to-t from-carbon/50 via-transparent to-carbon/20"
            aria-hidden="true"
          />
        </div>
      </div>

      <Container as="div" className="mt-10 lg:mt-12">
        <Link
          href="/clases"
          className="font-mono text-[0.65rem] font-medium uppercase tracking-eyebrow text-carbon/50 transition-colors hover:text-terracota"
        >
          ← Catálogo de clases
        </Link>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <p className="font-mono text-[0.65rem] font-medium uppercase tracking-eyebrow text-terracota">
            {clase.category}
          </p>
          {lastSpots ? (
            <span className="border border-terracota/30 bg-terracota-muted/40 px-2.5 py-1 font-mono text-[0.6rem] font-medium uppercase tracking-[0.16em] text-terracota-deep">
              Últimos cupos
            </span>
          ) : null}
          {soldOut ? (
            <span className="border border-carbon/15 bg-carbon/10 px-2.5 py-1 font-mono text-[0.6rem] font-medium uppercase tracking-[0.16em] text-carbon/70">
              Agotado
            </span>
          ) : null}
        </div>

        <h1 className="mt-5 max-w-[20ch] font-display text-[clamp(2rem,5vw,3.25rem)] font-normal leading-[1.05] tracking-tightish text-carbon">
          {clase.title}
        </h1>

        <div className="mt-6 flex flex-wrap gap-x-8 gap-y-2 font-body text-[0.85rem] uppercase tracking-[0.12em] text-carbon/55">
          <span>{clase.duration}</span>
          <span className="text-carbon/25">·</span>
          <span>{clase.price} <span className="normal-case tracking-normal text-carbon/40">por persona</span></span>
        </div>

        <div className="mt-14 grid gap-14 lg:mt-16 lg:grid-cols-[minmax(0,1fr)_min(380px,38%)] lg:items-start lg:gap-x-16 xl:gap-x-20">
          <div className="min-w-0 space-y-8">
            <div>
              <p className="font-mono text-[0.65rem] font-medium uppercase tracking-eyebrow text-terracota">
                Sobre la clase
              </p>
              <p className="mt-4 max-w-[60ch] font-body text-[1.05rem] leading-[1.75] text-carbon/85">
                {clase.description}
              </p>
              <p className="mt-6 max-w-[60ch] font-body text-[1.02rem] leading-[1.7] text-carbon/75">
                Trabajamos en grupos reducidos; al final compartimos la mesa con lo cocinado. No hace falta
                experiencia previa salvo que lo indiquemos en la ficha.
              </p>
            </div>

            <div>
              <p className="font-mono text-[0.65rem] font-medium uppercase tracking-eyebrow text-terracota">
                Incluye
              </p>
              <ul className="mt-5 grid gap-3">
                {INCLUYE.map((line) => (
                  <li
                    key={line}
                    className="border-l-2 border-terracota/35 pl-4 font-body text-[0.95rem] leading-snug text-carbon/80"
                  >
                    {line}
                  </li>
                ))}
              </ul>
            </div>

            <p className="max-w-[58ch] font-body text-[0.9rem] leading-relaxed text-carbon/55">
              Cancelaciones con más de 72 h de anticipación reintegran el 100 % del valor (política mock para
              presentación).
            </p>
          </div>

          <div className="min-w-0 lg:sticky lg:top-28">
            <ClassReservationForm classItem={clase} />
          </div>
        </div>
      </Container>
    </main>
  );
}
