import Link from "next/link";

import { Logotype } from "@/components/brand/Logotype";
import { Tagline } from "@/components/brand/Tagline";
import { Container } from "@/components/layout/Container";

export interface FooterProps {
  className?: string;
}

export function Footer({ className }: FooterProps) {
  return (
    <footer
      className={[
        "footer-surface-deep border-t border-crema-light/10 bg-terracota-deep py-20 text-crema-light lg:py-28",
        className ?? "",
      ].join(" ")}
    >
      <Container as="div">
        <div className="grid min-w-0 gap-10 sm:grid-cols-2 sm:gap-x-10 sm:gap-y-12 md:gap-14 lg:grid-cols-[1.3fr_1fr_1fr_1fr] lg:gap-x-16 lg:gap-y-0 xl:gap-20">
          <div>
            <div className="text-[1.25rem]">
              <Logotype variant="onDark" />
            </div>
            <div className="mt-4">
              <Tagline className="text-crema-light/90" />
            </div>
            <p className="mt-6 font-mono text-[0.75rem] font-medium uppercase tracking-meta text-crema-light/55">
              San Martín 1234, Rafaela, Santa Fe
            </p>
          </div>

          <div>
            <p className="font-mono text-[0.75rem] font-medium uppercase tracking-eyebrow text-terracota-soft">
              Explorar
            </p>
            <ul className="mt-6 grid gap-4 md:gap-3">
              <li>
                <Link className="footer-link" href="/clases">
                  Clases
                </Link>
              </li>
              <li>
                <Link className="footer-link" href="/calendario">
                  Calendario
                </Link>
              </li>
              <li>
                <Link className="footer-link" href="/recetas">
                  Recetas
                </Link>
              </li>
              <li>
                <Link className="footer-link" href="/espacio">
                  Nuestro espacio
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="font-mono text-[0.75rem] font-medium uppercase tracking-eyebrow text-terracota-soft">
              Contacto
            </p>
            <ul className="mt-6 grid gap-5 md:gap-3.5">
              <li>
                <Link className="footer-link" href="/clases">
                  Reservar clase
                </Link>
              </li>
              <li>
                <Link className="footer-link" href="/contacto?tipo=eventos">
                  Eventos privados
                </Link>
              </li>
              <li>
                <a className="footer-link" href="mailto:hola@menesteres.com">
                  hola@menesteres.com
                </a>
              </li>
            </ul>
          </div>

          <div>
            <p className="font-mono text-[0.75rem] font-medium uppercase tracking-eyebrow text-terracota-soft">
              Redes
            </p>
            <ul className="mt-6 grid gap-5 md:gap-3.5">
              <li>
                <a className="footer-link" href="#" rel="noreferrer">
                  Instagram
                </a>
              </li>
              <li>
                <a className="footer-link" href="#" rel="noreferrer">
                  Facebook
                </a>
              </li>
              <li>
                <a className="footer-link" href="#" rel="noreferrer">
                  WhatsApp
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-16 border-t border-crema-light/15 pt-8">
          <p className="font-mono text-[0.75rem] font-medium uppercase tracking-meta text-crema-light/50">
            © 2026 Menesteres · Hecho en Rafaela, Santa Fe
          </p>
        </div>
      </Container>
    </footer>
  );
}

