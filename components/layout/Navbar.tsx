"use client";

import * as React from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

import { Logotype } from "@/components/brand/Logotype";
import { Container } from "@/components/layout/Container";
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
  const reduced = useReducedMotion();
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
  }, [reduced]);

  return visible;
}

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
        <div className="bg-carbon/92 backdrop-blur-md">
          <Container as="div" className="h-16">
            <div className="flex h-full items-center justify-between gap-6">
              <Link
                href="/"
                className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracota/40"
                aria-label="Ir al inicio"
              >
                <Logotype variant="onDark" className="text-[1.05rem] tracking-editorial" />
              </Link>

              {isMobile ? (
                <button
                  type="button"
                  onClick={() => setOpen((v) => !v)}
                  aria-controls={overlayId}
                  aria-expanded={open}
                  aria-label={open ? "Cerrar menú" : "Abrir menú"}
                  className="inline-flex min-h-11 min-w-11 items-center justify-center border border-crema-light/20 bg-transparent px-3 py-3 text-crema-light transition-colors duration-300 ease-snap hover:border-crema-light/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracota/40"
                >
                  {open ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
                </button>
              ) : (
                <nav aria-label="Navegación principal" className="ml-auto flex items-center gap-8">
                  <ul className="flex items-center gap-8">
                    {NAV.map((item) => (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          className="font-display text-[1.1rem] font-normal leading-tight tracking-tightish text-crema-light/95 transition-colors duration-300 ease-snap hover:text-terracota-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracota/40"
                        >
                          {item.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={CTA.href}
                    className="inline-flex items-center justify-center rounded-sm bg-terracota px-5 py-2 font-display text-[1.05rem] font-normal leading-none tracking-tightish text-crema shadow-sm transition-colors duration-300 ease-snap hover:bg-terracota-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracota-soft/50 focus-visible:ring-offset-2 focus-visible:ring-offset-carbon"
                  >
                    {CTA.label}
                  </Link>
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
            "fixed inset-0 z-60 min-h-dvh overflow-y-auto overscroll-contain bg-carbon text-crema-light backdrop-blur-sm transition-opacity duration-400 ease-soft",
            open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
          ].join(" ")}
          aria-hidden={!open}
        >
          <Container as="div" className="flex min-h-dvh flex-col">
            <div className="sticky top-0 z-10 -mx-4 bg-carbon/92 px-4 backdrop-blur-md sm:-mx-6 sm:px-6 lg:-mx-10 lg:px-10">
              <div className="flex h-16 items-center justify-between">
              <Link
                href="/"
                onClick={() => setOpen(false)}
                className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracota/40"
                aria-label="Ir al inicio"
              >
                <Logotype variant="onDark" className="text-[1.05rem] tracking-editorial" />
              </Link>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Cerrar menú"
                className="inline-flex min-h-11 min-w-11 items-center justify-center border border-crema-light/20 bg-transparent px-3 py-3 text-crema-light transition-colors duration-300 ease-snap hover:border-crema-light/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracota/40"
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
                      className="block min-h-11 py-1 font-display text-3xl font-normal leading-tight tracking-tightish text-crema-light transition-colors duration-300 ease-snap hover:text-terracota-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracota/40 sm:text-4xl md:text-5xl"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="border-t border-crema-light/15 py-8">
              <Link
                href={CTA.href}
                onClick={() => setOpen(false)}
                className="inline-flex w-full items-center justify-center rounded-sm bg-terracota px-6 py-3 font-display text-[1.35rem] font-normal leading-none tracking-tightish text-crema shadow-sm transition-colors duration-300 ease-snap hover:bg-terracota-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracota-soft/50 focus-visible:ring-offset-2 focus-visible:ring-offset-carbon"
              >
                {CTA.label}
              </Link>
              <p className="mt-4 font-mono text-[0.75rem] font-medium uppercase tracking-meta text-crema-light/60">
                {reduced ? "Animaciones reducidas" : "Menú"}
              </p>
            </div>
          </Container>
        </div>
      )}
    </header>
  );
}

