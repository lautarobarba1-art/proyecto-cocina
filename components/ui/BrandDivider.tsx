import * as React from "react";

export interface BrandDividerProps {
  variant?: "line" | "trama";
  color?: string;
  className?: string;
}

export function BrandDivider({
  variant = "line",
  color = "rgba(20, 20, 20, 0.1)",
  className,
}: BrandDividerProps) {
  if (variant === "trama") {
    return (
      <div
        className={["w-full overflow-hidden", className].filter(Boolean).join(" ")}
        aria-hidden="true"
      >
        <svg
          width="100%"
          height="40"
          viewBox="0 0 800 40"
          preserveAspectRatio="none"
          focusable="false"
        >
          <path
            d="M0,10 C100,9 200,11 400,10 C600,9 700,11 800,10"
            stroke={color}
            strokeWidth="0.6"
            fill="none"
            opacity="0.7"
          />
          <path
            d="M0,18 C150,17 350,19 500,18 C650,17 750,19 800,18"
            stroke={color}
            strokeWidth="0.9"
            fill="none"
            opacity="0.45"
          />
          <path
            d="M0,26 C200,25 400,27 550,26 C700,25 750,27 800,26"
            stroke={color}
            strokeWidth="0.5"
            fill="none"
            opacity="0.55"
          />
          <path
            d="M0,34 C100,33 300,35 500,34 C700,33 780,35 800,34"
            stroke={color}
            strokeWidth="0.7"
            fill="none"
            opacity="0.35"
          />
        </svg>
      </div>
    );
  }

  return (
    <hr
      className={["border-none m-0 h-px", className].filter(Boolean).join(" ")}
      style={{ backgroundColor: color }}
      aria-hidden="true"
    />
  );
}
