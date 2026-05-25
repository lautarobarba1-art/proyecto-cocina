import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUserEmail } from "@/lib/supabase/auth-server";
import { isAdminEmail } from "@/lib/admin/config";
import { LogoutButton } from "../LogoutButton";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const email = await getCurrentUserEmail();

  if (!email || !isAdminEmail(email)) {
    redirect("/admin/login");
  }

  return (
    <div className="fixed inset-0 z-[9999] overflow-y-auto bg-crema-light">
      <header className="border-b border-carbon/10 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-8">
            <Link
              href="/admin"
              className="font-mono text-[0.7rem] font-medium uppercase tracking-eyebrow text-carbon"
            >
              Menesteres · Admin
            </Link>
            <nav className="flex gap-6">
              <Link
                href="/admin/reservas"
                className="font-sans text-[0.85rem] text-carbon/70 hover:text-carbon"
              >
                Reservas
              </Link>
              <Link
                href="/admin/clases"
                className="font-sans text-[0.85rem] text-carbon/70 hover:text-carbon"
              >
                Clases
              </Link>
              <Link
                href="/admin/inquiries"
                className="font-sans text-[0.85rem] text-carbon/70 hover:text-carbon"
              >
                Consultas
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <span className="font-sans text-[0.8rem] text-carbon/50">
              {email}
            </span>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
    </div>
  );
}