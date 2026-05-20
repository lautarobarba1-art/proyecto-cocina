"use client";

import * as React from "react";

export interface HoneypotFieldProps {
  value: string;
  onChange: (value: string) => void;
}

/** Campo oculto anti-bot; no debe completarse por humanos. */
export function HoneypotField({ value, onChange }: HoneypotFieldProps) {
  return (
    <div className="absolute left-[-9999px] h-0 w-0 overflow-hidden" aria-hidden="true">
      <label htmlFor="website">Website</label>
      <input
        id="website"
        name="website"
        type="text"
        tabIndex={-1}
        autoComplete="off"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
