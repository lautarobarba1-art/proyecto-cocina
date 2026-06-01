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
        Gestioná reservas, clases, eventos privados y consultas del sitio.
      </p>

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
            Calendario
          </p>
          <p className="mt-3 font-display text-xl text-carbon">
            Clases y eventos
          </p>
          <p className="mt-2 font-body text-[0.85rem] text-carbon/60">
            Cargar fechas, cupos y eventos privados confirmados.
          </p>
        </Link>
        <Link
          href="/admin/inquiries"
          className="block border border-carbon/10 bg-white p-6 transition hover:border-terracota"
        >
          <p className="font-mono text-[0.7rem] font-medium uppercase tracking-eyebrow text-terracota">
            Consultas
          </p>
          <p className="mt-3 font-display text-xl text-carbon">
            Mensajes recibidos
          </p>
          <p className="mt-2 font-body text-[0.85rem] text-carbon/60">
            Contacto, eventos privados (solicitudes) y alquiler del espacio.
          </p>
        </Link>
      </div>
    </div>
  );
}
