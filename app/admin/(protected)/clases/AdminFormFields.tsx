"use client";

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

export function FieldImageUpload({
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
  onChange: (url: string) => void;
  required?: boolean;
  error?: string;
}) {
  const [uploading, setUploading] = React.useState(false);
  const [uploadError, setUploadError] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    setUploading(true);

    const body = new FormData();
    body.append("file", file);

    try {
      const res = await fetch("/api/admin/upload-image", { method: "POST", body });
      const json = await res.json().catch(() => null);

      if (!res.ok) {
        const msg =
          json?.error === "invalid_type"
            ? "Solo se aceptan PNG, JPG y WebP."
            : json?.error === "file_too_large"
              ? "El archivo supera el límite de 5 MB."
              : "No se pudo subir la imagen. Intentá de nuevo.";
        setUploadError(msg);
      } else {
        onChange(json.url);
      }
    } catch {
      setUploadError("Error de conexión al subir la imagen.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const displayError = error ?? uploadError ?? undefined;

  return (
    <div>
      <label className="block font-sans text-[0.78rem] font-medium uppercase tracking-wide text-carbon/65">
        {label}
        {required ? " *" : ""}
      </label>

      <div className="mt-1.5 space-y-3">
        {value && (
          <div className="relative h-44 w-full overflow-hidden border border-carbon/20 bg-carbon/5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt="" className="h-full w-full object-cover" />
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="rounded border border-carbon/30 bg-white px-3 py-1.5 font-sans text-[0.78rem] uppercase tracking-wide text-carbon/70 transition hover:bg-carbon/5 disabled:opacity-50"
          >
            {uploading ? "Subiendo…" : value ? "Cambiar imagen" : "Elegir imagen"}
          </button>
          {value && !uploading && (
            <button
              type="button"
              onClick={() => onChange("")}
              className="font-sans text-[0.75rem] text-red-600 hover:underline"
            >
              Eliminar
            </button>
          )}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="sr-only"
          onChange={handleFile}
        />
      </div>

      {hint && !displayError && (
        <p className="mt-1 text-[0.72rem] text-carbon/55">{hint}</p>
      )}
      {displayError && (
        <p className="mt-1 text-[0.72rem] text-red-700">{displayError}</p>
      )}
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
