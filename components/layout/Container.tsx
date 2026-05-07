import * as React from "react";

export interface ContainerProps {
  as?: "div" | "section" | "header" | "footer" | "main";
  className?: string;
  children: React.ReactNode;
}

export function Container({ as: Tag = "div", className, children }: ContainerProps) {
  return (
    <Tag
      className={[
        "mx-auto w-full min-w-0 max-w-7xl px-4 sm:px-6 lg:px-10",
        className ?? "",
      ].join(" ")}
    >
      {children}
    </Tag>
  );
}

