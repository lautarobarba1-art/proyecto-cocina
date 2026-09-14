"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoutButton } from "../LogoutButton";

/**
 * AdminNavLinks — header completo del panel (marca + nav + identidad).
 * Desktop: fila horizontal con el link activo subrayado. Mobile: la marca
 * muestra la sección actual debajo y el resto vive en un drawer detrás de
 * un botón hamburguesa, para no romper el layout con wrap de varias líneas.
 */

const LINKS = [
  { href: "/admin/reservas", label: "Reservas" },
  { href: "/admin/clases", label: "Calendario" },
  { href: "/admin/inquiries", label: "Consultas" },
  { href: "/admin/notificaciones", label: "Notificaciones" },
  { href: "/admin/recetas", label: "Recetas" },
  { href: "/admin/recetas/desafio", label: "Desafío" },
];

export function AdminNavLinks({ email }: { email: string }) {
  const pathname = usePathname() ?? "";
  const [open, setOpen] = React.useState(false);

  // Con rutas anidadas (ej. /admin/recetas/desafio dentro de /admin/recetas)
  // tomamos el link más específico que matchea, para que solo uno quede
  // marcado como activo a la vez.
  const activeHref = LINKS.map((l) => l.href)
    .filter((href) => pathname === href || pathname.startsWith(`${href}/`))
    .sort((a, b) => b.length - a.length)[0];
  const activeLabel = LINKS.find((l) => l.href === activeHref)?.label;

  React.useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <div className="flex items-center justify-between gap-4 py-3 sm:py-4">
      <div>
        <Link
          href="/admin"
          className="font-mono text-[0.7rem] font-medium uppercase tracking-eyebrow text-carbon"
        >
          Menesteres · Admin
        </Link>
        {activeLabel && (
          <p className="mt-0.5 font-sans text-[0.8rem] text-carbon/60 sm:hidden">
            {activeLabel}
          </p>
        )}
      </div>

      {/* Desktop: nav + identidad en línea */}
      <nav className="hidden items-center gap-6 sm:flex">
        {LINKS.map((link) => {
          const isActive = link.href === activeHref;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={[
                "border-b-2 pb-0.5 font-sans text-[0.85rem] transition",
                isActive
                  ? "border-terracota text-carbon"
                  : "border-transparent text-carbon/70 hover:text-carbon",
              ].join(" ")}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
      <div className="hidden items-center gap-3 sm:flex">
        <span className="font-sans text-[0.8rem] text-carbon/50">{email}</span>
        <LogoutButton />
      </div>

      {/* Mobile: botón hamburguesa */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Abrir menú"
        className="flex h-9 w-9 items-center justify-center text-carbon sm:hidden"
      >
        <span aria-hidden="true" className="text-xl leading-none">
          ☰
        </span>
      </button>

      {open && (
        <div className="fixed inset-0 z-[10000] sm:hidden">
          <div
            className="absolute inset-0 bg-carbon/40"
            role="presentation"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-x-0 top-0 bg-white shadow-brand-lg">
            <div className="flex items-center justify-between border-b border-carbon/10 px-4 py-3">
              <span className="font-mono text-[0.7rem] font-medium uppercase tracking-eyebrow text-carbon">
                Menesteres · Admin
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Cerrar menú"
                className="text-xl leading-none text-carbon"
              >
                ×
              </button>
            </div>
            <nav className="flex flex-col divide-y divide-carbon/5">
              {LINKS.map((link) => {
                const isActive = link.href === activeHref;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className={[
                      "flex items-center justify-between px-4 py-3 font-sans text-[0.9rem]",
                      isActive ? "font-medium text-carbon" : "text-carbon/70",
                    ].join(" ")}
                  >
                    {link.label}
                    {isActive && (
                      <span className="h-1.5 w-1.5 rounded-full bg-terracota" />
                    )}
                  </Link>
                );
              })}
            </nav>
            <div className="flex items-center justify-between border-t border-carbon/10 px-4 py-3">
              <span className="font-sans text-[0.8rem] text-carbon/50">{email}</span>
              <LogoutButton />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
