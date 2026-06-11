import { Resend } from "resend";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`[resend] Falta ${name} en variables de entorno`);
  return value;
}

export const FROM_EMAIL: string = requireEnv("FROM_EMAIL");
export const ADMIN_EMAIL: string = requireEnv("ADMIN_EMAIL");

export const resend = new Resend(requireEnv("RESEND_API_KEY"));