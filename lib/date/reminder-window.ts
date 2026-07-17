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
