"use client";

import { useRouter } from "next/navigation";

interface Props {
  mesActual: string;
  estadoActual: string;
}

export function FiltroMesForm({ mesActual, estadoActual }: Props) {
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const mes = e.target.value;
    const params = new URLSearchParams();
    if (estadoActual) params.set("estado", estadoActual);
    if (mes) params.set("mes", mes);
    router.push(`/admin/reservas?${params.toString()}`);
  };

  // Lista de últimos 12 meses
  const meses: { value: string; label: string }[] = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("es-AR", {
      month: "long",
      year: "numeric",
    });
    meses.push({ value, label });
  }

  return (
    <div className="mt-2">
      <select
        value={mesActual}
        onChange={handleChange}
        className="border border-carbon/20 bg-white px-3 py-1.5 font-sans text-[0.85rem] text-carbon outline-none focus:border-carbon/50"
      >
        <option value="">Todos los meses</option>
        {meses.map((m) => (
          <option key={m.value} value={m.value}>
            {m.label}
          </option>
        ))}
      </select>
    </div>
  );
}