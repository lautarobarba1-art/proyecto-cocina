"use client";

import * as React from "react";
import { ConfirmDialog, type ConfirmDialogTone } from "./ConfirmDialog";

/**
 * useConfirm — reemplazo de window.confirm() con la misma semántica
 * de "esperar sí/no antes de seguir", pero async y con el look del
 * panel. Uso:
 *
 *   const { confirm, dialog } = useConfirm();
 *   ...
 *   if (!(await confirm({ title: "¿Cancelar la clase?" }))) return;
 *   // seguir con la lógica existente (fetch, etc.)
 *   ...
 *   return <>{dialog}{resto del componente}</>;
 */

export interface ConfirmOptions {
  title: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: ConfirmDialogTone;
}

interface PendingConfirm {
  opts: ConfirmOptions;
  resolve: (value: boolean) => void;
}

export function useConfirm(): {
  confirm: (opts: ConfirmOptions) => Promise<boolean>;
  dialog: React.ReactNode;
} {
  const [pending, setPending] = React.useState<PendingConfirm | null>(null);

  const confirm = React.useCallback((opts: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setPending({ opts, resolve });
    });
  }, []);

  const settle = (value: boolean) => {
    pending?.resolve(value);
    setPending(null);
  };

  const dialog = (
    <ConfirmDialog
      open={pending !== null}
      title={pending?.opts.title ?? ""}
      description={pending?.opts.description}
      confirmLabel={pending?.opts.confirmLabel}
      cancelLabel={pending?.opts.cancelLabel}
      tone={pending?.opts.tone}
      onConfirm={() => settle(true)}
      onCancel={() => settle(false)}
    />
  );

  return { confirm, dialog };
}
