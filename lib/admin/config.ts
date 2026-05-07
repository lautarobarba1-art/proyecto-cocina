/**
 * Lista de emails autorizados para acceder al panel admin.
 *
 * Cuando llegue el momento de tener varios admins, esto se migra
 * a una tabla `admin_users` en Supabase. Para MVP con 1-2 personas,
 * hardcoded es más simple y seguro (no depende de un INSERT extra
 * que pueda fallar).
 */
export const ADMIN_ALLOWLIST: readonly string[] = [
    "lautarobarba1@gmail.com",
    "lautarobarba7@gmail.com",
    // Cuando tu clienta esté lista, sumá su email acá.
  ];
  
  /**
   * Comparación case-insensitive y trimmed.
   */
  export function isAdminEmail(email: string | null | undefined): boolean {
    if (!email) return false;
    const normalized = email.trim().toLowerCase();
    return ADMIN_ALLOWLIST.some((e) => e.toLowerCase() === normalized);
  }