"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { slugFromTitle } from "@/lib/admin/clases-validation";
import type { EventoFormData } from "@/lib/admin/eventos-validation";
import {
  FieldRow,
  FieldText,
  FieldTextarea,
  FormActions,
  Section,
} from "./AdminFormFields";

interface Props {
  initial?: EventoFormData & { id: string };
}

const EMPTY_FORM: EventoFormData = {
  slug: "",
  date: "",
  title: "",
  startTime: "20:00",
  endTime: "23:30",
  categoryLabel: "",
  shortDesc: "",
};

export function EventoFormCliente({ initial }: Props) {
  const router = useRouter();
  const isEdit = Boolean(initial);
  const [form, setForm] = React.useState<EventoFormData>(initial ?? EMPTY_FORM);
  const [slugManuallyEdited, setSlugManuallyEdited] = React.useState(isEdit);
  const [loading, setLoading] = React.useState(false);
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<
    Partial<Record<keyof EventoFormData, string>>
  >({});

  React.useEffect(() => {
    if (slugManuallyEdited) return;
    const auto = slugFromTitle(form.title);
    if (auto !== form.slug) {
      setForm((f) => ({ ...f, slug: auto }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.title]);

  const updateField = <K extends keyof EventoFormData>(
    key: K,
    value: EventoFormData[K],
  ) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (fieldErrors[key]) {
      setFieldErrors((e) => {
        const copy = { ...e };
        delete copy[key];
        return copy;
      });
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
        body: JSON.stringify({ kind: "evento", ...form }),
      });
      const json = await res.json().catch(() => null);

      if (!res.ok) {
        if (json?.fieldErrors) {
          setFieldErrors(json.fieldErrors);
        }
        const code = json?.error;
        if (code === "duplicate_slug_date") {
          setServerError(
            "Ya existe un evento con ese slug y fecha. Editá el existente o cambiá la fecha.",
          );
        } else if (code === "validation_failed") {
          setServerError("Hay campos con errores. Revisá los marcados en rojo.");
        } else if (code === "unauthorized") {
          setServerError("Sesión expirada. Volvé a entrar.");
        } else if (code === "not_found") {
          setServerError("El evento no existe (puede haber sido borrado).");
        } else {
          setServerError("No se pudo guardar el evento.");
        }
        setLoading(false);
        return;
      }

      router.replace("/admin/clases?categoria=eventos");
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

      <Section title="Identificación">
        <FieldRow>
          <FieldText
            label="Título del evento"
            hint="Ej: Cena de cumpleaños · Familia García"
            value={form.title}
            onChange={(v) => updateField("title", v)}
            error={fieldErrors.title}
            required
          />
        </FieldRow>
        <FieldRow>
          <FieldText
            label="Slug (URL interna)"
            hint="Se genera desde el título. Solo se usa para identificar la fecha en el calendario."
            value={form.slug}
            onChange={(v) => {
              setSlugManuallyEdited(true);
              updateField("slug", v);
            }}
            error={fieldErrors.slug}
            required
          />
        </FieldRow>
      </Section>

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
      </Section>

      <Section title="Calendario">
        <FieldText
          label="Categoría"
          hint="Etiqueta visible en el calendario, ej: Cumpleaños, Cena privada, Encuentro."
          value={form.categoryLabel}
          onChange={(v) => updateField("categoryLabel", v)}
          error={fieldErrors.categoryLabel}
          required
        />
        <FieldTextarea
          label="Descripción para calendario"
          hint="Una o dos líneas que aparecen al ver el día en el calendario público."
          value={form.shortDesc}
          onChange={(v) => updateField("shortDesc", v)}
          error={fieldErrors.shortDesc}
          required
        />
      </Section>

      <FormActions
        loading={loading}
        isEdit={isEdit}
        entityLabel="evento"
        onCancel={() => router.push("/admin/clases?categoria=eventos")}
      />
    </form>
  );
}
