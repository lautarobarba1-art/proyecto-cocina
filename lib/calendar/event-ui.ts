import type { ClassEvent } from "@/lib/calendar/types";
import { isPastClassDate } from "@/lib/calendar/helpers";

export function isPrivateCalendarEvent(event: ClassEvent): boolean {
  return event.category === "eventos";
}

export function calendarEventStatusPill(event: ClassEvent): {
  label: string;
  className: string;
} {
  if (isPrivateCalendarEvent(event)) {
    if (isPastClassDate(event.date)) {
      return {
        label: "Finalizado",
        className: "border border-carbon/25 text-carbon/45",
      };
    }
    if (event.status === "cancelled") {
      return { label: "Cancelado", className: "border border-carbon/20 text-carbon/45" };
    }
    return {
      label: "Espacio reservado",
      className: "border border-carbon/30 bg-crema-deep/50 text-carbon/65",
    };
  }

  if (isPastClassDate(event.date)) {
    return { label: "Finalizada", className: "border border-carbon/25 text-carbon/45" };
  }
  if (event.status === "full") {
    return { label: "Lleno", className: "border border-carbon/40 bg-transparent text-carbon/60" };
  }
  if (event.status === "cancelled") {
    return { label: "Cancelada", className: "border border-carbon/20 text-carbon/45" };
  }
  if (event.status === "few-spots") {
    return { label: "Pocos lugares", className: "bg-terracota text-crema" };
  }
  if (event.spotsLeft != null) {
    return { label: `${event.spotsLeft} cupos`, className: "bg-carbon text-crema" };
  }
  return { label: "Cupos", className: "bg-carbon text-crema" };
}

export function calendarEventHref(event: ClassEvent): string {
  return `/clases/${event.slug}?fecha=${encodeURIComponent(event.date)}`;
}
