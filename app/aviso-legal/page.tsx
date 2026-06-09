import type { Metadata } from "next";

import { Container } from "@/components/layout/Container";

export const metadata: Metadata = {
  title: "Aviso Legal · Menesteres",
  description:
    "Condiciones de uso, titularidad y propiedad intelectual del sitio web de Menesteres.",
  robots: { index: false },
};

export default function AvisoLegalPage() {
  return (
    <main className="flex-1 pb-24 lg:pb-32">
      <Container as="div" className="py-20 lg:py-28">
        <p className="font-mono text-[0.65rem] font-medium uppercase tracking-eyebrow text-terracota">
          Legal
        </p>

        <h1 className="mt-4 max-w-[22ch] font-display text-[clamp(2rem,5vw,3.25rem)] font-normal leading-[1.1] tracking-tightish text-carbon">
          Aviso Legal
        </h1>

        <p className="mt-3 font-mono text-[0.6rem] font-medium uppercase tracking-widest text-carbon/40">
          Última actualización: junio de 2026
        </p>

        <div className="mt-14 max-w-[68ch] space-y-10">
          <section>
            <h2 className="font-display text-[1.1rem] font-semibold tracking-tightish text-carbon">
              1. Titular del sitio
            </h2>
            <p className="mt-3 font-body text-[0.95rem] leading-[1.8] text-carbon/70">
              <strong className="font-semibold text-carbon/90">Menesteres</strong>
              <br />
              Malvinas Argentinas 1150, Rafaela, Santa Fe, Argentina
              <br />
              Correo:{" "}
              <a
                href="mailto:hola@menesteres.com"
                className="underline decoration-carbon/25 underline-offset-2 transition-colors hover:text-terracota"
              >
                hola@menesteres.com
              </a>
              <br />
              Sitio web:{" "}
              <span className="text-carbon/90">menesteres.ar</span>
            </p>
          </section>

          <section>
            <h2 className="font-display text-[1.1rem] font-semibold tracking-tightish text-carbon">
              2. Objeto y condiciones de uso
            </h2>
            <p className="mt-3 font-body text-[0.95rem] leading-[1.8] text-carbon/70">
              Este sitio web tiene por objeto informar sobre las clases, actividades y servicios de
              Menesteres, escuela de cocina ubicada en Rafaela, Santa Fe. El acceso y uso del sitio
              implica la aceptación de estas condiciones.
            </p>
            <p className="mt-3 font-body text-[0.95rem] leading-[1.8] text-carbon/70">
              El usuario se compromete a utilizar el sitio conforme a la ley, la moral y el orden
              público, absteniéndose de cualquier uso fraudulento o que pudiera dañar los derechos
              de Menesteres o de terceros.
            </p>
          </section>

          <section>
            <h2 className="font-display text-[1.1rem] font-semibold tracking-tightish text-carbon">
              3. Propiedad intelectual
            </h2>
            <p className="mt-3 font-body text-[0.95rem] leading-[1.8] text-carbon/70">
              Todos los contenidos del sitio —incluyendo textos, imágenes, logotipos, ilustraciones,
              diseño y código— son propiedad de Menesteres o de sus respectivos autores, y están
              protegidos por las leyes de propiedad intelectual vigentes en la Argentina (Ley
              11.723).
            </p>
            <p className="mt-3 font-body text-[0.95rem] leading-[1.8] text-carbon/70">
              Queda prohibida su reproducción, distribución, comunicación pública o transformación
              sin autorización escrita previa de Menesteres.
            </p>
          </section>

          <section>
            <h2 className="font-display text-[1.1rem] font-semibold tracking-tightish text-carbon">
              4. Limitación de responsabilidad
            </h2>
            <p className="mt-3 font-body text-[0.95rem] leading-[1.8] text-carbon/70">
              Menesteres no garantiza la disponibilidad ininterrumpida del sitio ni la ausencia de
              errores en los contenidos. Nos reservamos el derecho de modificar, suspender o
              discontinuar el sitio en cualquier momento sin previo aviso.
            </p>
            <p className="mt-3 font-body text-[0.95rem] leading-[1.8] text-carbon/70">
              El sitio puede contener enlaces a sitios externos sobre los que Menesteres no ejerce
              control ni asume responsabilidad alguna.
            </p>
          </section>

          <section>
            <h2 className="font-display text-[1.1rem] font-semibold tracking-tightish text-carbon">
              5. Ley aplicable y jurisdicción
            </h2>
            <p className="mt-3 font-body text-[0.95rem] leading-[1.8] text-carbon/70">
              Estas condiciones se rigen por la legislación de la República Argentina. Para
              cualquier controversia, las partes se someten a los tribunales ordinarios competentes
              de la ciudad de Rafaela, Santa Fe.
            </p>
          </section>
        </div>
      </Container>
    </main>
  );
}
