import Link from "next/link";

export const metadata = {
  title: "Inicio · Admin Menesteres",
};

export default function AdminHomePage() {
  return (
    <div>
      <h1 className="font-display text-3xl font-normal tracking-tightish text-carbon">
        Hola.
      </h1>
      <p className="mt-3 font-body text-[1rem] leading-relaxed text-carbon/70">
        Desde acá vas a poder gestionar las reservas y las clases del sitio.
      </p>

      <div className="mt-10 grid gap-6 sm:grid-cols-2">
        <Link
          href="/admin/reservas"
          className="block border border-carbon/10 bg-white p-6 transition hover:border-terracota"
        >
          <p className="font-mono text-[0.7rem] font-medium uppercase tracking-eyebrow text-terracota">
            Reservas
          </p>
          <p className="mt-3 font-display text-xl text-carbon">
            Ver y gestionar reservas
          </p>
          <p className="mt-2 font-body text-[0.85rem] text-carbon/60">
            Marcar como pagadas, cancelar, exportar.
          </p>
        </Link>
        <Link
          href="/admin/clases"
          className="block border border-carbon/10 bg-white p-6 transition hover:border-terracota"
        >
          <p className="font-mono text-[0.7rem] font-medium uppercase tracking-eyebrow text-terracota">
            Clases
          </p>
          <p className="mt-3 font-display text-xl text-carbon">
            Crear y editar clases
          </p>
          <p className="mt-2 font-body text-[0.85rem] text-carbon/60">
            Cargar nuevas fechas, cambiar cupos, cancelar.
          </p>
        </Link>
      </div>

      <p className="mt-12 font-body text-[0.8rem] text-carbon/40">
        Las secciones se construyen en próximas etapas.
      </p>
    </div>
  );
}