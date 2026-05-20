import Link from "next/link";

import { siteContact } from "@/lib/site/contact";

export function ContactMap() {
  const { address, map } = siteContact;
  const title = `Menesteres · ${address.street}, ${address.locality}`;

  return (
    <section
      className="relative left-1/2 mt-20 w-screen max-w-none -translate-x-1/2 border-y border-carbon/10 bg-crema-deep/50"
      aria-label="Ubicación en mapa"
    >
      <iframe
        title={title}
        src={map.embedUrl}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        className="h-[min(52vw,400px)] min-h-[220px] max-h-[420px] w-full border-0 grayscale contrast-[0.92] sepia-[0.06] hue-rotate-[-6deg] opacity-[0.94]"
        allowFullScreen
      />
      <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-4 border-t border-carbon/10 px-6 py-4">
        <p className="font-body text-[0.8rem] text-carbon/60">{address.line}</p>
        <Link
          href={map.directionsUrl}
          target="_blank"
          rel="noreferrer noopener"
          className="font-mono text-[0.6rem] font-medium uppercase tracking-eyebrow text-terracota underline decoration-terracota/30 underline-offset-4 transition-colors hover:text-terracota-deep"
        >
          Cómo llegar →
        </Link>
      </div>
    </section>
  );
}

