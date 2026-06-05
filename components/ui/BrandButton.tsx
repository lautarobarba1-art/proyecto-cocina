import * as React from "react";
import Link from "next/link";

export type BrandButtonVariant = "primary" | "secondary" | "ghost";
export type BrandButtonSize = "sm" | "md" | "lg";

export interface BrandButtonProps {
  variant?: BrandButtonVariant;
  size?: BrandButtonSize;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
}

const BASE =
  "inline-flex items-center justify-center font-sans font-semibold tracking-[0.02em] leading-none rounded-pill " +
  "transition-[background-color,color,border-color] duration-200 ease-in-out cursor-pointer " +
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-terracota focus-visible:ring-offset-[3px] " +
  "disabled:opacity-50 disabled:cursor-not-allowed";

const SIZE: Record<BrandButtonSize, string> = {
  sm: "px-5 py-2 text-[0.8125rem]",
  md: "px-7 py-3 text-[0.9375rem]",
  lg: "px-9 py-4 text-base",
};

const VARIANT: Record<BrandButtonVariant, string> = {
  primary:
    "bg-terracota text-crema hover:bg-terracota-deep",
  secondary:
    "bg-transparent border-[1.5px] border-terracota text-terracota hover:bg-terracota hover:text-crema",
  ghost:
    "bg-transparent border-[1.5px] border-[rgba(255,250,243,0.4)] text-crema hover:bg-[rgba(255,250,243,0.1)]",
};

export function BrandButton({
  variant = "primary",
  size = "md",
  href,
  onClick,
  disabled = false,
  className,
  children,
}: BrandButtonProps) {
  const cls = [BASE, SIZE[size], VARIANT[variant], className].filter(Boolean).join(" ");

  if (href !== undefined) {
    const isExternal = href.startsWith("http");

    if (isExternal) {
      return (
        <a
          href={href}
          className={cls}
          target="_blank"
          rel="noopener noreferrer"
          aria-disabled={disabled || undefined}
          onClick={onClick}
        >
          {children}
        </a>
      );
    }

    return (
      <Link
        href={href}
        className={cls}
        aria-disabled={disabled || undefined}
        onClick={onClick}
      >
        {children}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} disabled={disabled} className={cls}>
      {children}
    </button>
  );
}
