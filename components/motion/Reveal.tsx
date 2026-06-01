"use client";

import * as React from "react";
import {
  motion,
  useInView,
  type HTMLMotionProps,
  type Variants,
} from "framer-motion";

import { REVEAL, revealTransition } from "@/lib/motion";
import { useReducedMotion } from "@/lib/useReducedMotion";

export type RevealVariant = "fadeUp" | "fadeIn" | "scaleIn" | "slideRight" | "slideLeft";

type ViewportMargin = NonNullable<Parameters<typeof useInView>[1]>["margin"];

const REVEAL_VARIANTS: Record<RevealVariant, Variants> = {
  fadeUp: {
    hidden: { opacity: 0, y: REVEAL.y },
    visible: { opacity: 1, y: 0 },
  },
  fadeIn: {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  },
  scaleIn: {
    hidden: { opacity: 0, scale: 0.96 },
    visible: { opacity: 1, scale: 1 },
  },
  slideRight: {
    hidden: { opacity: 0, x: REVEAL.x },
    visible: { opacity: 1, x: 0 },
  },
  slideLeft: {
    hidden: { opacity: 0, x: -REVEAL.x },
    visible: { opacity: 1, x: 0 },
  },
};

const MOTION_TAGS = {
  div: motion.div,
  p: motion.p,
  h2: motion.h2,
  h3: motion.h3,
  article: motion.article,
  span: motion.span,
  figure: motion.figure,
  nav: motion.nav,
} as const;

type RevealAs = keyof typeof MOTION_TAGS;

type RevealProps = {
  as?: RevealAs;
  variant?: RevealVariant;
  delay?: number;
  duration?: number;
  once?: boolean;
  margin?: ViewportMargin;
  className?: string;
  children?: React.ReactNode;
  hoverLift?: boolean;
} & Omit<HTMLMotionProps<"div">, "initial" | "animate" | "variants" | "transition">;

export function Reveal({
  as = "div",
  variant = "fadeUp",
  delay = 0,
  duration = REVEAL.duration,
  once = true,
  margin = "-10% 0px",
  className,
  children,
  hoverLift = false,
  ...rest
}: RevealProps) {
  const reduced = useReducedMotion();
  const ref = React.useRef<HTMLElement | null>(null);
  const inView = useInView(ref, { once, margin });
  const Component = MOTION_TAGS[as];

  if (reduced) {
    const Tag = as as keyof React.JSX.IntrinsicElements;
    return <Tag className={className}>{children}</Tag>;
  }

  return (
    <Component
      ref={ref as React.Ref<HTMLDivElement>}
      className={className}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      variants={REVEAL_VARIANTS[variant]}
      transition={revealTransition(delay, duration)}
      whileHover={hoverLift ? { y: -3, transition: { duration: 0.22 } } : undefined}
      {...rest}
    >
      {children}
    </Component>
  );
}

type RevealStaggerProps = {
  className?: string;
  children: React.ReactNode;
  stagger?: number;
  delayChildren?: number;
  once?: boolean;
  margin?: ViewportMargin;
};

export function RevealStagger({
  className,
  children,
  stagger = REVEAL.stagger,
  delayChildren = REVEAL.delayChildren,
  once = true,
  margin = "-10% 0px",
}: RevealStaggerProps) {
  const reduced = useReducedMotion();
  const ref = React.useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, { once, margin });

  if (reduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      variants={{
        hidden: {},
        visible: {
          transition: { staggerChildren: stagger, delayChildren },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

type RevealItemProps = {
  as?: RevealAs;
  variant?: RevealVariant;
  className?: string;
  children?: React.ReactNode;
  id?: string;
  "aria-label"?: string;
};

/** Hijo de RevealStagger — hereda el trigger del padre. */
export function RevealItem({
  as = "div",
  variant = "fadeUp",
  className,
  children,
  id,
  "aria-label": ariaLabel,
}: RevealItemProps) {
  const reduced = useReducedMotion();
  const Component = MOTION_TAGS[as];

  if (reduced) {
    const Tag = as as keyof React.JSX.IntrinsicElements;
    return (
      <Tag className={className} id={id} aria-label={ariaLabel}>
        {children}
      </Tag>
    );
  }

  return (
    <Component
      className={className}
      id={id}
      aria-label={ariaLabel}
      variants={REVEAL_VARIANTS[variant]}
      transition={revealTransition()}
    >
      {children}
    </Component>
  );
}
