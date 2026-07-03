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
    <div className="fixed inset-0 z-9999 overflow-y-auto bg-crema-light">
      <header className="border-b border-carbon/10 bg-white">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-wrap items-center sm:flex-nowrap sm:gap-x-8">
            <Link
              href="/admin"
              className="py-3 font-mono text-[0.7rem] font-medium uppercase tracking-eyebrow text-carbon sm:py-4"
            >
              Menesteres · Admin
            </Link>
            <nav className="order-last flex w-full gap-4 border-t border-carbon/5 pb-2 pt-2 sm:order-0 sm:w-auto sm:gap-6 sm:border-t-0 sm:pb-0 sm:pt-0">
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
                Calendario
              </Link>
              <Link
                href="/admin/inquiries"
                className="font-sans text-[0.85rem] text-carbon/70 hover:text-carbon"
              >
                Consultas
              </Link>
            </nav>
            <div className="ml-auto flex items-center gap-3 py-3 sm:py-4">
              <span className="hidden sm:inline font-sans text-[0.8rem] text-carbon/50">
                {email}
              </span>
              <LogoutButton />
            </div>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">{children}</main>
    </div>
  );
}