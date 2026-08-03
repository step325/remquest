/** Chiavi giorno in fuso locale — mai UTC, altrimenti la giornata "salta" a sera. */

/** Formatta una data come YYYY-MM-DD in ora locale */
export function dayKeyOf(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Chiave giorno di oggi */
export function todayKey(): string {
  return dayKeyOf(new Date());
}

/** Chiave giorno di ieri */
export function yesterdayKey(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return dayKeyOf(d);
}

/**
 * Chiave giorno dell'altroieri.
 *
 * Serve alla protezione della serie: distingue una sola giornata saltata, che
 * un gettone puo' assorbire, da un buco piu' lungo che non si ripara.
 */
export function dayBeforeKey(): string {
  const d = new Date();
  d.setDate(d.getDate() - 2);
  return dayKeyOf(d);
}
