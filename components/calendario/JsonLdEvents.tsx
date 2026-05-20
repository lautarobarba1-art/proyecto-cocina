import type { ClassEvent, ClassStatus } from "@/lib/calendar/types";
import { postalAddressSchema, siteContact } from "@/lib/site/contact";

const VENUE = {
  "@type": "Place",
  name: "Menesteres",
  address: postalAddressSchema(),
} as const;

function toIso(date: string, time: string): string {
  const [h, m] = time.split(":").map(Number);
  return `${date}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00-03:00`;
}

function availabilityUrl(status: ClassStatus): string {
  if (status === "full") return "https://schema.org/SoldOut";
  if (status === "few-spots") return "https://schema.org/LimitedAvailability";
  if (status === "cancelled") return "https://schema.org/Discontinued";
  return "https://schema.org/InStock";
}

function eventToJsonLd(event: ClassEvent): Record<string, unknown> | null {
  if (event.status === "cancelled") return null;

  const startDate = toIso(event.date, event.startTime);
  const endDate = toIso(event.date, event.endTime);

  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    description: event.shortDesc,
    startDate,
    endDate,
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    location: VENUE,
    offers: {
      "@type": "Offer",
      price: String(event.price),
      priceCurrency: "ARS",
      availability: availabilityUrl(event.status),
      url: `${siteContact.siteUrl}/clases/${event.slug}?fecha=${encodeURIComponent(event.date)}`,
    },
  };
}

export interface JsonLdEventsProps {
  events: ClassEvent[];
}

export function JsonLdEvents({ events }: JsonLdEventsProps) {
  const items = events.map(eventToJsonLd).filter((x): x is Record<string, unknown> => Boolean(x));
  if (items.length === 0) return null;

  const payload =
    items.length === 1
      ? items[0]
      : {
          "@context": "https://schema.org",
          "@graph": items.map((item) => {
            const rest = { ...item } as Record<string, unknown>;
            delete rest["@context"];
            return rest;
          }),
        };

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(payload) }} />;
}
