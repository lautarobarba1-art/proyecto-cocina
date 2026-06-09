import Link from "next/link";

import { Logotype } from "@/components/brand/Logotype";
import { Container } from "@/components/layout/Container";
import { mailtoHref, siteContact, whatsappHref } from "@/lib/site/contact";

const LEGAL_LINKS = [
  { label: "Privacidad", href: "/politica-privacidad" },
  { label: "Aviso Legal", href: "/aviso-legal" },
  { label: "Cookies", href: "/politica-de-cookies" },
] as const;

export interface FooterProps {
  className?: string;
}

/** Tipografía de los títulos de columna (DS): 11px / 700 / tracking 0.22em / uppercase / terracota */
const COL_TITLE = "font-sans text-[11px] font-bold uppercase tracking-eyebrow text-terracota";

const NAV_LINKS = [
  { label: "Clases", href: "/clases" },
  { label: "Calendario", href: "/calendario" },
  { label: "Eventos", href: "/contacto?tipo=eventos" },
  { label: "Espacio", href: "/espacio" },
  { label: "Nosotros", href: "/nosotros" },
  { label: "Contacto", href: "/contacto" },
] as const;

function SocialLink({
  href,
  label,
  pending,
}: {
  href: string | null;
  label: string;
  pending?: boolean;
}) {
  if (!href) {
    return (
      <span
        className="footer-link cursor-not-allowed opacity-50"
        aria-disabled="true"
        title="Próximamente"
      >
        {label}
      </span>
    );
  }
  return (
    <a
      className="footer-link"
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      aria-label={pending ? `${label} (próximamente)` : label}
    >
      {label}
    </a>
  );
}

export function Footer({ className }: FooterProps) {
  const { address, email, social } = siteContact;

  return (
    <footer
      className={[
        "footer-surface-deep relative overflow-hidden border-t border-crema/10 bg-carbon py-12 text-crema sm:py-14 lg:py-16",
        className ?? "",
      ].join(" ")}
    >
      <Container as="div" className="relative z-10">
        <div className="grid min-w-0 gap-8 sm:grid-cols-2 sm:gap-x-10 sm:gap-y-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)_minmax(0,0.85fr)] lg:gap-x-12 lg:gap-y-0">
          <div className="flex flex-col gap-3 sm:col-span-2 lg:col-span-1">
            <Logotype asset="brand" variant="default" size="sm" />
            <p className="max-w-[28ch] font-sans text-[12px] font-medium leading-[1.6] text-crema/55">
              {address.line}
              {" · "}
              <a href={mailtoHref()} className="transition-colors hover:text-crema/80">
                {email}
              </a>
            </p>
          </div>

          <div>
            <p className={COL_TITLE}>Explorar</p>
            <ul className="mt-3 grid gap-1 sm:grid-cols-2 sm:gap-x-4 lg:grid-cols-1 lg:gap-1">
              {NAV_LINKS.map(({ label, href }) => (
                <li key={href}>
                  <Link className="footer-link" href={href}>
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className={COL_TITLE}>Seguinos</p>
            <ul className="mt-3 grid gap-1">
              <li>
                <SocialLink href={social.instagram} label="Instagram" pending={!social.instagram} />
              </li>
              <li>
                <SocialLink href={social.whatsapp ?? whatsappHref()} label="WhatsApp" />
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-crema/15 pt-5 sm:mt-10 sm:pt-6">
          <p className="font-sans text-[10px] font-medium uppercase tracking-meta text-crema/40">
            © 2026 Menesteres · Rafaela, Santa Fe
          </p>
          <nav aria-label="Legal" className="flex items-center gap-3">
            {LEGAL_LINKS.map(({ label, href }) => (
              <Link
                key={href}
                href={href}
                className="font-sans text-[10px] font-medium uppercase tracking-meta text-crema/35 transition-colors hover:text-crema/65"
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </Container>
    </footer>
  );
}
