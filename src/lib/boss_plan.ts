/**
 * Quanto e' grosso il boss di oggi — regola pura.
 *
 * La misura viene dalla coda, non da un conteggio nostro: `cards fatte oggi +
 * card rimaste nella sessione` e' il lavoro che RemNote ha messo in programma,
 * ed e' l'unico numero che coincide con quello che l'applicazione mostra.
 *
 * La strada precedente — cercare i deck, scendere nei discendenti, contare le
 * scadute — sbagliava alla radice: le card stanno in documenti *referenziati*
 * dal deck, non appesi sotto, e il «Daily Goal» di RemNote non appartiene a
 * nessun deck. Su una knowledge base vera dava 0 card mentre RemNote ne
 * chiedeva 13.
 */

import { HP_PER_CARD, type DayState } from './gamification';

export interface BossPlan {
  /** Punti vita totali del boss */
  maxHp: number;
  /** Card in programma per oggi: il boss cade comunque quando finiscono */
  cardsPlanned: number;
}

/**
 * Le card della giornata secondo la coda aperta adesso.
 *
 * Durante una sessione questa somma non si muove: ogni card fatta e' una in
 * meno fra le rimaste. Fra una sessione e l'altra invece cresce, ed e' cosi'
 * che una seconda coda allarga il boss invece di rimpicciolirlo.
 */
export function plannedFromQueue(day: DayState, remaining: number): number {
  return day.cardsDone + Math.max(0, remaining);
}

/**
 * Il piano di oggi, che non torna mai indietro.
 *
 * Il boss non rimpicciolisce: le card fatte escono dalla coda, e un piano che
 * le seguisse farebbe scendere la barra da due parti fino a un mostro che cade
 * da solo. Cresce invece volentieri, perche' una sessione in piu' e' lavoro in
 * piu' davvero da fare.
 */
export function planFor(previous: BossPlan, cardsToday: number): BossPlan {
  const cardsPlanned = Math.max(previous.cardsPlanned, Math.max(0, cardsToday));
  return { cardsPlanned, maxHp: Math.max(previous.maxHp, cardsPlanned * HP_PER_CARD) };
}
