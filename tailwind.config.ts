import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        terracota: {
          DEFAULT: "#B84A26",
          deep: "#8B3818",
          soft: "#D8714F",
          muted: "#F2D9CC",
        },
        carbon: {
          DEFAULT: "#1A1614",
          soft: "#2D2520",
        },
        crema: {
          DEFAULT: "#F0E6D2",
          deep: "#E5D8BD",
          light: "#F8F2E4",
        },
        oliva: "#5C6B3E",
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "Georgia", "serif"],
        body: ["var(--font-dm-sans)", "system-ui", "sans-serif"],
        script: ["var(--font-caveat)", "cursive"],
        mono: ["var(--font-jetbrains)", "monospace"],
      },
      letterSpacing: {
        tighter: "-0.02em",
        tightish: "-0.01em",
        editorial: "0.04em",
        meta: "0.18em",
        eyebrow: "0.22em",
        hero: "0.4em",
      },
      borderRadius: {
        sm: "2px",
        DEFAULT: "3px",
        md: "4px",
      },
      transitionTimingFunction: {
        snap: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
        soft: "cubic-bezier(0.4, 0, 0.2, 1)",
      },
    },
  },
};

export default config;

