"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  slugFromTitle,
  type ClaseFormData,
} from "@/lib/admin/clases-validation";

interface Props {
  /** Si se pasa, es modo edición. Si no, modo crear. */
  initial?: ClaseFormData & { id: string };
}

const EMPTY_FORM: ClaseFormData = {
  slug: "",
  date: "",
  title: "",
  startTime: "18:00",
  endTime: "21:00",
  categoryEvent: "adultos",
  shortDesc: "",
  isHighlighted: false,
  categoryLabel: "",
  descriptionLong: "",
  durationLabel: "3 horas",
  imageSrc: "",
  imageAlt: "",
  totalSpots: 10,
  price: 0,
  paymentLink: null,
};

export function ClaseFormCliente({ initial }: Props) {
  const router = useRouter();
  const isEdit = Boolean(initial);

  // Si initial existe, sacamos el id y usamos el resto como form data.
  const initialFormData: ClaseFormData = initial
    ? {
        slug: initial.slug,
        date: initial.date,
        title: initial.title,
        startTime: initial.startTime,
        endTime: initial.endTime,
        categoryEvent: initial.categoryEvent,
        shortDesc: initial.shortDesc,
        isHighlighted: initial.isHighlighted,
        categoryLabel: initial.categoryLabel,
        descriptionLong: initial.descriptionLong,
        durationLabel: initial.durationLabel,
        imageSrc: initial.imageSrc,
        imageAlt: initial.imageAlt,
        totalSpots: initial.totalSpots,
        price: initial.price,
        paymentLink: initial.paymentLink,
      }
    : EMPTY_FORM;

  const [form, setForm] = React.useState<ClaseFormData>(initialFormData);
  const [slugManuallyEdited, setSlugManuallyEdited] = React.useState(isEdit);
  const [loading, setLoading] = React.useState(false);
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<
    Partial<Record<keyof ClaseFormData, string>>
  >({});

  // Auto-generar slug desde el título (solo si no fue editado manualmente)
  React.useEffect(() => {
    if (slugManuallyEdited) return;
    const auto = slugFromTitle(form.title);
    if (auto !== form.slug) {
      setForm((f) => ({ ...f, slug: auto }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.title]);

  const updateField = <K extends keyof ClaseFormData>(
    key: K,
    value: ClaseFormData[K],
  ) => {
    setForm((f) => ({ ...f, [key]: value }));
    // Limpiar error del campo al editar
    if (fieldErrors[key]) {
      setFieldErrors((e: Partial<Record<keyof ClaseFormData, string>>) => {
        const copy = { ...e };
        delete copy[key];
        return copy;
      });
    }
  };

  // Cargar plantilla por slug (solo en modo crear)
  const loadTemplate = async () => {
    if (isEdit) return;
    if (!form.slug) {
      setServerError("Ingresá primero un slug (escribiendo el título o editando el campo).");
      return;
    }
    setServerError(null);
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/classes/template?slug=${encodeURIComponent(form.slug)}`,
      );
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.template) {
        setServerError("No se encontró ninguna clase previa con ese slug.");
        setLoading(false);
        return;
      }
      const tpl = json.template;
      setForm((f) => ({
        ...f,
        title: tpl.title,
        categoryEvent: tpl.categoryEvent,
        categoryLabel: tpl.categoryLabel,
        shortDesc: tpl.shortDesc,
        descriptionLong: tpl.descriptionLong,
        durationLabel: tpl.durationLabel,
        imageSrc: tpl.imageSrc,
        imageAlt: tpl.imageAlt,
        price: tpl.price,
        totalSpots: tpl.totalSpots,
      }));
      setLoading(false);
    } catch (e) {
      console.error(e);
      setServerError("Error de conexión.");
      setLoading(false);
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    setFieldErrors({});
    setLoading(true);

    const url = isEdit
      ? `/api/admin/classes/${initial!.id}`
      : `/api/admin/classes`;
    const method = isEdit ? "PATCH" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json().catch(() => null);

      if (!res.ok) {
        if (json?.fieldErrors) {
          setFieldErrors(json.fieldErrors);
        }
        const code = json?.error;
        if (code === "duplicate_slug_date") {
          setServerError(
            "Ya existe una clase con ese slug y fecha. Editá la existente o cambiá la fecha.",
          );
        } else if (code === "validation_failed") {
          setServerError("Hay campos con errores. Revisá los marcados en rojo.");
        } else if (code === "unauthorized") {
          setServerError("Sesión expirada. Volvé a entrar.");
        } else if (code === "not_found") {
          setServerError("La clase no existe (puede haber sido borrada).");
        } else {
          setServerError("No se pudo guardar la clase.");
        }
        setLoading(false);
        return;
      }

      // Éxito → al listado
      router.replace("/admin/clases");
      router.refresh();
    } catch (err) {
      console.error(err);
      setServerError("Error de conexión.");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      {serverError && (
        <div className="border border-red-300 bg-red-50 px-4 py-3 text-[0.85rem] text-red-800">
          {serverError}
        </div>
      )}

      {/* Sección 1: Identificación */}
      <Section title="Identificación">
        <FieldRow>
          <FieldText
            label="Título de la clase"
            value={form.title}
            onChange={(v) => updateField("title", v)}
            error={fieldErrors.title}
            required
          />
        </FieldRow>
        <FieldRow>
          <FieldText
            label="Slug (URL)"
            hint={`Aparece en /clases/${form.slug || "..."}. Se genera automáticamente desde el título.`}
            value={form.slug}
            onChange={(v) => {
              setSlugManuallyEdited(true);
              updateField("slug", v);
            }}
            error={fieldErrors.slug}
            required
          />
        </FieldRow>
        {!isEdit && (
          <div>
            <button
              type="button"
              onClick={loadTemplate}
              disabled={loading || !form.slug}
              className="rounded border border-carbon/30 bg-white px-3 py-1.5 text-[0.78rem] uppercase tracking-wide text-carbon/70 transition hover:bg-carbon/5 disabled:opacity-50"
            >
              Cargar plantilla por slug
            </button>
            <p className="mt-1 text-[0.72rem] text-carbon/55">
              Si ya hubo una clase con este slug, autocompleta los campos comunes.
            </p>
          </div>
        )}
      </Section>

      {/* Sección 2: Fecha y horario */}
      <Section title="Fecha y horario">
        <div className="grid gap-4 sm:grid-cols-3">
          <FieldText
            label="Fecha"
            type="date"
            value={form.date}
            onChange={(v) => updateField("date", v)}
            error={fieldErrors.date}
            required
          />
          <FieldText
            label="Hora inicio"
            type="time"
            value={form.startTime}
            onChange={(v) => updateField("startTime", v)}
            error={fieldErrors.startTime}
            required
          />
          <FieldText
            label="Hora fin"
            type="time"
            value={form.endTime}
            onChange={(v) => updateField("endTime", v)}
            error={fieldErrors.endTime}
            required
          />
        </div>
        <FieldText
          label="Duración (visible en la ficha)"
          hint="Texto libre, ej: '3 horas', '2,5 horas'."
          value={form.durationLabel}
          onChange={(v) => updateField("durationLabel", v)}
          error={fieldErrors.durationLabel}
          required
        />
      </Section>

      {/* Sección 3: Categorías */}
      <Section title="Categorías">
        <div className="grid gap-4 sm:grid-cols-2">
          <FieldSelect
            label="Categoría calendario"
            hint="Filtro del calendario público."
            value={form.categoryEvent}
            options={[
              { value: "adultos", label: "Adultos" },
              { value: "ninos", label: "Niños" },
              { value: "eventos", label: "Eventos" },
            ]}
            onChange={(v) =>
              updateField("categoryEvent", v as ClaseFormData["categoryEvent"])
            }
            error={fieldErrors.categoryEvent}
            required
          />
          <FieldText
            label="Categoría visible (ficha)"
            hint="Texto libre, ej: 'Panadería', 'Italiana'."
            value={form.categoryLabel}
            onChange={(v) => updateField("categoryLabel", v)}
            error={fieldErrors.categoryLabel}
            required
          />
        </div>
      </Section>

      {/* Sección 4: Descripciones */}
      <Section title="Descripciones">
        <FieldText
          label="Descripción corta (calendario)"
          hint="Una línea que aparece en el preview del calendario."
          value={form.shortDesc}
          onChange={(v) => updateField("shortDesc", v)}
          error={fieldErrors.shortDesc}
          required
        />
        <FieldTextarea
          label="Descripción larga (ficha de clase)"
          value={form.descriptionLong}
          onChange={(v) => updateField("descriptionLong", v)}
          error={fieldErrors.descriptionLong}
          required
        />
      </Section>

      {/* Sección 5: Imagen */}
      <Section title="Imagen">
        <FieldText
          label="URL de la imagen"
          hint="Pegá la URL pública (Unsplash, Imgur, etc.). Subir desde dispositivo se agrega más adelante."
          value={form.imageSrc}
          onChange={(v) => updateField("imageSrc", v)}
          error={fieldErrors.imageSrc}
          required
        />
        <FieldText
          label="Texto alternativo (accesibilidad)"
          hint="Describí brevemente qué se ve en la imagen."
          value={form.imageAlt}
          onChange={(v) => updateField("imageAlt", v)}
          error={fieldErrors.imageAlt}
          required
        />
      </Section>

      {/* Sección 6: Cupos y precio */}
      <Section title="Cupos y precio">
        <div className="grid gap-4 sm:grid-cols-2">
          <FieldText
            label="Total de cupos"
            type="number"
            value={String(form.totalSpots)}
            onChange={(v) => updateField("totalSpots", parseInt(v, 10) || 0)}
            error={fieldErrors.totalSpots}
            required
          />
          <FieldText
            label="Precio (ARS)"
            type="number"
            value={String(form.price)}
            onChange={(v) => updateField("price", parseFloat(v) || 0)}
            error={fieldErrors.price}
            required
          />
        </div>
        <FieldText
          label="Link de Mercado Pago (opcional)"
          hint="URL del checkout de MP. Se manda al cliente después de reservar."
          value={form.paymentLink ?? ""}
          onChange={(v) => updateField("paymentLink", v.trim() === "" ? null : v)}
          error={fieldErrors.paymentLink}
        />
      </Section>

      {/* Sección 7: Destacado */}
      <Section title="Visibilidad">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={form.isHighlighted}
            onChange={(e) => updateField("isHighlighted", e.target.checked)}
            className="h-4 w-4 cursor-pointer"
          />
          <span className="font-sans text-[0.9rem] text-carbon">
            Marcar como destacada
          </span>
        </label>
      </Section>

      {/* Footer con botones */}
      <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-carbon/10">
        <button
          type="button"
          onClick={() => router.push("/admin/clases")}
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
              : "Crear clase"}
        </button>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------
// Sub-componentes locales del formulario (sin tocar UI design system)
// ---------------------------------------------------------------------

function Section({
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

function FieldRow({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>;
}

function FieldText({
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

function FieldTextarea({
  label,
  value,
  onChange,
  required,
  error,
}: {
  label: string;
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
      {error && <p className="mt-1 text-[0.72rem] text-red-700">{error}</p>}
    </div>
  );
}

function FieldSelect({
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