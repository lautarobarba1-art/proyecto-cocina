import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/layout/Container";
import { ComprobanteUploadCard } from "@/components/reservas/ComprobanteUploadCard";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Subir comprobante · Menesteres",
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface ComprobantePageProps {
  params: Promise<{ id: string }>;
}

/**
 * Página persistente para subir el comprobante de pago, alcanzable desde el
 * link del email de reserva. Antes de esto la única vía era la pantalla de
 * éxito inmediatamente después de reservar (ClassReservationForm.tsx): si el
 * usuario la cerraba antes de transferir, no tenía forma de volver.
 *
 * El `id` de la reserva en la URL funciona como token de acceso (UUID, no
 * adivinable) — mismo modelo de confianza que ya usa
 * POST /api/reservations/[id]/comprobante, que no pide ninguna otra
 * autenticación.
 */
export default async function ComprobantePage({ params }: ComprobantePageProps) {
  const { id } = await params;
  if (!UUID_RE.test(id)) notFound();

  const supabase = getSupabaseAdmin();
  const { data: reservation } = await supabase
    .from("reservations")
    .select("customer_name, class_id, status, comprobante_url")
    .eq("id", id)
    .maybeSingle();

  if (!reservation) notFound();

  const { data: cls } = await supabase
    .from("classes")
    .select("title")
    .eq("id", reservation.class_id)
    .maybeSingle();

  const className = cls?.title ?? "tu clase";

  return (
    <Container as="main" className="py-16 lg:py-24">
      <div className="mx-auto max-w-lg border border-carbon/10 bg-crema-light p-8 lg:p-10 shadow-brand-lg">
        <p className="font-mono text-[0.7rem] font-medium uppercase tracking-eyebrow text-terracota">
          Comprobante de pago
        </p>
        <h1 className="mt-4 font-display text-2xl font-normal tracking-tightish text-carbon">
          {className}
        </h1>
        <p className="mt-2 font-body text-[0.95rem] text-carbon/65">
          Hola {reservation.customer_name}
        </p>

        {reservation.status === "cancelled" ? (
          <p className="mt-6 font-body text-[0.9rem] leading-relaxed text-carbon/75">
            Esta reserva fue cancelada. Si creés que es un error, escribinos.
          </p>
        ) : reservation.status === "confirmed" ? (
          <p className="mt-6 font-body text-[0.9rem] leading-relaxed text-carbon/75">
            Tu pago ya está confirmado — no hace falta que subas nada más.
          </p>
        ) : (
          <>
            <p className="mt-6 font-body text-[0.9rem] leading-relaxed text-carbon/65">
              Subí el comprobante de la transferencia y lo revisamos a la
              brevedad para confirmar tu lugar.
            </p>
            <ComprobanteUploadCard
              reservationId={id}
              initialUploaded={Boolean(reservation.comprobante_url)}
            />
          </>
        )}
      </div>
    </Container>
  );
}
