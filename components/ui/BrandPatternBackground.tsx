import * as React from "react";

interface BrandPatternBackgroundProps {
  src: string;
  opacity?: number;
  tileSize?: number;
  className?: string;
}

export function BrandPatternBackground({
  src,
  opacity = 0.05,
  tileSize = 380,
  className,
}: BrandPatternBackgroundProps) {
  return (
    <div
      className={[
        "absolute inset-0 pointer-events-none select-none",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      aria-hidden="true"
      style={{
        backgroundImage: `url('${src}')`,
        backgroundRepeat: "repeat",
        backgroundSize: `${tileSize}px`,
        opacity,
      }}
    />
  );
}
