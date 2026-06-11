import type { Metadata } from "next";
import Link from "next/link";

import { Container } from "@/components/layout/Container";

export const metadata: Metadata = {
  title: "Política de Privacidad · Menesteres",
  description:
    "Información sobre el tratamiento de datos personales en el sitio web de Menesteres, conforme a la Ley 25.326 de Protección de Datos Personales.",
  robots: { index: false },
};

export default function PoliticaPrivacidadPage() {
  return (
    <main className="flex-1 pb-24 lg:pb-32">
      <Container as="div" className="py-20 lg:py-28">
        <p className="font-mono text-[0.65rem] font-medium uppercase tracking-eyebrow text-terracota">
          Legal
        </p>

        <h1 className="mt-4 max-w-[22ch] font-display text-[clamp(2rem,5vw,3.25rem)] font-normal leading-[1.1] tracking-tightish text-carbon">
          Política de Privacidad
        </h1>

        <p className="mt-3 font-mono text-[0.6rem] font-medium uppercase tracking-widest text-carbon/40">
          Última actualización: junio de 2026
        </p>

        <div className="mt-14 max-w-[68ch] space-y-10">
          <section>
            <h2 className="font-display text-[1.1rem] font-semibold tracking-tightish text-carbon">
              1. Responsable del tratamiento
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
            </p>
          </section>

          <section>
            <h2 className="font-display text-[1.1rem] font-semibold tracking-tightish text-carbon">
              2. Datos que recopilamos
            </h2>
            <p className="mt-3 font-body text-[0.95rem] leading-[1.8] text-carbon/70">
              Únicamente recopilamos los datos que vos mismo/a nos proporcionás al completar los
              formularios de contacto o consulta de eventos privados:
            </p>
            <ul className="mt-3 list-inside list-disc space-y-1 font-body text-[0.95rem] leading-[1.8] text-carbon/70">
              <li>Nombre</li>
              <li>Dirección de correo electrónico</li>
              <li>Mensaje o descripción del evento</li>
              <li>Fecha tentativa (formulario de eventos)</li>
            </ul>
            <p className="mt-3 font-body text-[0.95rem] leading-[1.8] text-carbon/70">
              No recopilamos datos de facturación, documentos de identidad ni información sensible.
            </p>
          </section>

          <section>
            <h2 className="font-display text-[1.1rem] font-semibold tracking-tightish text-carbon">
              3. Finalidad del tratamiento
            </h2>
            <p className="mt-3 font-body text-[0.95rem] leading-[1.8] text-carbon/70">
              Los datos se utilizan exclusivamente para responder a tu consulta, coordinar reservas
              de clases y gestionar la planificación de eventos privados. No usamos tus datos para
              envío de publicidad no solicitada.
            </p>
          </section>

          <section>
            <h2 className="font-display text-[1.1rem] font-semibold tracking-tightish text-carbon">
              4. Base legal (Ley 25.326)
            </h2>
            <p className="mt-3 font-body text-[0.95rem] leading-[1.8] text-carbon/70">
              El tratamiento se basa en tu consentimiento expreso al enviar el formulario, conforme
              al art. 5 de la Ley 25.326 de Protección de Datos Personales de la República
              Argentina.
            </p>
          </section>

          <section>
            <h2 className="font-display text-[1.1rem] font-semibold tracking-tightish text-carbon">
              5. Conservación de datos
            </h2>
            <p className="mt-3 font-body text-[0.95rem] leading-[1.8] text-carbon/70">
              Conservamos tus datos durante el tiempo necesario para gestionar tu consulta y, como
              máximo, doce (12) meses desde el último contacto. Transcurrido ese plazo, los datos
              son eliminados de nuestros sistemas.
            </p>
          </section>

          <section>
            <h2 className="font-display text-[1.1rem] font-semibold tracking-tightish text-carbon">
              6. Cesión a terceros y transferencia internacional
            </h2>
            <p className="mt-3 font-body text-[0.95rem] leading-[1.8] text-carbon/70">
              No cedemos ni comercializamos tus datos personales a terceros, salvo obligación legal
              expresa. Para operar el sitio utilizamos los siguientes proveedores de infraestructura,
              que actúan como encargados del tratamiento y procesan datos en servidores ubicados fuera
              de la República Argentina (art. 12, Ley 25.326):
            </p>
            <ul className="mt-3 list-inside list-disc space-y-1 font-body text-[0.95rem] leading-[1.8] text-carbon/70">
              <li>
                <strong className="font-semibold text-carbon/90">Supabase Inc.</strong> (Estados Unidos)
                — base de datos y autenticación. Almacena nombre, correo electrónico y teléfono de
                quienes realizan reservas o consultas.
              </li>
              <li>
                <strong className="font-semibold text-carbon/90">Vercel Inc.</strong> (Estados Unidos)
                — alojamiento web y entrega de contenido (CDN). Procesa los datos en tránsito al
                responder cada solicitud al sitio.
              </li>
              <li>
                <strong className="font-semibold text-carbon/90">Resend Inc.</strong> (Estados Unidos)
                — envío de correos electrónicos de confirmación. Recibe nombre y dirección de correo
                para entregar los mensajes transaccionales.
              </li>
            </ul>
            <p className="mt-3 font-body text-[0.95rem] leading-[1.8] text-carbon/70">
              Todos estos proveedores operan bajo acuerdos de confidencialidad y políticas de
              privacidad propias. La transferencia se realiza en el marco del art. 12 de la Ley 25.326
              y su decreto reglamentario.
            </p>
          </section>

          <section>
            <h2 className="font-display text-[1.1rem] font-semibold tracking-tightish text-carbon">
              7. Tus derechos
            </h2>
            <p className="mt-3 font-body text-[0.95rem] leading-[1.8] text-carbon/70">
              En cumplimiento de la Ley 25.326 podés ejercer los derechos de acceso, rectificación,
              supresión y oposición escribiendo a{" "}
              <a
                href="mailto:hola@menesteres.com"
                className="underline decoration-carbon/25 underline-offset-2 transition-colors hover:text-terracota"
              >
                hola@menesteres.com
              </a>
              . Te responderemos dentro de los plazos establecidos por la normativa vigente.
            </p>
            <p className="mt-3 font-body text-[0.95rem] leading-[1.8] text-carbon/70">
              La Dirección Nacional de Protección de Datos Personales (DNPDP) es el organismo de
              control competente.
            </p>
          </section>

          <section>
            <h2 className="font-display text-[1.1rem] font-semibold tracking-tightish text-carbon">
              8. Cookies
            </h2>
            <p className="mt-3 font-body text-[0.95rem] leading-[1.8] text-carbon/70">
              Este sitio usa únicamente cookies técnicas necesarias para el funcionamiento. Podés
              leer más en nuestra{" "}
              <Link
                href="/politica-de-cookies"
                className="underline decoration-carbon/25 underline-offset-2 transition-colors hover:text-terracota"
              >
                Política de Cookies
              </Link>
              .
            </p>
          </section>

          <section>
            <h2 className="font-display text-[1.1rem] font-semibold tracking-tightish text-carbon">
              9. Cambios en esta política
            </h2>
            <p className="mt-3 font-body text-[0.95rem] leading-[1.8] text-carbon/70">
              Podemos actualizar esta política ante cambios normativos o en la forma en que
              tratamos los datos. La fecha de última actualización figura siempre al inicio de esta
              página.
            </p>
          </section>
        </div>
      </Container>
    </main>
  );
}
