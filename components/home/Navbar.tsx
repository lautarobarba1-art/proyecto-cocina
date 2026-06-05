"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { BrandButton } from "@/components/ui/BrandButton";

const NAV_LINKS = [
  { label: "Clases", href: "/clases" },
  { label: "Eventos", href: "/contacto?tipo=eventos", pathname: "/contacto" },
  { label: "Espacio", href: "/espacio" },
] as const;

function MenesteresMark() {
  return (
    <svg
      aria-hidden="true"
      className="h-8 w-10 shrink-0"
      viewBox="0 0 40 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M4 26a16 16 0 0 1 32 0H4Z" fill="#D65226" />
      <path d="M20 26V4M14 26 10 8M26 26l4-18M9 26 2 15M31 26l7-11" stroke="#FFFAF3" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M3 28h34" stroke="#D65226" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = React.useState(false);
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY >= 60);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  React.useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const solid = pathname !== "/" || scrolled;
  const closeMenu = () => setOpen(false);

  return (
    <header
      className={[
        "fixed inset-x-0 top-0 z-50 text-crema",
        "transition-[background-color,backdrop-filter] duration-300 ease-in-out",
        solid ? "bg-carbon/96 backdrop-blur-md" : "bg-transparent backdrop-blur-none",
      ].join(" ")}
    >
      <div className="flex h-16 items-center justify-between px-5 md:h-[72px] md:px-8">
        <Link
          href="/"
          aria-label="Menesteres, ir al inicio"
          className="inline-flex items-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracota"
        >
          <MenesteresMark />
          <span className="hidden font-sans text-lg font-extrabold tracking-[0.08em] md:inline">
            MENESTERES
          </span>
        </Link>

        <nav aria-label="Navegación principal" className="hidden md:block">
          <ul className="flex items-center gap-8">
            {NAV_LINKS.map((link) => {
              const active = pathname === ("pathname" in link ? link.pathname : link.href);
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={[
                      "font-sans text-sm font-medium text-crema/85 underline-offset-4 transition-colors hover:text-crema hover:underline",
                      active ? "underline" : "",
                    ].join(" ")}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="hidden md:block">
          <BrandButton href="/clases" variant="ghost" size="sm">
            Reservar clase
          </BrandButton>
        </div>

        <button
          type="button"
          aria-label="Abrir menú"
          aria-controls="mobile-menu"
          aria-expanded={open}
          className="inline-flex h-11 w-11 items-center justify-center text-crema focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracota md:hidden"
          onClick={() => setOpen(true)}
        >
          <Menu aria-hidden="true" size={24} />
        </button>
      </div>

      <AnimatePresence>
        {open ? (
          <motion.div
            id="mobile-menu"
            className="fixed inset-0 z-60 min-h-dvh bg-carbon text-crema md:hidden"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <button
              type="button"
              aria-label="Cerrar menú"
              className="absolute right-5 top-4 inline-flex h-11 w-11 items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracota"
              onClick={closeMenu}
            >
              <X aria-hidden="true" size={24} />
            </button>

            <nav aria-label="Menú mobile" className="flex min-h-dvh flex-col items-center justify-center px-5 text-center">
              <ul className="space-y-5">
                {NAV_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="font-sans text-[2rem] font-bold leading-tight text-crema transition-colors hover:text-terracota"
                      onClick={closeMenu}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
              <BrandButton href="/clases" variant="primary" size="lg" className="mt-10" onClick={closeMenu}>
                Reservar clase
              </BrandButton>
              <p className="mt-8 font-serif text-[0.8rem] tracking-widest text-crema/40">
                Sabores que nos encuentran
              </p>
            </nav>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
