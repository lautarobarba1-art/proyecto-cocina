import Link from "next/link";
import { notFound } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { ClaseFormCliente } from "../ClaseFormCliente";
import type { ClaseFormData } from "@/lib/admin/clases-validation";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Editar clase · Admin Menesteres",
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditarClasePage({ params }: PageProps) {
  const { id } = await params;
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("classes")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    notFound();
  }

  const initial: ClaseFormData & { id: string } = {
    id: data.id,
    slug: data.slug,
    date: data.date,
    title: data.title,
    startTime: data.start_time?.slice(0, 5) ?? "",
    endTime: data.end_time?.slice(0, 5) ?? "",
    categoryEvent: data.category_event,
    shortDesc: data.short_desc,
    isHighlighted: data.is_highlighted,
    categoryLabel: data.category_label,
    descriptionLong: data.description_long,
    durationLabel: data.duration_label,
    imageSrc: data.image_src,
    imageAlt: data.image_alt,
    totalSpots: data.total_spots,
    price:
      typeof data.price === "string" ? parseFloat(data.price) : data.price,
    paymentLink: data.payment_link,
  };

  return (
    <div>
      <header>
        <p className="font-mono text-[0.7rem] font-medium uppercase tracking-eyebrow text-terracota">
          Panel · Clases
        </p>
        <h1 className="mt-3 font-display text-3xl font-normal tracking-tightish text-carbon">
          Editar clase
        </h1>
        <p className="mt-3 font-body text-[0.92rem] leading-relaxed text-carbon/65">
          {initial.title}{" "}
          <span className="text-carbon/45">· {initial.date}</span>
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
        <ClaseFormCliente initial={initial} />
      </div>
    </div>
  );
}