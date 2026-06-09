import type { Metadata } from "next";
import Link from "next/link";

import { Container } from "@/components/layout/Container";

export const metadata: Metadata = {
  title: "Política de Cookies · Menesteres",
  description:
    "Información sobre las cookies que utiliza el sitio web de Menesteres y cómo gestionarlas.",
  robots: { index: false },
};

export default function PoliticaDeCookiesPage() {
  return (
    <main className="flex-1 pb-24 lg:pb-32">
      <Container as="div" className="py-20 lg:py-28">
        <p className="font-mono text-[0.65rem] font-medium uppercase tracking-eyebrow text-terracota">
          Legal
        </p>

        <h1 className="mt-4 max-w-[22ch] font-display text-[clamp(2rem,5vw,3.25rem)] font-normal leading-[1.1] tracking-tightish text-carbon">
          Política de Cookies
        </h1>

        <p className="mt-3 font-mono text-[0.6rem] font-medium uppercase tracking-widest text-carbon/40">
          Última actualización: junio de 2026
        </p>

        <div className="mt-14 max-w-[68ch] space-y-10">
          <section>
            <h2 className="font-display text-[1.1rem] font-semibold tracking-tightish text-carbon">
              1. ¿Qué son las cookies?
            </h2>
            <p className="mt-3 font-body text-[0.95rem] leading-[1.8] text-carbon/70">
              Las cookies son pequeños archivos de texto que un sitio web almacena en tu dispositivo
              cuando lo visitás. Permiten que el sitio recuerde información entre páginas o visitas.
            </p>
          </section>

          <section>
            <h2 className="font-display text-[1.1rem] font-semibold tracking-tightish text-carbon">
              2. Cookies que usamos
            </h2>
            <p className="mt-3 font-body text-[0.95rem] leading-[1.8] text-carbon/70">
              Este sitio utiliza únicamente <strong className="font-semibold text-carbon/90">cookies técnicas necesarias</strong> para
              su funcionamiento básico. No usamos cookies de rastreo, publicidad ni analítica de
              terceros.
            </p>

            <div className="mt-5 overflow-x-auto rounded border border-carbon/10">
              <table className="w-full min-w-[400px] text-left">
                <thead>
                  <tr className="border-b border-carbon/10 bg-carbon/[0.03]">
                    <th className="px-4 py-3 font-mono text-[0.6rem] font-semibold uppercase tracking-widest text-carbon/50">
                      Nombre
                    </th>
                    <th className="px-4 py-3 font-mono text-[0.6rem] font-semibold uppercase tracking-widest text-carbon/50">
                      Tipo
                    </th>
                    <th className="px-4 py-3 font-mono text-[0.6rem] font-semibold uppercase tracking-widest text-carbon/50">
                      Finalidad
                    </th>
                    <th className="px-4 py-3 font-mono text-[0.6rem] font-semibold uppercase tracking-widest text-carbon/50">
                      Duración
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-carbon/10">
                    <td className="px-4 py-3 font-mono text-[0.75rem] text-carbon/80">
                      sb-* (sesión)
                    </td>
                    <td className="px-4 py-3 font-body text-[0.85rem] text-carbon/70">
                      Técnica
                    </td>
                    <td className="px-4 py-3 font-body text-[0.85rem] text-carbon/70">
                      Gestión de sesión de usuario autenticado
                    </td>
                    <td className="px-4 py-3 font-body text-[0.85rem] text-carbon/70">
                      Sesión
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-mono text-[0.75rem] text-carbon/80">
                      __Secure-next-auth*
                    </td>
                    <td className="px-4 py-3 font-body text-[0.85rem] text-carbon/70">
                      Técnica
                    </td>
                    <td className="px-4 py-3 font-body text-[0.85rem] text-carbon/70">
                      Navegación segura y protección CSRF
                    </td>
                    <td className="px-4 py-3 font-body text-[0.85rem] text-carbon/70">
                      Sesión
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="font-display text-[1.1rem] font-semibold tracking-tightish text-carbon">
              3. Cookies de terceros
            </h2>
            <p className="mt-3 font-body text-[0.95rem] leading-[1.8] text-carbon/70">
              El sitio no instala cookies de publicidad ni de redes sociales. El mapa de ubicación
              en la página de Contacto es servido por Google Maps; su uso puede generar cookies
              propias de Google sujetas a la{" "}
              <a
                href="https://policies.google.com/privacy"
                target="_blank"
                rel="noreferrer noopener"
                className="underline decoration-carbon/25 underline-offset-2 transition-colors hover:text-terracota"
              >
                Política de Privacidad de Google
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="font-display text-[1.1rem] font-semibold tracking-tightish text-carbon">
              4. Cómo gestionar o desactivar las cookies
            </h2>
            <p className="mt-3 font-body text-[0.95rem] leading-[1.8] text-carbon/70">
              Podés configurar tu navegador para bloquear o eliminar cookies en cualquier momento.
              Ten en cuenta que desactivar las cookies técnicas puede afectar el funcionamiento del
              sitio.
            </p>
            <ul className="mt-3 list-inside list-disc space-y-1 font-body text-[0.95rem] leading-[1.8] text-carbon/70">
              <li>Chrome: Configuración → Privacidad → Cookies y otros datos de sitios</li>
              <li>Firefox: Opciones → Privacidad y seguridad → Cookies y datos del sitio</li>
              <li>Safari: Preferencias → Privacidad → Gestionar datos de sitios web</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-[1.1rem] font-semibold tracking-tightish text-carbon">
              5. Más información
            </h2>
            <p className="mt-3 font-body text-[0.95rem] leading-[1.8] text-carbon/70">
              Para cualquier consulta sobre el uso de cookies escribinos a{" "}
              <a
                href="mailto:hola@menesteres.com"
                className="underline decoration-carbon/25 underline-offset-2 transition-colors hover:text-terracota"
              >
                hola@menesteres.com
              </a>
              . Podés leer también nuestra{" "}
              <Link
                href="/politica-privacidad"
                className="underline decoration-carbon/25 underline-offset-2 transition-colors hover:text-terracota"
              >
                Política de Privacidad
              </Link>
              .
            </p>
          </section>
        </div>
      </Container>
    </main>
  );
}
