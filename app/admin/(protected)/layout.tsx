import { redirect } from "next/navigation";
import { getCurrentUserEmail } from "@/lib/supabase/auth-server";
import { isAdminEmail } from "@/lib/admin/config";
import { AdminNavLinks } from "./AdminNavLinks";

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
          <AdminNavLinks email={email} />
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">{children}</main>
    </div>
  );
}