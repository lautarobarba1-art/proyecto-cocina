export function CalendarLegend() {
  return (
    <div className="mt-6 flex flex-wrap gap-6 font-mono text-[10px] font-medium uppercase tracking-meta text-carbon/50">
      <span className="flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-terracota" aria-hidden="true" />
        Hay clase
      </span>
      <span className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-sm bg-terracota-muted" aria-hidden="true" />
        Hoy
      </span>
      <span className="flex items-center gap-2">
        <span className="line-through">Completa</span>
      </span>
      <span className="flex items-center gap-2">
        <span className="h-2 w-2 border-2 border-terracota" aria-hidden="true" />
        Seleccionada
      </span>
    </div>
  );
}
