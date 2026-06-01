import Link from "next/link";
import { ClaseFormCliente } from "../ClaseFormCliente";
import { EventoFormCliente } from "../EventoFormCliente";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Nueva actividad · Admin Menesteres",
};

interface PageProps {
  searchParams: Promise<{ tipo?: string }>;
}

export default async function NuevaClasePage({ searchParams }: PageProps) {
  const { tipo } = await searchParams;
  const isEvento = tipo === "evento";

  return (
    <div>
      <header>
        <p className="font-mono text-[0.7rem] font-medium uppercase tracking-eyebrow text-terracota">
          Panel · {isEvento ? "Eventos" : "Clases"}
        </p>
        <h1 className="mt-3 font-display text-3xl font-normal tracking-tightish text-carbon">
          {isEvento ? "Nuevo evento privado" : "Nueva clase"}
        </h1>
        <p className="mt-3 max-w-prose font-body text-[0.92rem] leading-relaxed text-carbon/65">
          {isEvento ? (
            <>
              Registrá un festejo o encuentro privado que ocupa el espacio. Solo necesitás título,
              fecha, horario, categoría y la descripción que verán en el calendario.
            </>
          ) : (
            <>
              Cargá los datos de la clase. El slug se genera automáticamente desde el título; si
              la clase ya se dictó antes, podés usar “Cargar plantilla por slug” para autocompletar
              los campos comunes y solo cambiar fecha, hora y precio.
            </>
          )}
        </p>
      </header>

      <div className="mt-4">
        <Link
          href={isEvento ? "/admin/clases?categoria=eventos" : "/admin/clases"}
          className="font-sans text-[0.85rem] text-carbon/60 hover:text-carbon"
        >
          ← Volver al listado
        </Link>
      </div>

      <div className="mt-10 max-w-3xl">
        {isEvento ? <EventoFormCliente /> : <ClaseFormCliente />}
      </div>
    </div>
  );
}
