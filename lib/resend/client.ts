import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;

if (!apiKey) {
  throw new Error("RESEND_API_KEY no está configurada en .env.local");
}

export const resend = new Resend(apiKey);