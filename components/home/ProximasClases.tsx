"use client";

import * as React from "react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

export interface Clase {
  id: string;
  titulo: string;
  fecha: Date | string;
  cupos_disponibles: number;
  precio: number;
}

interface UpcomingClassesResponse {
  classes: Clase[];
}

function formatClassDate(date: Date | string): string {
  const parsedDate = typeof date === "string" ? parseISO(date) : date;
  const label = format(parsedDate, "EEE d 'de' MMMM", { locale: es });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(price);
}

function ClassesSkeleton() {
  return (
    <div className="divide-y divide-crema/10" aria-label="Cargando próximas clases">
      {[0, 1, 2].map((item) => (
        <div key={item} className="space-y-2 py-3">
          <div className="h-3 w-28 animate-pulse rounded-pill bg-crema/8" />
          <div className="h-4 w-3/4 animate-pulse rounded-pill bg-crema/8" />
        </div>
      ))}
    </div>
  );
}

export function ProximasClases() {
  const [classes, setClasses] = React.useState<Clase[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const controller = new AbortController();

    async function loadClasses() {
      try {
        const response = await fetch("/api/classes/upcoming", {
          signal: controller.signal,
          cache: "no-store",
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = (await response.json()) as UpcomingClassesResponse;
        setClasses(data.classes);
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          console.error("[ProximasClases]", error);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void loadClasses();
    return () => controller.abort();
  }, []);

  return (
    <div>
      <p className="mb-1 font-sans text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-mute">
        Próximas clases
      </p>
      {loading ? (
        <ClassesSkeleton />
      ) : classes.length === 0 ? (
        <p className="py-3 font-sans text-sm text-mute">
          No hay clases programadas por el momento.
        </p>
      ) : (
        <ul className="divide-y divide-crema/10">
          {classes.map((clase) => {
            const fewSpots = clase.cupos_disponibles <= 3;
            return (
              <li key={clase.id} className="flex items-center justify-between gap-4 py-3">
                <div>
                  <p className="font-sans text-xs font-medium text-mute">
                    {formatClassDate(clase.fecha)}
                  </p>
                  <p className="font-sans text-sm font-semibold text-carbon">{clase.titulo}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-sans text-xs text-mute">{formatPrice(clase.precio)}</p>
                  <p className={["font-sans text-xs", fewSpots ? "text-terracota" : "text-crema/50"].join(" ")}>
                    {clase.cupos_disponibles} cupos
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
