"use client";

import * as React from "react";

import { useReducedMotion } from "@/lib/useReducedMotion";

export interface KenBurnsProps {
  className?: string;
  children: React.ReactNode;
}

export function KenBurns({ className, children }: KenBurnsProps) {
  const reduced = useReducedMotion();

  return (
    <div
      data-reduced={reduced ? "true" : "false"}
      className={["kenburns", className ?? ""].join(" ")}
    >
      {children}
    </div>
  );
}

