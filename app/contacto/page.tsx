import Link from "next/link";

import { ContactoForm } from "@/components/contacto/ContactoForm";
import { Container } from "@/components/layout/Container";

export default function ContactoPage() {
  return (
    <main className="flex-1 pb-24 lg:pb-32">
      <Container as="div" className="py-20 lg:py-28">
        <p className="font-mono text-[0.65rem] font-medium uppercase tracking-eyebrow text-terracota">
          Contacto
        </p>

        <div className="mt-14 grid gap-16 lg:mt-16 lg:grid-cols-[3fr_2fr] lg:items-start lg:gap-x-16 xl:gap-x-24">
          <div className="min-w-0">
            <h1 className="max-w-[14ch] font-display text-[clamp(2.25rem,5.5vw,3.75rem)] font-normal leading-[1.05] tracking-tightish text-carbon">
              Hablemos y <em className="italic text-terracota">cocinemos.</em>
            </h1>

            <div className="mt-14 space-y-8">
              <div>
                <p className="font-mono text-[0.58rem] font-medium uppercase tracking-[0.22em] text-carbon/40">
                  Email
                </p>
                <a
                  href="mailto:hola@menesteres.com"
                  className="mt-2 inline-block font-body text-[0.72rem] font-light uppercase tracking-[0.18em] text-carbon/70 transition-colors hover:text-terracota"
                >
                  hola@menesteres.com
                </a>
              </div>
              <div>
                <p className="font-mono text-[0.58rem] font-medium uppercase tracking-[0.22em] text-carbon/40">
                  Dirección
                </p>
                <p className="mt-2 max-w-[28ch] font-body text-[0.72rem] font-light uppercase leading-relaxed tracking-[0.18em] text-carbon/70">
                  San Martín 1234 · Rafaela, Santa Fe · Argentina
                </p>
              </div>
              <div>
                <p className="font-mono text-[0.58rem] font-medium uppercase tracking-[0.22em] text-carbon/40">
                  WhatsApp
                </p>
                <a
                  href="https://wa.me/5493415550000"
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-block font-body text-[0.72rem] font-light uppercase tracking-[0.18em] text-carbon/70 transition-colors hover:text-terracota"
                >
                  +54 9 341 555-0000
                </a>
              </div>
            </div>

            <p className="mt-16 max-w-[46ch] font-body text-[0.9rem] leading-[1.65] text-carbon/55">
              Las reservas de clases van por el{" "}
              <Link href="/clases" className="text-carbon/75 underline decoration-carbon/25 underline-offset-2 transition-colors hover:text-terracota hover:decoration-terracota/40">
                catálogo
              </Link>
              ; eventos privados y alquiler del espacio tienen su propio recorrido en el sitio. Este mensaje es
              para lo demás: dudas, prensa, colaboraciones o cualquier cosa que quieras contarnos con calma.
            </p>
          </div>

          <div className="min-w-0 lg:pt-2">
            <ContactoForm />
          </div>
        </div>
      </Container>

      {/*
        Mapa embebido (Google / Mapbox): envolver el iframe o canvas en un contenedor con filtro
        acorde a la paleta, por ejemplo:
        className="grayscale contrast-[0.92] sepia-[0.08] hue-rotate-[-8deg] opacity-[0.92]"
        y opcionalmente `mix-blend-multiply` sobre fondo crema. Ajustar intensidad para no perder legibilidad.
      */}
      <div className="relative left-1/2 mt-20 w-screen max-w-none -translate-x-1/2 border-y border-carbon/10 bg-crema-deep/50">
        <div className="mx-auto flex h-[min(52vw,320px)] min-h-[220px] max-h-[400px] w-full max-w-[1400px] items-center justify-center px-6">
          <div className="text-center">
            <p className="font-mono text-[0.6rem] font-medium uppercase tracking-[0.24em] text-carbon/40">
              Mapa
            </p>
            <p className="mt-3 font-display text-lg font-normal tracking-tightish text-carbon/65">
              San Martín 1234, Rafaela
            </p>
            <Link
              href="https://www.openstreetmap.org/"
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-block font-mono text-[0.6rem] font-medium uppercase tracking-eyebrow text-terracota underline decoration-terracota/30 underline-offset-4 transition-colors hover:text-terracota-deep"
            >
              Abrir en mapa →
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
