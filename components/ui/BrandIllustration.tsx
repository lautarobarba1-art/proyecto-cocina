import * as React from "react";

interface BrandIllustrationProps {
  src: string;
  size?: number;
  opacity?: number;
  rotate?: number;
  hideOnMobile?: boolean;
  className?: string;
}

export function BrandIllustration({
  src,
  size = 80,
  opacity = 0.25,
  rotate = 0,
  hideOnMobile = false,
  className,
}: BrandIllustrationProps) {
  const classes = [
    "pointer-events-none select-none",
    hideOnMobile ? "hidden lg:block" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={classes}
      aria-hidden="true"
      style={{
        opacity,
        transform: rotate ? `rotate(${rotate}deg)` : undefined,
        width: size,
        flexShrink: 0,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        width={size}
        height={size}
        style={{ width: size, height: "auto", display: "block" }}
        draggable={false}
      />
    </div>
  );
}
