export const DURATION = {
  snap: 0.3,
  editorial: 0.8,
  slow: 1.2,
} as const;

export const HERO_ENTRY = {
  duration: 0.7,
  ease: "easeOut" as const,
  delays: [0.1, 0.35, 0.6] as const,
} as const;

/** Intro full-screen: logo → cortina hacia arriba (home). */
export const SPLASH_INTRO = {
  logoDuration: 0.45,
  /** Segundos tras el montaje antes de mover la cortina. */
  curtainDelay: 1.05,
  curtainDuration: 0.72,
} as const;

/** Stagger del Hero cuando termina la cortina (segundos desde ese instante). */
export const HERO_AFTER_SPLASH_DELAYS = [0.08, 0.28, 0.48] as const;

export const EASE = {
  soft: [0.4, 0, 0.2, 1],
  snap: [0.25, 0.46, 0.45, 0.94],
} as const;

