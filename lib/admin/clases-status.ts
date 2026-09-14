import type { ClaseAdmin } from "./clases-queries";

/**
 * Extraído de app/admin/(protected)/clases/page.tsx para poder reusar el
 * mismo criterio de "ocupación" en el dashboard (resumen de próximas
 * clases) y en el cron de baja ocupación sin duplicar la lógica.
 */

export function isClasePast(isoDate: string): boolean {
  const today = new Date().toISOString().slice(0, 10);
  return isoDate < today;
}

export interface StatusInfo {
  label: string;
  className: string;
}

/** Solo los campos que el badge de estado necesita. */
export type ClaseStatusInput = Pick<
  ClaseAdmin,
  "categoryEvent" | "isCancelled" | "date" | "spotsLeft" | "totalSpots"
>;

export function getStatusInfo(c: ClaseStatusInput): StatusInfo {
  if (c.categoryEvent === "eventos") {
    if (c.isCancelled) {
      return {
        label: "Cancelado",
        className: "bg-carbon/5 text-mute border-carbon/15",
      };
    }
    if (isClasePast(c.date)) {
      return {
        label: "Pasado",
        className: "bg-carbon/5 text-mute border-carbon/15",
      };
    }
    return {
      label: "Reservado",
      className: "bg-terracota/10 text-terracota border-terracota/30",
    };
  }
  if (c.isCancelled) {
    return {
      label: "Cancelada",
      className: "bg-carbon/5 text-mute border-carbon/15",
    };
  }
  if (isClasePast(c.date)) {
    return {
      label: "Pasada",
      className: "bg-carbon/5 text-mute border-carbon/15",
    };
  }
  if (c.spotsLeft <= 0) {
    return {
      label: "Llena",
      className: "bg-rojo/5 text-rojo border-rojo/30",
    };
  }
  if (c.spotsLeft <= Math.max(1, Math.ceil(c.totalSpots * 0.3))) {
    return {
      label: "Pocos cupos",
      className: "bg-terracota-soft/20 text-terracota-deep border-terracota-soft/50",
    };
  }
  return {
    label: "Disponible",
    className: "bg-exito-soft text-exito border-exito/30",
  };
}
