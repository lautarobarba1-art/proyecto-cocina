import * as React from "react";

/**
 * Form Primitives — Design System Menesteres.
 *
 * Tokens aplicados:
 *   Label:   font-sans / 11px / bold / uppercase / tracking-meta
 *   Input:   border-b (underline) / py-3 / font-sans / 0.95rem
 *   Focus:   border-terracota (light) | border-terracota-soft (dark)
 *   Error:   border-rojo (light) | border-terracota-soft (dark)
 *   Texto error: text-rojo (light) | text-terracota-soft (dark)
 *
 * Todos los primitives aceptan onDark?: boolean para fondos oscuros (WaitlistBlock, etc.)
 *
 * Exports:
 *   FormLabel   — label tipografíada
 *   FormInput   — input underline con estados
 *   FormTextarea — textarea underline con resize
 *   FormSelect  — select underline
 *   FormError   — mensaje de error (role="alert")
 *   Field       — wrapper que compone Label + Control + Error + ARIA
 *   FormGroup   — espaciado vertical (grid gap-6)
 */

// ── FormLabel ─────────────────────────────────────────────────────────────────

export interface FormLabelProps
  extends React.LabelHTMLAttributes<HTMLLabelElement> {
  onDark?: boolean;
}

export function FormLabel({
  onDark,
  className,
  children,
  ...props
}: FormLabelProps) {
  return (
    <label
      {...props}
      className={[
        "block font-sans text-[11px] font-bold uppercase tracking-meta",
        onDark ? "text-crema/55" : "text-carbon/55",
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </label>
  );
}

// ── Shared tokens ─────────────────────────────────────────────────────────────

const INPUT_BASE =
  "w-full border-0 border-b bg-transparent py-3 font-sans text-[0.95rem] outline-none transition-colors duration-200 ease-snap disabled:cursor-not-allowed disabled:opacity-50";

function inputVariant(hasError: boolean, onDark: boolean): string {
  if (onDark) {
    return hasError
      ? "border-terracota-soft text-crema placeholder:text-crema/25 focus:border-terracota-soft"
      : "border-crema/30 text-crema placeholder:text-crema/25 focus:border-terracota-soft";
  }
  return hasError
    ? "border-rojo/60 text-carbon placeholder:text-carbon/30 focus:border-rojo"
    : "border-carbon/20 text-carbon placeholder:text-carbon/30 focus:border-terracota";
}

// ── FormInput ─────────────────────────────────────────────────────────────────

export interface FormInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
  onDark?: boolean;
}

export const FormInput = React.forwardRef<HTMLInputElement, FormInputProps>(
  function FormInput(
    { hasError = false, onDark = false, className, ...props },
    ref
  ) {
    return (
      <input
        ref={ref}
        {...props}
        className={[
          INPUT_BASE,
          inputVariant(hasError, onDark),
          className ?? "",
        ]
          .filter(Boolean)
          .join(" ")}
      />
    );
  }
);

// ── FormTextarea ──────────────────────────────────────────────────────────────

export interface FormTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  hasError?: boolean;
  onDark?: boolean;
}

export const FormTextarea = React.forwardRef<
  HTMLTextAreaElement,
  FormTextareaProps
>(function FormTextarea(
  { hasError = false, onDark = false, className, ...props },
  ref
) {
  return (
    <textarea
      ref={ref}
      {...props}
      className={[
        INPUT_BASE,
        "resize-y",
        inputVariant(hasError, onDark),
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
    />
  );
});

// ── FormSelect ────────────────────────────────────────────────────────────────

export interface FormSelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  hasError?: boolean;
  onDark?: boolean;
}

export const FormSelect = React.forwardRef<HTMLSelectElement, FormSelectProps>(
  function FormSelect(
    { hasError = false, onDark = false, className, children, ...props },
    ref
  ) {
    return (
      <select
        ref={ref}
        {...props}
        className={[
          INPUT_BASE,
          "cursor-pointer",
          inputVariant(hasError, onDark),
          className ?? "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {children}
      </select>
    );
  }
);

// ── FormError ─────────────────────────────────────────────────────────────────

export interface FormErrorProps {
  id?: string;
  onDark?: boolean;
  children: React.ReactNode;
}

/**
 * Mensaje de error a nivel de campo.
 * role="alert" → anuncia al SR cuando aparece en el DOM.
 */
export function FormError({ id, onDark, children }: FormErrorProps) {
  return (
    <p
      id={id}
      role="alert"
      className={[
        "mt-1.5 font-sans text-[11px] font-medium",
        onDark ? "text-terracota-soft" : "text-rojo",
      ].join(" ")}
    >
      {children}
    </p>
  );
}

// ── Field ─────────────────────────────────────────────────────────────────────

export interface FieldProps {
  /**
   * ID canónico del control. Field lo inyecta en el hijo vía cloneElement
   * y lo vincula con el Label (htmlFor) y FormError (aria-describedby).
   */
  id: string;
  label: React.ReactNode;
  /**
   * `true`  → muestra "Campo requerido"
   * string  → muestra el mensaje personalizado
   * falsy   → sin error
   */
  error?: boolean | string;
  onDark?: boolean;
  /** Un único elemento React (FormInput, FormTextarea o FormSelect). */
  children: React.ReactElement<Record<string, unknown>>;
}

/**
 * Wrapper opinionado: Label + Control + Error.
 * Inyecta id, aria-invalid y aria-describedby en el hijo directo.
 */
export function Field({ id, label, error, onDark, children }: FieldProps) {
  const errorId = `${id}-error`;
  const errorMsg =
    typeof error === "string" ? error : error ? "Campo requerido" : undefined;

  const enhancedChild = React.cloneElement(children, {
    id,
    ...(errorMsg
      ? ({
          "aria-invalid": true,
          "aria-describedby": errorId,
        } as Record<string, unknown>)
      : {}),
  });

  return (
    <div>
      <FormLabel htmlFor={id} onDark={onDark}>
        {label}
      </FormLabel>
      <div className="mt-2">{enhancedChild}</div>
      {errorMsg && (
        <FormError id={errorId} onDark={onDark}>
          {errorMsg}
        </FormError>
      )}
    </div>
  );
}

// ── FormGroup ─────────────────────────────────────────────────────────────────

export interface FormGroupProps {
  className?: string;
  children: React.ReactNode;
}

/** Espaciado vertical unificado para grupos de campos. Default: grid gap-6. */
export function FormGroup({ className, children }: FormGroupProps) {
  return (
    <div
      className={["grid gap-6", className ?? ""].filter(Boolean).join(" ")}
    >
      {children}
    </div>
  );
}
