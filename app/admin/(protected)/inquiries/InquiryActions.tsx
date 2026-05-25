"use client";

import * as React from "react";

interface InquiryActionsProps {
  inquiryId: string;
  status: "new" | "read" | "archived";
}

export function InquiryActions({ inquiryId, status }: InquiryActionsProps) {
  const [current, setCurrent] = React.useState(status);
  const [loading, setLoading] = React.useState(false);

  const update = async (next: "read" | "archived" | "new") => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/inquiries/${inquiryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (res.ok) setCurrent(next);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {current === "new" && (
        <button
          onClick={() => update("read")}
          disabled={loading}
          className="rounded border border-carbon/15 bg-white px-3 py-1 font-mono text-[0.68rem] uppercase tracking-wide text-carbon/70 hover:border-carbon/30 hover:text-carbon disabled:opacity-40"
        >
          Marcar leída
        </button>
      )}
      {current !== "archived" && (
        <button
          onClick={() => update("archived")}
          disabled={loading}
          className="rounded border border-carbon/15 bg-white px-3 py-1 font-mono text-[0.68rem] uppercase tracking-wide text-carbon/50 hover:border-carbon/30 hover:text-carbon/80 disabled:opacity-40"
        >
          Archivar
        </button>
      )}
      {current === "archived" && (
        <button
          onClick={() => update("new")}
          disabled={loading}
          className="rounded border border-carbon/15 bg-white px-3 py-1 font-mono text-[0.68rem] uppercase tracking-wide text-carbon/50 hover:border-carbon/30 hover:text-carbon/80 disabled:opacity-40"
        >
          Restaurar
        </button>
      )}
    </div>
  );
}
