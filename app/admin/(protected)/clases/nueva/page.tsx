import Link from "next/link";
import { ClaseFormCliente } from "../ClaseFormCliente";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Nueva clase · Admin Menesteres",
};

export default function NuevaClasePage() {
  return (
    <div>
      <header>
        <p className="font-mono text-[0.7rem] font-medium uppercase tracking-eyebrow text-terracota">
          Panel · Clases
        </p>
        <h1 className="mt-3 font-display text-3xl font-normal tracking-tightish text-carbon">
          Nueva clase
        </h1>
        <p className="mt-3 font-body text-[0.92rem] leading-relaxed text-carbon/65 max-w-prose">
          Cargá los datos de la clase. El slug se genera automáticamente desde
          el título; si la clase ya se dictó antes, podés usar “Cargar plantilla
          por slug” para autocompletar los campos comunes y solo cambiar fecha,
          hora y precio.
        </p>
      </header>

      <div className="mt-4">
        <Link
          href="/admin/clases"
          className="font-sans text-[0.85rem] text-carbon/60 hover:text-carbon"
        >
          ← Volver al listado
        </Link>
      </div>

      <div className="mt-10 max-w-3xl">
        <ClaseFormCliente />
      </div>
    </div>
  );
}