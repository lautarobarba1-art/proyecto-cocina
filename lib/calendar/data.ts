/**
 * TODO: migrar a CMS / API — hoy datos mock V1.
 */

import { emptyMonth, monthNameEs } from "@/lib/calendar/helpers";
import type { ClassEvent, MonthData } from "@/lib/calendar/types";

export const ALL_EVENTS: ClassEvent[] = [
  {
    id: "e-pastas-2026-04-05",
    slug: "pasta-fresca-en-casa",
    title: "Pastas frescas a mano",
    date: "2026-04-05",
    startTime: "18:00",
    endTime: "21:00",
    category: "adultos",
    status: "available",
    spotsLeft: 8,
    totalSpots: 12,
    price: 40000,
    shortDesc: "Rodillo, manos y salsas clásicas.",
    isHighlighted: true,
  },
  {
    id: "e-masa-2026-04-06",
    slug: "masa-madre-y-fermentacion",
    title: "Masa madre y fermentación",
    date: "2026-04-06",
    startTime: "10:00",
    endTime: "13:30",
    category: "adultos",
    status: "few-spots",
    spotsLeft: 2,
    totalSpots: 10,
    price: 45000,
    shortDesc: "Levadura natural y hogaza.",
  },
  {
    id: "e-ninos-2026-04-08",
    slug: "empanadas-norte",
    title: "Empanadas (familias)",
    date: "2026-04-08",
    startTime: "16:00",
    endTime: "18:30",
    category: "ninos",
    status: "available",
    spotsLeft: 6,
    totalSpots: 8,
    price: 38000,
    shortDesc: "Repulgue y horno en equipo.",
  },
  {
    id: "e-evento-2026-04-10",
    slug: "vegetariano-de-estacion",
    title: "Cena privada — vegetariano",
    date: "2026-04-10",
    startTime: "20:00",
    endTime: "23:30",
    category: "eventos",
    status: "full",
    spotsLeft: null,
    totalSpots: 14,
    price: 0,
    shortDesc: "Evento cerrado.",
  },
  {
    id: "e-sushi-2026-04-12",
    slug: "sushi-para-principiantes",
    title: "Sushi para principiantes",
    date: "2026-04-12",
    startTime: "18:00",
    endTime: "21:00",
    category: "adultos",
    status: "available",
    spotsLeft: 10,
    totalSpots: 10,
    price: 55000,
    shortDesc: "Arroz, nigiris y rolls firmes.",
  },
  {
    id: "e-chocolate-2026-04-15",
    slug: "chocolate-de-origen",
    title: "Chocolate de origen",
    date: "2026-04-15",
    startTime: "18:30",
    endTime: "20:30",
    category: "adultos",
    status: "cancelled",
    spotsLeft: null,
    totalSpots: 8,
    price: 44000,
    shortDesc: "Sesión reprogramada.",
  },
  {
    id: "e-asado-2026-04-19",
    slug: "asado-y-guarniciones",
    title: "Asado y guarniciones",
    date: "2026-04-19",
    startTime: "11:00",
    endTime: "14:30",
    category: "adultos",
    status: "few-spots",
    spotsLeft: 3,
    totalSpots: 12,
    price: 48000,
    shortDesc: "Parilla y tiempos.",
  },
  {
    id: "e-pasteleria-2026-04-22",
    slug: "pasteleria-fina-clasica",
    title: "Pastelería fina clásica",
    date: "2026-04-22",
    startTime: "10:00",
    endTime: "14:00",
    category: "adultos",
    status: "available",
    spotsLeft: 5,
    totalSpots: 8,
    price: 52000,
    shortDesc: "Capas, cremas y montaje.",
  },
  {
    id: "e-marzo-2026-03-28",
    slug: "pasta-fresca-en-casa",
    title: "Pastas frescas a mano",
    date: "2026-03-28",
    startTime: "18:00",
    endTime: "21:00",
    category: "adultos",
    status: "available",
    spotsLeft: 4,
    totalSpots: 12,
    price: 40000,
    shortDesc: "Última fecha de marzo.",
  },
];

export async function getMonthEvents(year: number, month: number): Promise<MonthData> {
  const filtered = ALL_EVENTS.filter((e) => {
    const d = new Date(e.date + "T12:00:00");
    return d.getFullYear() === year && d.getMonth() + 1 === month;
  });
  if (filtered.length === 0) {
    return emptyMonth(year, month);
  }
  return {
    year,
    month,
    monthName: monthNameEs(month),
    events: filtered.sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime)),
  };
}
