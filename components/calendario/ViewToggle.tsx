"use client";

export type CalendarView = "grid" | "list";

export interface ViewToggleProps {
  value: CalendarView;
  onChange: (v: CalendarView) => void;
  hidden?: boolean;
}

export function ViewToggle({ value, onChange, hidden }: ViewToggleProps) {
  if (hidden) return null;

  return (
    <div className="mt-8 flex items-center gap-6" role="tablist" aria-label="Vista del calendario">
      <button
        type="button"
        role="tab"
        aria-selected={value === "grid"}
        id="tab-vista-grilla"
        aria-controls="panel-calendario"
        onClick={() => onChange("grid")}
        className={[
          "font-mono text-[11px] font-medium uppercase tracking-meta transition-[color,border-color] duration-200 ease-soft",
          value === "grid" ? "border-b border-terracota pb-1 text-terracota" : "border-b border-transparent pb-1 text-carbon/50 hover:opacity-100",
        ].join(" ")}
      >
        VISTA GRILLA
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={value === "list"}
        id="tab-vista-lista"
        aria-controls="panel-calendario"
        onClick={() => onChange("list")}
        className={[
          "font-mono text-[11px] font-medium uppercase tracking-meta transition-[color,border-color] duration-200 ease-soft",
          value === "list" ? "border-b border-terracota pb-1 text-terracota" : "border-b border-transparent pb-1 text-carbon/50 hover:opacity-100",
        ].join(" ")}
      >
        VISTA LISTA
      </button>
    </div>
  );
}
