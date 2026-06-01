import * as React from "react";
import Link from "next/link";

import { SketchArrow, SketchOval } from "@/components/ui/SketchOval";

/**
 * Button — primitivo de acción del Design System Menesteres.
 *
 * Variantes sketch (estética editorial / marcador):
 *  - sketch          → óvalo dibujado, texto carbon. Fondos claros.
 *  - sketch-on-dark  → óvalo + texto crema. Fondos oscuros / video.
 *  - sketch-ghost    → flecha sketch + texto, sin óvalo.
 */

export type ButtonVariant =
  | "primary"
  | "black"
  | "outline"
  | "outline-cream"
  | "ghost"
  | "sketch"
  | "sketch-on-dark"
  | "sketch-ghost";

export type ButtonSize = "sm" | "default" | "lg";

const SKETCH_VARIANTS = new Set<ButtonVariant>([
  "sketch",
  "sketch-on-dark",
  "sketch-ghost",
]);

const BASE =
  "inline-flex items-center justify-center gap-2 font-sans font-bold uppercase leading-none transition-all duration-200 ease-out active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";

const SIZE: Record<ButtonSize, string> = {
  sm: "rounded-sm px-6 py-3 text-[11px] tracking-[0.08em]",
  default: "rounded-sm px-8 py-4 text-[13px] tracking-[0.08em]",
  lg: "rounded-sm px-12 py-5 text-[14px] tracking-[0.08em]",
};

const SKETCH_SIZE: Record<ButtonSize, string> = {
  sm: "min-h-10 px-8 py-2.5 text-[10px] tracking-[0.14em]",
  default: "min-h-11 px-10 py-3 text-[11px] tracking-[0.14em]",
  lg: "min-h-12 px-12 py-3.5 text-[12px] tracking-[0.14em]",
};

const VARIANT: Record<ButtonVariant, string> = {
  primary:
    "bg-terracota text-crema shadow-brand-orange hover:bg-terracota-deep hover:-translate-y-0.5 hover:shadow-brand-orange-hover focus-visible:ring-terracota/45 focus-visible:ring-offset-crema",
  black:
    "bg-carbon text-crema hover:bg-terracota hover:-translate-y-0.5 focus-visible:ring-carbon/45 focus-visible:ring-offset-crema",
  outline:
    "border-2 border-carbon bg-transparent text-carbon hover:bg-carbon hover:text-crema focus-visible:ring-carbon/45 focus-visible:ring-offset-crema",
  "outline-cream":
    "border-2 border-crema bg-transparent text-crema hover:bg-crema hover:text-carbon focus-visible:ring-crema/55 focus-visible:ring-offset-carbon",
  ghost:
    "px-0 py-3 tracking-[0.15em] text-terracota hover:text-terracota-deep focus-visible:ring-terracota/45 focus-visible:ring-offset-crema",
  sketch:
    "sketch-btn relative bg-transparent text-carbon shadow-none hover:text-terracota focus-visible:ring-terracota/35 focus-visible:ring-offset-crema-deep active:translate-y-0",
  "sketch-on-dark":
    "sketch-btn relative bg-transparent text-crema shadow-none hover:text-terracota-soft focus-visible:ring-crema/40 focus-visible:ring-offset-carbon active:translate-y-0",
  "sketch-ghost":
    "sketch-btn bg-transparent px-0 py-2 text-carbon shadow-none tracking-[0.14em] hover:text-terracota focus-visible:ring-terracota/35 focus-visible:ring-offset-crema-deep active:translate-y-0",
};

interface CommonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children: React.ReactNode;
  withArrow?: boolean;
  withSketchArrow?: boolean;
}

type ButtonElementProps = CommonProps &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, keyof CommonProps> & {
    href?: undefined;
  };

type LinkElementProps = CommonProps &
  Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, keyof CommonProps | "href"> & {
    href: string;
    external?: boolean;
  };

export type ButtonProps = ButtonElementProps | LinkElementProps;

function buildClass(
  variant: ButtonVariant,
  size: ButtonSize,
  className: string | undefined,
  showArrow: boolean,
) {
  const isSketch = SKETCH_VARIANTS.has(variant);
  return [
    BASE,
    isSketch ? SKETCH_SIZE[size] : SIZE[size],
    VARIANT[variant],
    showArrow || variant === "sketch-ghost" || isSketch ? "group" : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");
}

function Arrow() {
  return (
    <span
      aria-hidden="true"
      className="inline-block translate-x-0 transition-transform duration-200 ease-out group-hover:translate-x-1"
    >
      →
    </span>
  );
}

function ButtonInner({
  variant,
  children,
  showArrow,
  withSketchArrow,
}: {
  variant: ButtonVariant;
  children: React.ReactNode;
  showArrow: boolean;
  withSketchArrow: boolean;
}) {
  const showSketchArrow = withSketchArrow || variant === "sketch-ghost";

  if (variant === "sketch" || variant === "sketch-on-dark") {
    return (
      <>
        <SketchOval className="pointer-events-none absolute -inset-x-2.5 -inset-y-1.5 h-[calc(100%+0.75rem)] w-[calc(100%+1.25rem)] rotate-[-1.2deg] text-current opacity-95" />
        <span className="sketch-btn-label relative z-10 inline-flex items-center gap-2.5">
          {showSketchArrow ? (
            <SketchArrow className="h-3.5 w-5 shrink-0" />
          ) : null}
          {children}
        </span>
      </>
    );
  }

  if (variant === "sketch-ghost") {
    return (
      <span className="sketch-btn-label relative z-10 inline-flex items-center gap-2.5">
        <SketchArrow className="h-3.5 w-5 shrink-0" />
        {children}
      </span>
    );
  }

  return (
    <>
      {children}
      {showArrow ? <Arrow /> : null}
    </>
  );
}

export const Button = React.forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>(
  function Button(props, ref) {
    const variant: ButtonVariant = props.variant ?? "primary";
    const size: ButtonSize = props.size ?? "default";
    const showArrow = props.withArrow === true;
    const withSketchArrow = props.withSketchArrow === true;
    const finalClass = buildClass(variant, size, props.className, showArrow);

    if ("href" in props && props.href !== undefined) {
      const {
        href,
        external,
        variant: _v,
        size: _s,
        withArrow: _w,
        withSketchArrow: _sa,
        className: _c,
        children,
        ...anchorProps
      } = props;
      void _v;
      void _s;
      void _w;
      void _sa;
      void _c;

      const inner = (
        <ButtonInner
          variant={variant}
          showArrow={showArrow}
          withSketchArrow={withSketchArrow}
        >
          {children}
        </ButtonInner>
      );

      if (external) {
        return (
          <a
            {...anchorProps}
            ref={ref as React.Ref<HTMLAnchorElement>}
            href={href}
            className={finalClass}
          >
            {inner}
          </a>
        );
      }

      return (
        <Link
          {...anchorProps}
          ref={ref as React.Ref<HTMLAnchorElement>}
          href={href}
          className={finalClass}
        >
          {inner}
        </Link>
      );
    }

    const {
      variant: _v,
      size: _s,
      withArrow: _w,
      withSketchArrow: _sa,
      className: _c,
      children,
      type = "button",
      ...buttonProps
    } = props;
    void _v;
    void _s;
    void _w;
    void _sa;
    void _c;

    return (
      <button
        {...buttonProps}
        ref={ref as React.Ref<HTMLButtonElement>}
        type={type}
        className={finalClass}
      >
        <ButtonInner
          variant={variant}
          showArrow={showArrow}
          withSketchArrow={withSketchArrow}
        >
          {children}
        </ButtonInner>
      </button>
    );
  },
);
