"use client";

import * as React from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

import { Logotype } from "@/components/brand/Logotype";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/Button";
import { useReducedMotion } from "@/lib/useReducedMotion";

export interface NavbarProps {
  className?: string;
}

const NAV = [
  { label: "Clases", href: "/clases" },
  { label: "Calendario", href: "/calendario" },
  { label: "Nosotros", href: "/nosotros" },
  { label: "Nuestro espacio", href: "/espacio" },
  { label: "Contacto", href: "/contacto" },
] as const;

const CTA = { label: "Reservar", href: "/clases" } as const;

function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = React.useState<boolean>(false);

  React.useEffect(() => {
    const media = window.matchMedia("(max-width: 899px)");
    const onChange = () => setIsMobile(media.matches);
    onChange();
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  return isMobile;
}

function useNavbarVisible(): boolean {
  const _reduced = useReducedMotion();
  const [visible, setVisible] = React.useState<boolean>(false);

  React.useEffect(() => {
    const hero = document.getElementById("hero");
    const getThreshold = () => {
      const heroHeight = hero?.getBoundingClientRect().height ?? window.innerHeight;
      return heroHeight * 0.8;
    };

    const onScroll = () => {
      const threshold = getThreshold();
      setVisible(window.scrollY > threshold);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [_reduced]);

  return visible;
}

/**
 * Tipografía de los links del DS:
 *  font-sans / 12px / 600 / tracking 0.1em / uppercase
 *  underline 2px terracota animado en hover
 */
const NAV_LINK_BASE =
  "relative inline-block py-1 font-sans text-[12px] font-semibold uppercase leading-tight tracking-[0.1em] transition-colors duration-300 ease-snap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracota/40";

const NAV_LINK_DARK = "text-crema/75 hover:text-crema";

const NAV_LINK_UNDERLINE =
  "after:pointer-events-none after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-0 after:bg-terracota after:transition-[width] after:duration-300 after:ease-snap hover:after:w-full";

export function Navbar({ className }: NavbarProps) {
  const reduced = useReducedMotion();
  const isMobile = useIsMobile();
  const visible = useNavbarVisible();
  const [open, setOpen] = React.useState<boolean>(false);

  React.useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  React.useEffect(() => {
    if (!isMobile) setOpen(false);
  }, [isMobile]);

  const overlayId = "menu-overlay";
  /** En desktop la barra se esconde hasta pasar el hero; en mobile siempre visible (hamburguesa). */
  const barHidden = !isMobile && !visible;

  return (
    <header className={["fixed left-0 right-0 top-0 z-50", className ?? ""].join(" ")}>
      <div
        className={[
          "transition-all duration-400 ease-soft",
          barHidden ? "pointer-events-none -translate-y-full opacity-0" : "translate-y-0 opacity-100",
        ].join(" ")}
      >
        <div className="bg-carbon/95 backdrop-blur-md">
          <Container as="div" className="h-16">
            <div className="flex h-full items-center justify-between gap-6">
              <Link
                href="/"
                className="focus-visible:outline-none focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-terracota/40"
                aria-label="Ir al inicio"
              >
                <Logotype variant="onDark" size="xs" />
              </Link>

              {isMobile ? (
                <button
                  type="button"
                  onClick={() => setOpen((v) => !v)}
                  aria-controls={overlayId}
                  aria-expanded={open}
                  aria-label={open ? "Cerrar menú" : "Abrir menú"}
                  className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-sm border border-crema/20 bg-transparent px-3 py-3 text-crema transition-colors duration-300 ease-snap hover:border-crema/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracota/40"
                >
                  {open ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
                </button>
              ) : (
                <nav aria-label="Navegación principal" className="ml-auto flex items-center gap-10">
                  <ul className="flex items-center gap-8">
                    {NAV.map((item) => (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          className={[NAV_LINK_BASE, NAV_LINK_DARK, NAV_LINK_UNDERLINE].join(" ")}
                        >
                          {item.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                  <Button href={CTA.href} variant="primary" size="sm">
                    {CTA.label}
                  </Button>
                </nav>
              )}
            </div>
          </Container>
        </div>
      </div>

      {isMobile && (
        <div
          id={overlayId}
          className={[
            "fixed inset-0 z-60 min-h-dvh overflow-y-auto overscroll-contain bg-carbon text-crema backdrop-blur-sm transition-opacity duration-400 ease-soft",
            open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
          ].join(" ")}
          aria-hidden={!open}
        >
          <Container as="div" className="flex min-h-dvh flex-col">
            <div className="sticky top-0 z-10 -mx-4 bg-carbon/95 px-4 backdrop-blur-md sm:-mx-6 sm:px-6 lg:-mx-10 lg:px-10">
              <div className="flex h-16 items-center justify-between">
                <Link
                  href="/"
                  onClick={() => setOpen(false)}
                  className="focus-visible:outline-none focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-terracota/40"
                  aria-label="Ir al inicio"
                >
                  <Logotype variant="onDark" size="xs" />
                </Link>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Cerrar menú"
                  className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-sm border border-crema/20 bg-transparent px-3 py-3 text-crema transition-colors duration-300 ease-snap hover:border-crema/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracota/40"
                >
                  <X className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
            </div>

            <nav aria-label="Menú" className="flex-1 py-10">
              <ul className="grid gap-6">
                {NAV.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className="block min-h-11 py-1 font-sans text-3xl font-extrabold uppercase leading-tight tracking-tightish text-crema transition-colors duration-300 ease-snap hover:text-terracota-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracota/40 sm:text-4xl md:text-5xl"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="border-t border-crema/15 py-8">
              <Button
                href={CTA.href}
                variant="primary"
                size="lg"
                className="w-full"
                onClick={() => setOpen(false)}
              >
                {CTA.label}
              </Button>
            </div>
          </Container>
        </div>
      )}
    </header>
  );
}
