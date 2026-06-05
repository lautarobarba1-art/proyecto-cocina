import * as React from "react";

export interface SectionWrapperProps {
  as?: React.ElementType;
  id?: string;
  className?: string;
  innerClassName?: string;
  fullWidth?: boolean;
  children: React.ReactNode;
}

export function SectionWrapper({
  as: Tag = "section",
  id,
  className,
  innerClassName,
  fullWidth = false,
  children,
}: SectionWrapperProps) {
  return (
    <Tag
      id={id}
      className={[!fullWidth && "px-5", className].filter(Boolean).join(" ")}
      style={{
        paddingTop: "var(--space-section)",
        paddingBottom: "var(--space-section)",
      }}
    >
      <div
        className={[
          !fullWidth && "mx-auto max-w-[1200px]",
          innerClassName,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {children}
      </div>
    </Tag>
  );
}
