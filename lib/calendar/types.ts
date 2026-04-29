export type ClassCategory = "adultos" | "ninos" | "eventos";

export type ClassStatus = "available" | "few-spots" | "full" | "cancelled";

export interface ClassEvent {
  id: string;
  slug: string;
  title: string;
  /** ISO date `YYYY-MM-DD` */
  date: string;
  startTime: string;
  endTime: string;
  category: ClassCategory;
  status: ClassStatus;
  spotsLeft: number | null;
  totalSpots: number;
  /** ARS */
  price: number;
  shortDesc: string;
  isHighlighted?: boolean;
}

export interface MonthData {
  year: number;
  month: number;
  monthName: string;
  events: ClassEvent[];
}
