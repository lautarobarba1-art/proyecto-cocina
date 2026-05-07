import { NextRequest, NextResponse } from "next/server";

import { getMonthEvents } from "@/lib/calendar/data";

/**
 * Datos del calendario para el cliente (CalendarioPageClient).
 * El admin de Supabase solo corre en el servidor; no importar `getMonthEvents` desde "use client".
 */
export async function GET(req: NextRequest) {
  const year = Number(req.nextUrl.searchParams.get("year"));
  const month = Number(req.nextUrl.searchParams.get("month"));
  if (!Number.isFinite(year) || year < 1970 || year > 2100) {
    return NextResponse.json({ error: "Invalid year" }, { status: 400 });
  }
  if (!Number.isFinite(month) || month < 1 || month > 12) {
    return NextResponse.json({ error: "Invalid month" }, { status: 400 });
  }

  try {
    const data = await getMonthEvents(year, month);
    return NextResponse.json(data);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    console.error("[api/calendar/month]", e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
