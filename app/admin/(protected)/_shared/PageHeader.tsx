import * as React from "react";

/**
 * PageHeader — eyebrow + título + descripción + slot de acciones,
 * el patrón de encabezado repetido en todas las páginas del panel.
 */

export interface PageHeaderProps {
  eyebrow: string;
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
}

export function PageHeader({ eyebrow, title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="font-mono text-[0.7rem] font-medium uppercase tracking-eyebrow text-terracota">
          {eyebrow}
        </p>
        <h1 className="mt-3 font-display text-3xl font-normal tracking-tightish text-carbon">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 font-body text-[0.85rem] text-carbon/55">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
    </div>
  );
}
