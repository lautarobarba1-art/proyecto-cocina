import * as React from "react";

/**
 * Primitivos de tabla del panel admin — consolidan el wrapper, las
 * celdas Th/Td y el estado vacío que hoy se repiten (con clases
 * idénticas) en el dashboard, reservas, clases, inquiries y
 * notificaciones.
 */

export interface TableWrapperProps {
  children: React.ReactNode;
  minWidth?: string;
  className?: string;
}

export function TableWrapper({
  children,
  minWidth = "640px",
  className,
}: TableWrapperProps) {
  return (
    <div
      className={[
        "overflow-hidden border border-carbon/10 bg-white",
        className ?? "mt-4",
      ].join(" ")}
    >
      <div className="overflow-x-auto">
        <table
          className="w-full text-left font-sans text-[0.85rem]"
          style={{ minWidth }}
        >
          {children}
        </table>
      </div>
    </div>
  );
}

export function Th({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      className={[
        "px-4 py-3 font-mono text-[0.7rem] font-medium uppercase tracking-eyebrow",
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </th>
  );
}

export function Td({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <td className={["px-4 py-3", className ?? ""].filter(Boolean).join(" ")}>
      {children}
    </td>
  );
}

export interface TableEmptyStateProps {
  children: React.ReactNode;
  size?: "default" | "compact";
}

export function TableEmptyState({ children, size = "default" }: TableEmptyStateProps) {
  return (
    <div
      className={[
        "border border-dashed border-carbon/20 bg-white text-center",
        size === "compact" ? "mt-4 p-8" : "mt-10 p-12",
      ].join(" ")}
    >
      <p className="font-body text-[0.9rem] text-carbon/60">{children}</p>
    </div>
  );
}
