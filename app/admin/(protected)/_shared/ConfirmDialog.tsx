"use client";

import * as React from "react";

/**
 * ConfirmDialog — modal de confirmación propio, reemplaza los
 * window.confirm() nativos. Puramente presentacional: quien lo usa
 * decide qué pasa al confirmar/cancelar (ver useConfirm.tsx).
 */

export type ConfirmDialogTone = "default" | "danger";

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: ConfirmDialogTone;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  tone = "default",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  React.useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-carbon/40 p-4"
      role="presentation"
      onClick={onCancel}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        className="w-full max-w-sm border border-carbon/10 bg-white p-6 shadow-brand-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="confirm-dialog-title" className="font-display text-lg text-carbon">
          {title}
        </h2>
        {description ? (
          <div className="mt-2 font-body text-[0.88rem] leading-relaxed text-carbon/65">
            {description}
          </div>
        ) : null}
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-2 font-sans text-[0.85rem] text-carbon/70 transition hover:text-carbon"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={[
              "px-4 py-2 font-sans text-[0.85rem] font-medium text-crema transition",
              tone === "danger" ? "bg-rojo hover:bg-rojo/90" : "bg-carbon hover:bg-carbon/90",
            ].join(" ")}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
