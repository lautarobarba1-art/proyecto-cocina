import Link from "next/link";

import { Logotype } from "@/components/brand/Logotype";
import { Tagline } from "@/components/brand/Tagline";
import { Container } from "@/components/layout/Container";

export interface FooterProps {
  className?: string;
}

/** Tipografía de los títulos de columna (DS): 11px / 700 / tracking 0.22em / uppercase / terracota */
const COL_TITLE = "font-sans text-[11px] font-bold uppercase tracking-eyebrow text-terracota";

export function Footer({ className }: FooterProps) {
  return (
    <footer
      className={[
        "footer-surface-deep relative overflow-hidden border-t border-crema/10 bg-carbon py-20 text-crema lg:py-28",
        className ?? "",
      ].join(" ")}
    >
      <Container as="div" className="relative z-10">
        <div className="grid min-w-0 gap-10 sm:grid-cols-2 sm:gap-x-10 sm:gap-y-12 md:gap-14 lg:grid-cols-[2fr_1fr_1fr_1fr] lg:gap-x-16 lg:gap-y-0 xl:gap-20">
          <div className="flex flex-col gap-4">
            <Logotype variant="onDark" size="md" />
            <Tagline className="text-crema/70 text-[12px] tracking-[0.2em]" />
            <p className="mt-2 font-sans text-[13px] font-medium leading-[1.7] text-crema/55">
              San Martín 1234<br />
              Rafaela · Santa Fe · AR<br />
              hola@menesteres.com
            </p>
          </div>

          <div>
            <p className={COL_TITLE}>Visitar</p>
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
                <Link className="footer-link" href="/espacio">
                  Nuestro espacio
                </Link>
              </li>
              <li>
                <Link className="footer-link" href="/nosotros">
                  Nosotros
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className={COL_TITLE}>Reservar</p>
            <ul className="mt-6 grid gap-5 md:gap-3.5">
              <li>
                <Link className="footer-link" href="/clases">
                  Clases adultos
                </Link>
              </li>
              <li>
                <Link className="footer-link" href="/clases?categoria=ninos">
                  Clases niños
                </Link>
              </li>
              <li>
                <Link className="footer-link" href="/contacto?tipo=eventos">
                  Eventos privados
                </Link>
              </li>
              <li>
                <Link className="footer-link" href="/espacio">
                  Alquilar el espacio
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className={COL_TITLE}>Seguinos</p>
            <ul className="mt-6 grid gap-5 md:gap-3.5">
              <li>
                <a className="footer-link" href="#" target="_blank" rel="noreferrer noopener" aria-label="Instagram (próximamente)">
                  Instagram
                </a>
              </li>
              <li>
                <a className="footer-link" href="#" target="_blank" rel="noreferrer noopener" aria-label="WhatsApp (próximamente)">
                  WhatsApp
                </a>
              </li>
              <li>
                <a className="footer-link" href="#" target="_blank" rel="noreferrer noopener" aria-label="Facebook (próximamente)">
                  Facebook
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-16 flex flex-wrap items-center justify-between gap-3 border-t border-crema/15 pt-8">
          <p className="font-sans text-[11px] font-medium uppercase tracking-meta text-crema/40">
            © 2026 Menesteres · Todos los derechos reservados
          </p>
          <p className="font-sans text-[11px] font-medium uppercase tracking-meta text-crema/40">
            Hecho en Rafaela, Santa Fe
          </p>
        </div>
      </Container>
    </footer>
  );
}
