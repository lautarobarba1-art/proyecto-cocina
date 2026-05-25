import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ClassReservationForm } from "@/components/clases/ClassReservationForm";
import { Container } from "@/components/layout/Container";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { getClassBySlug } from "@/lib/classes-mock";
import {
  getClassBySlugAndDate,
  getSessionsForClass,
} from "@/lib/clases/queries";

export const dynamic = "force-dynamic";

export interface ClaseDetallePageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ fecha?: string }>;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const clase = await getClassBySlug(slug);
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

export default async function ClaseDetallePage({
  params,
  searchParams,
}: ClaseDetallePageProps) {
  const { slug } = await params;
  const { fecha } = await searchParams;

  // Si llega ?fecha=, intentamos obtener esa sesión específica
  // Si no, fallback a la próxima sesión futura (o más reciente)
  const clase = fecha
    ? (await getClassBySlugAndDate(slug, fecha)) ?? (await getClassBySlug(slug))
    : await getClassBySlug(slug);

  if (!clase) notFound();

  // Sesiones disponibles para el <select> del form
  const sessions = await getSessionsForClass(slug);

  // Pre-seleccionar la sesión que coincida con ?fecha=
  const initialSessionId =
    fecha && sessions.length > 0
      ? sessions.find((s) => s.date === fecha)?.id ?? sessions[0]?.id
      : sessions[0]?.id;

  const lastSpots = clase.status === "últimos cupos";
  const soldOut = clase.status === "agotado";

  return (
    <main className="flex-1 pb-20 lg:pb-28">
      {/* Header band — text-forward, sin imagen */}
      <div className="relative left-1/2 w-screen max-w-none -translate-x-1/2 border-b border-line">
        <div
          className={[
            "relative flex h-[min(32vh,280px)] min-h-[160px] items-end overflow-hidden px-8 pb-10 lg:px-16 lg:pb-14",
            soldOut ? "bg-crema-deep/60" : "bg-crema-deep",
          ].join(" ")}
        >
          {/* Letra decorativa — misma lógica que ClaseCard */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute right-8 top-1/2 -translate-y-1/2 select-none font-display text-[clamp(8rem,20vw,16rem)] font-normal italic leading-none text-terracota/8 lg:right-16"
          >
            {clase.title.charAt(0)}
          </span>

          {/* Category + status badges */}
          <div className="relative z-10 flex flex-wrap items-center gap-3">
            <SectionLabel>{clase.category}</SectionLabel>
            {lastSpots && <Badge variant="orange-light">Últimos cupos</Badge>}
            {soldOut && <Badge variant="black">Agotado</Badge>}
          </div>
        </div>
      </div>
      <Container as="div" className="mt-10 lg:mt-12">
        <Button href="/clases" variant="ghost" size="sm">
          ← Catálogo de clases
        </Button>
        <h1 className="mt-5 max-w-[22ch] font-sans text-[clamp(2rem,5vw,3rem)] font-extrabold uppercase leading-[1.05] tracking-tighter text-carbon">
          {clase.title}
        </h1>
        <div className="mt-6 flex flex-wrap gap-x-8 gap-y-2 font-sans text-[0.85rem] font-semibold uppercase tracking-meta text-mute">
          <span>{clase.duration}</span>
          <span className="text-line">·</span>
          <span>
            {clase.price}{" "}
            <span className="font-normal normal-case tracking-normal text-carbon/40">
              por persona
            </span>
          </span>
        </div>
        <div className="mt-14 grid gap-14 lg:mt-16 lg:grid-cols-[minmax(0,1fr)_min(380px,38%)] lg:items-start lg:gap-x-16 xl:gap-x-20">
          <div className="min-w-0 space-y-8">
            <div>
              <SectionLabel>Sobre la clase</SectionLabel>
              <p className="mt-4 max-w-[60ch] text-[1.05rem] leading-[1.75] text-carbon/85">
                {clase.description}
              </p>
              <p className="mt-6 max-w-[60ch] text-[1.02rem] leading-[1.7] text-carbon/75">
                Trabajamos en grupos reducidos; al final compartimos la mesa
                con lo cocinado. No hace falta experiencia previa salvo que lo
                indiquemos en la ficha.
              </p>
            </div>
            <div>
              <SectionLabel>Incluye</SectionLabel>
              <ul className="mt-5 grid gap-3">
                {INCLUYE.map((line) => (
                  <li
                    key={line}
                    className="border-l-[3px] border-terracota/35 pl-4 text-[0.95rem] leading-snug text-carbon/80"
                  >
                    {line}
                  </li>
                ))}
              </ul>
            </div>
            <p className="max-w-[58ch] text-[0.9rem] leading-relaxed text-carbon/55">
              Cancelaciones con más de 72 h de anticipación reintegran el 100 %
              del valor.
            </p>
          </div>
          <div className="min-w-0 lg:sticky lg:top-28">
            <ClassReservationForm
              classItem={clase}
              sessions={sessions}
              initialSessionId={initialSessionId}
            />
            {!soldOut && (
              <p className="mt-4 font-body text-[0.78rem] leading-relaxed text-carbon/45">
                Si la clase tiene seña, recibirás el link de pago junto al
                correo de confirmación. Sin seña, tu lugar queda reservado al
                enviar el formulario.
              </p>
            )}
          </div>
        </div>
      </Container>
    </main>
  );
}
