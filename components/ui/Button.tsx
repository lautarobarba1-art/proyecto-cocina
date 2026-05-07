import * as React from "react";
import Link from "next/link";

/**
 * Button — primitivo de acción del Design System Menesteres.
 *
 * Variantes (manual oficial):
 *  - primary       → fondo terracota, texto crema, sombra orange. Uso: CTA principal.
 *  - black         → fondo carbon, texto crema. Uso: acción secundaria sobre fondos claros.
 *  - outline       → borde carbon, texto carbon. Uso: tercera prioridad.
 *  - outline-cream → borde crema, texto crema. Uso: sobre fondos oscuros / hero.
 *  - ghost         → sólo texto terracota con flecha →. Uso: links de "ver más".
 *
 * Tamaños:
 *  - lg      → 14px / padding 24px 48px
 *  - default → 13px / padding 16px 32px
 *  - sm      → 11px / padding 12px 24px
 *
 * Polimórfico: si se pasa `href`, renderiza <Link> de Next; si no, <button>.
 */

export type ButtonVariant =
  | "primary"
  | "black"
  | "outline"
  | "outline-cream"
  | "ghost";

export type ButtonSize = "sm" | "default" | "lg";

const BASE =
  "inline-flex items-center justify-center gap-2 font-sans font-bold uppercase leading-none transition-all duration-200 ease-out active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";

const SIZE: Record<ButtonSize, string> = {
  sm: "rounded-sm px-6 py-3 text-[11px] tracking-[0.08em]",
  default: "rounded-sm px-8 py-4 text-[13px] tracking-[0.08em]",
  lg: "rounded-sm px-12 py-5 text-[14px] tracking-[0.08em]",
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
};

interface CommonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children: React.ReactNode;
  /** Renderiza la flecha derecha clásica del estilo "ghost" / "ver más". */
  withArrow?: boolean;
}

type ButtonElementProps = CommonProps &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, keyof CommonProps> & {
    href?: undefined;
  };

type LinkElementProps = CommonProps &
  Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, keyof CommonProps | "href"> & {
    href: string;
    /** Si la url es externa, omitimos `next/link`. */
    external?: boolean;
  };

export type ButtonProps = ButtonElementProps | LinkElementProps;

function buildClass(variant: ButtonVariant, size: ButtonSize, className: string | undefined, showArrow: boolean) {
  return [BASE, SIZE[size], VARIANT[variant], showArrow ? "group" : "", className ?? ""]
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

export const Button = React.forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>(function Button(props, ref) {
  const variant: ButtonVariant = props.variant ?? "primary";
  const size: ButtonSize = props.size ?? "default";
  const showArrow = props.withArrow === true;
  const finalClass = buildClass(variant, size, props.className, showArrow);

  if ("href" in props && props.href !== undefined) {
    const {
      href,
      external,
      // Drop CommonProps so they don't reach the DOM.
      variant: _v,
      size: _s,
      withArrow: _w,
      className: _c,
      children,
      ...anchorProps
    } = props;
    void _v;
    void _s;
    void _w;
    void _c;

    if (external) {
      return (
        <a {...anchorProps} ref={ref as React.Ref<HTMLAnchorElement>} href={href} className={finalClass}>
          {children}
          {showArrow ? <Arrow /> : null}
        </a>
      );
    }

    return (
      <Link {...anchorProps} ref={ref as React.Ref<HTMLAnchorElement>} href={href} className={finalClass}>
        {children}
        {showArrow ? <Arrow /> : null}
      </Link>
    );
  }

  const {
    variant: _v,
    size: _s,
    withArrow: _w,
    className: _c,
    children,
    type = "button",
    ...buttonProps
  } = props;
  void _v;
  void _s;
  void _w;
  void _c;

  return (
    <button {...buttonProps} ref={ref as React.Ref<HTMLButtonElement>} type={type} className={finalClass}>
      {children}
      {showArrow ? <Arrow /> : null}
    </button>
  );
});
