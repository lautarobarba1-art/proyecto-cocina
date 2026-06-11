import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

/**
 * Rate limiters para endpoints públicos.
 *
 * Si las env vars de Upstash no están configuradas (ej: en dev local sin Redis),
 * las funciones devuelven `{ allowed: true }` y no bloquean nada — fail open.
 *
 * Límites:
 *   - reservations: 5 requests por IP cada 10 minutos (sliding window)
 *   - inquiries:    3 requests por IP por hora (sliding window)
 */

function makeRatelimiter(requests: number, window: Parameters<typeof Ratelimit.slidingWindow>[1]) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;

  return new Ratelimit({
    redis: new Redis({ url, token }),
    limiter: Ratelimit.slidingWindow(requests, window),
    prefix: "rl:menesteres",
  });
}

const reservationsLimiter = makeRatelimiter(5, "10 m");
const inquiriesLimiter    = makeRatelimiter(3, "1 h");

export type RatelimitResult = { allowed: true } | { allowed: false; retryAfter: number };

async function check(
  limiter: Ratelimit | null,
  ip: string,
  key: string,
): Promise<RatelimitResult> {
  if (!limiter) return { allowed: true };

  const { success, reset } = await limiter.limit(`${key}:${ip}`);
  if (success) return { allowed: true };

  const retryAfter = Math.ceil((reset - Date.now()) / 1000);
  return { allowed: false, retryAfter };
}

/**
 * Extrae la IP real del request respetando el header que setea Vercel.
 * Fallback a "unknown" si no hay nada (no bloquea — la key sigue siendo única).
 */
export function getIp(req: Request): string {
  const forwarded = (req as unknown as { headers: Headers }).headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return "unknown";
}

export async function checkReservationsLimit(ip: string): Promise<RatelimitResult> {
  return check(reservationsLimiter, ip, "reservations");
}

export async function checkInquiriesLimit(ip: string): Promise<RatelimitResult> {
  return check(inquiriesLimiter, ip, "inquiries");
}
