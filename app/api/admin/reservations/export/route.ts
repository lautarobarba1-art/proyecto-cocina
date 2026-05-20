import { NextResponse } from "next/server";
import { getCurrentUserEmail } from "@/lib/supabase/auth-server";
import { isAdminEmail } from "@/lib/admin/config";
import { getReservasForAdmin, reservasToCSV } from "@/lib/admin/reservas-queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  // Auth
  const email = await getCurrentUserEmail();
  if (!email || !isAdminEmail(email)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const estado = url.searchParams.get("estado") ?? undefined;
  const mes = url.searchParams.get("mes") ?? undefined;

  const reservas = await getReservasForAdmin(1000, {
    status: estado as "pending" | "confirmed" | "cancelled" | "all" | undefined,
    mes,
  });

  const csv = reservasToCSV(reservas);

  const fecha = new Date().toISOString().slice(0, 10);
  const filename = `reservas-menesteres-${fecha}.csv`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}