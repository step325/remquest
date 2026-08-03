/**
 * Conteggio delle card da ripassare — logica pura.
 *
 * RemNote distingue due cose che sembrano una sola: le "Due Reviews" sono le
 * card gia' studiate e tornate in scadenza, mentre quelle mai viste sono
 * "New Content" e vengono introdotte poche per volta secondo il tetto del
 * deck. Sommarle da' numeri senza senso (3003 invece di 123), quindi qui si
 * contano solo le scadute.
 */

/** Forma minima di una Card dell'SDK che ci interessa */
interface CardLike {
  nextRepetitionTime?: unknown;
}

export interface CardCounts {
  /** Card gia' studiate e tornate in scadenza: le "Due Reviews" */
  due: number;
  /** Card mai studiate: RemNote le introduce col suo ritmo, non sono "dovute" */
  neverStudied: number;
}

export function countCards(cards: readonly unknown[], now: number): CardCounts {
  let due = 0;
  let neverStudied = 0;

  for (const card of cards) {
    if (!card || typeof card !== 'object') continue;
    const next = (card as CardLike).nextRepetitionTime;
    if (typeof next !== 'number') neverStudied++;
    else if (next <= now) due++;
  }

  return { due, neverStudied };
}
