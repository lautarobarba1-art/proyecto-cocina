/**
 * Aritmética de fecha/hora para decidir CUÁNDO enviar un recordatorio de
 * clase. Separado a propósito de `lib/date/timezone.ts`: ese módulo formatea
 * `classes.date`/`start_time` para mostrarlos en pantalla y evita a propósito
 * pasar por `Date`/`Intl` (para no introducir corrimientos de zona). Acá, en
 * cambio, necesitamos el instante UTC real de inicio de la clase para poder
 * compararlo contra `now()` — un problema distinto que si requiere aritmética.
 *
 * Argentina no tiene horario de verano desde 2009: Buenos Aires es UTC-3 fijo
 * todo el año. Por eso alcanza con sumar 3 horas al valor naive de
 * `classes.date` + `classes.start_time` (que representan hora local de
 * Buenos Aires) para obtener el instante UTC equivalente — no hace falta una
 * tabla de zonas horarias ni manejar transiciones de DST.
 */

const BUENOS_AIRES_UTC_OFFSET_HOURS = 3;

/**
 * Convierte fecha (YYYY-MM-DD) + horario (HH:MM[:SS]) naive de hora local de
 * Buenos Aires al instante UTC real que representan.
 */
export function classStartToUtcInstant(
  classDateISO: string,
  classStartTime: string,
): Date {
  const [year, month, day] = classDateISO.split("-").map(Number);
  const [hour, minute, second] = classStartTime.split(":").map(Number);

  return new Date(
    Date.UTC(
      year,
      month - 1,
      day,
      (hour || 0) + BUENOS_AIRES_UTC_OFFSET_HOURS,
      minute || 0,
      second || 0,
    ),
  );
}

/**
 * Horas (puede ser fraccionario, y negativo si la clase ya empezó) entre
 * `now` y el inicio real de la clase.
 */
export function hoursUntilClassStart(
  classDateISO: string,
  classStartTime: string,
  now: Date = new Date(),
): number {
  const startUtc = classStartToUtcInstant(classDateISO, classStartTime);
  return (startUtc.getTime() - now.getTime()) / (1000 * 60 * 60);
}

/**
 * Ventana ancha y redundante a propósito: con un disparador que corre cada
 * hora, cada clase cae dentro de esta ventana en ~2 corridas consecutivas
 * antes de salir de ella. Eso es la red de seguridad contra un disparador
 * atrasado o saltado — la protección contra ENVIAR DOS VECES la depende
 * enteramente de `claim_notification_attempt` (dedup key), no de que esta
 * ventana sea angosta.
 */
export const REMINDER_WINDOW_MIN_HOURS = 23;
export const REMINDER_WINDOW_MAX_HOURS = 25;

export function isWithinReminderWindow(
  classDateISO: string,
  classStartTime: string,
  now: Date = new Date(),
): boolean {
  const hours = hoursUntilClassStart(classDateISO, classStartTime, now);
  return hours >= REMINDER_WINDOW_MIN_HOURS && hours < REMINDER_WINDOW_MAX_HOURS;
}

// ─── Hora de pared de Buenos Aires ──────────────────────────────────────────────
// Los crons de la app disparan cada hora en UTC; para decidir "¿son las 8 de la
// mañana en Argentina?" o "¿qué fecha es dentro de 4 días acá?" alcanza con
// restar el offset fijo UTC-3 (sin DST desde 2009) y leer la hora/fecha UTC del
// instante corrido.

function shiftedToBuenosAires(now: Date): Date {
  return new Date(now.getTime() - BUENOS_AIRES_UTC_OFFSET_HOURS * 60 * 60 * 1000);
}

/** Hora de pared (0-23) y fecha ISO (YYYY-MM-DD) en Buenos Aires para `now`. */
export function buenosAiresWallClock(now: Date = new Date()): {
  hour: number;
  dateISO: string;
} {
  const shifted = shiftedToBuenosAires(now);
  return { hour: shifted.getUTCHours(), dateISO: shifted.toISOString().slice(0, 10) };
}

/** Fecha ISO (YYYY-MM-DD) a `daysAhead` días de hoy, en hora de Buenos Aires. */
export function buenosAiresDateInDays(
  daysAhead: number,
  now: Date = new Date(),
): string {
  const shifted = shiftedToBuenosAires(now);
  shifted.setUTCDate(shifted.getUTCDate() + daysAhead);
  return shifted.toISOString().slice(0, 10);
}
