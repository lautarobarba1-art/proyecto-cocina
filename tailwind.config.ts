import type { Config } from "tailwindcss";

/**
 * Menesteres — Design Tokens (manual oficial v2)
 *
 * Mantenemos los nombres semánticos heredados (terracota / carbon / crema)
 * porque están referenciados en ~30+ archivos. Los valores se actualizan
 * para alinear con el design system oficial:
 *   --m-orange       → terracota.DEFAULT
 *   --m-orange-deep  → terracota.deep
 *   --m-orange-light → terracota.soft (uso editorial sobre fondos oscuros)
 *   --m-cream-warm   → crema.deep
 *   --m-black        → carbon.DEFAULT
 *   --m-cream        → carbon.cream / crema.DEFAULT
 *   --m-olive        → oliva
 *   --m-brown        → marron (nuevo)
 *   --m-red          → rojo (nuevo)
 *   --m-mute         → mute (nuevo: texto secundario)
 *   --m-line         → line (nuevo: divisores cálidos)
 */
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        terracota: {
          DEFAULT: "#D65226",
          deep: "#B8421A",
          soft: "#F8AB50",
          muted: "#F2D9CC",
        },
        carbon: {
          DEFAULT: "#141414",
          soft: "#2D2520",
        },
        crema: {
          DEFAULT: "#FFFAF3",
          deep: "#F5E8D4",
          light: "#FFFCF7",
        },
        oliva: "#696027",
        marron: "#813408",
        rojo: "#A11506",
        mute: "#8A7B6A",
        line: "#E8D9C3",
      },
      fontFamily: {
        display: ["var(--font-montserrat)", "system-ui", "sans-serif"],
        body: ["var(--font-montserrat)", "system-ui", "sans-serif"],
        sans: ["var(--font-montserrat)", "system-ui", "sans-serif"],
        serif: ["var(--font-cinzel)", "Copperplate", "serif"],
        script: ["var(--font-cinzel)", "Copperplate", "serif"],
        mono: ["var(--font-montserrat)", "system-ui", "sans-serif"],
      },
      letterSpacing: {
        tighter: "-0.025em",
        tightish: "-0.015em",
        editorial: "0.05em",
        caps: "0.12em",
        meta: "0.2em",
        eyebrow: "0.22em",
        hero: "0.3em",
      },
      borderRadius: {
        sm: "4px",
        DEFAULT: "8px",
        md: "8px",
        lg: "16px",
        pill: "999px",
      },
      boxShadow: {
        "brand-sm": "0 2px 4px rgba(214, 82, 38, 0.08)",
        "brand-md": "0 6px 20px rgba(20, 20, 20, 0.10)",
        "brand-lg": "0 16px 48px rgba(20, 20, 20, 0.18)",
        "brand-orange": "0 8px 32px rgba(214, 82, 38, 0.32)",
        "brand-orange-hover": "0 12px 36px rgba(214, 82, 38, 0.40)",
      },
      transitionTimingFunction: {
        snap: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
        soft: "cubic-bezier(0.4, 0, 0.2, 1)",
        out: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
};

export default config;
