import type { Metadata } from "next";
import Link from "next/link";

import { ContactMap } from "@/components/contacto/ContactMap";
import { ContactoForm } from "@/components/contacto/ContactoForm";
import { Container } from "@/components/layout/Container";
import { mailtoHref, siteContact, whatsappHref } from "@/lib/site/contact";

export const metadata: Metadata = {
  title: "Contacto · Menesteres",
  description: "Contactanos para consultas, eventos privados o colaboraciones. Escuela de cocina en Rafaela, Santa Fe.",
};

export default function ContactoPage() {
  const { email, address, phone, hours } = siteContact;

  return (
    <main className="flex-1 pb-20 lg:pb-28">
      <Container as="div" className="py-20 lg:py-28">
        <p className="font-mono text-[0.65rem] font-medium uppercase tracking-eyebrow text-terracota">
          Contacto
        </p>

        <div className="mt-12 grid gap-16 lg:grid-cols-[3fr_2fr] lg:items-start lg:gap-x-16 xl:gap-x-24">
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
                  href={mailtoHref()}
                  className="mt-2 inline-block font-body text-[0.72rem] font-light uppercase tracking-[0.18em] text-carbon/70 transition-colors hover:text-terracota"
                >
                  {email}
                </a>
              </div>
              <div>
                <p className="font-mono text-[0.58rem] font-medium uppercase tracking-[0.22em] text-carbon/40">
                  Dirección
                </p>
                <p className="mt-2 max-w-[28ch] font-body text-[0.72rem] font-light uppercase leading-relaxed tracking-[0.18em] text-carbon/70">
                  {address.line}
                </p>
              </div>
              <div>
                <p className="font-mono text-[0.58rem] font-medium uppercase tracking-[0.22em] text-carbon/40">
                  WhatsApp
                </p>
                <a
                  href={whatsappHref()}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="mt-2 inline-block font-body text-[0.72rem] font-light uppercase tracking-[0.18em] text-carbon/70 transition-colors hover:text-terracota"
                >
                  {phone.display}
                </a>
              </div>
              <div>
                <p className="font-mono text-[0.58rem] font-medium uppercase tracking-[0.22em] text-carbon/40">
                  Horarios
                </p>
                <p className="mt-2 max-w-[32ch] font-body text-[0.72rem] font-light leading-relaxed tracking-[0.06em] text-carbon/70">
                  {hours}
                </p>
              </div>
            </div>

            <p className="mt-16 max-w-[46ch] font-body text-[0.9rem] leading-[1.65] text-carbon/55">
              Las reservas de clases van por el{" "}
              <Link
                href="/clases"
                className="text-carbon/75 underline decoration-carbon/25 underline-offset-2 transition-colors hover:text-terracota hover:decoration-terracota/40"
              >
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

      <ContactMap />
    </main>
  );
}
