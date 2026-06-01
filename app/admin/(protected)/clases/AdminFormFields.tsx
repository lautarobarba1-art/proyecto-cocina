import * as React from "react";

export function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="font-mono text-[0.7rem] font-medium uppercase tracking-eyebrow text-terracota">
        {title}
      </h2>
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

export function FieldRow({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>;
}

export function FieldText({
  label,
  hint,
  value,
  onChange,
  type = "text",
  required,
  error,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  error?: string;
}) {
  return (
    <div>
      <label className="block font-sans text-[0.78rem] font-medium uppercase tracking-wide text-carbon/65">
        {label}
        {required ? " *" : ""}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={[
          "mt-1.5 w-full border bg-white px-3 py-2 font-sans text-[0.92rem] text-carbon outline-none transition focus:border-terracota",
          error ? "border-red-400" : "border-carbon/20",
        ].join(" ")}
      />
      {hint && !error && (
        <p className="mt-1 text-[0.72rem] text-carbon/55">{hint}</p>
      )}
      {error && <p className="mt-1 text-[0.72rem] text-red-700">{error}</p>}
    </div>
  );
}

export function FieldTextarea({
  label,
  hint,
  value,
  onChange,
  required,
  error,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  error?: string;
}) {
  return (
    <div>
      <label className="block font-sans text-[0.78rem] font-medium uppercase tracking-wide text-carbon/65">
        {label}
        {required ? " *" : ""}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        className={[
          "mt-1.5 w-full border bg-white px-3 py-2 font-sans text-[0.92rem] text-carbon outline-none transition focus:border-terracota",
          error ? "border-red-400" : "border-carbon/20",
        ].join(" ")}
      />
      {hint && !error && (
        <p className="mt-1 text-[0.72rem] text-carbon/55">{hint}</p>
      )}
      {error && <p className="mt-1 text-[0.72rem] text-red-700">{error}</p>}
    </div>
  );
}

export function FieldSelect({
  label,
  hint,
  value,
  options,
  onChange,
  required,
  error,
}: {
  label: string;
  hint?: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
  required?: boolean;
  error?: string;
}) {
  return (
    <div>
      <label className="block font-sans text-[0.78rem] font-medium uppercase tracking-wide text-carbon/65">
        {label}
        {required ? " *" : ""}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={[
          "mt-1.5 w-full border bg-white px-3 py-2 font-sans text-[0.92rem] text-carbon outline-none transition focus:border-terracota",
          error ? "border-red-400" : "border-carbon/20",
        ].join(" ")}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {hint && !error && (
        <p className="mt-1 text-[0.72rem] text-carbon/55">{hint}</p>
      )}
      {error && <p className="mt-1 text-[0.72rem] text-red-700">{error}</p>}
    </div>
  );
}

export function FormActions({
  loading,
  isEdit,
  entityLabel,
  onCancel,
}: {
  loading: boolean;
  isEdit: boolean;
  entityLabel: "clase" | "evento";
  onCancel: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-3 border-t border-carbon/10 pt-4">
      <button
        type="button"
        onClick={onCancel}
        disabled={loading}
        className="px-4 py-2 font-sans text-[0.85rem] text-carbon/70 hover:text-carbon disabled:opacity-50"
      >
        Cancelar
      </button>
      <button
        type="submit"
        disabled={loading}
        className="rounded bg-terracota px-6 py-2.5 font-sans text-[0.85rem] font-medium uppercase tracking-wide text-crema transition hover:bg-terracota-deep disabled:opacity-50"
      >
        {loading
          ? "Guardando…"
          : isEdit
            ? "Guardar cambios"
            : entityLabel === "evento"
              ? "Crear evento"
              : "Crear clase"}
      </button>
    </div>
  );
}
