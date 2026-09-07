import type { ClaseAdmin } from "./clases-queries";

/**
 * Extraído de app/admin/(protected)/clases/page.tsx para poder reusar el
 * mismo criterio de "ocupación" en el dashboard (resumen de próximas
 * clases) sin duplicar la lógica.
 */

export function isClasePast(isoDate: string): boolean {
  const today = new Date().toISOString().slice(0, 10);
  return isoDate < today;
}

export interface StatusInfo {
  label: string;
  className: string;
}

export function getStatusInfo(c: ClaseAdmin): StatusInfo {
  if (c.categoryEvent === "eventos") {
    if (c.isCancelled) {
      return {
        label: "Cancelado",
        className: "bg-gray-100 text-gray-700 border-gray-300",
      };
    }
    if (isClasePast(c.date)) {
      return {
        label: "Pasado",
        className: "bg-blue-50 text-blue-800 border-blue-200",
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
      className: "bg-gray-100 text-gray-700 border-gray-300",
    };
  }
  if (isClasePast(c.date)) {
    return {
      label: "Pasada",
      className: "bg-blue-50 text-blue-800 border-blue-200",
    };
  }
  if (c.spotsLeft <= 0) {
    return {
      label: "Llena",
      className: "bg-red-50 text-red-800 border-red-200",
    };
  }
  if (c.spotsLeft <= Math.max(1, Math.ceil(c.totalSpots * 0.3))) {
    return {
      label: "Pocos cupos",
      className: "bg-yellow-100 text-yellow-900 border-yellow-300",
    };
  }
  return {
    label: "Disponible",
    className: "bg-green-100 text-green-900 border-green-300",
  };
}
