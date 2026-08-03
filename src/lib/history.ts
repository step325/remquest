/**
 * Storico delle giornate — logica pura.
 *
 * A mezzanotte lo stato del giorno si azzera e quello che hai fatto sparisce:
 * dopo un mese non resta traccia di come e' andata. Qui ogni giornata lascia
 * una riga, e la costanza si vede a colpo d'occhio invece di doverla ricordare.
 *
 * Si tiene solo il minimo che serve a disegnare la striscia: quante card e se
 * il boss e' caduto. Tutto il resto e' gia' altrove.
 */

import type { DayState } from './gamification';

export interface DayRecord {
  /** Giorno YYYY-MM-DD */
  day: string;
  /** Card completate */
  cards: number;
  /** XP guadagnati */
  xp: number;
  /** Il boss di quel giorno e' stato abbattuto */
  won: boolean;
}

/**
 * Quante giornate si conservano.
 *
 * Trenta bastano a mostrare un mese e a far vedere un'abitudine; oltre, la
 * striscia diventa illeggibile e lo storage cresce per niente.
 */
export const HISTORY_DAYS = 30;

export type History = DayRecord[];

export const freshHistory = (): History => [];

/**
 * Aggiunge o aggiorna la riga di una giornata.
 *
 * Le righe restano in ordine di giorno e la piu' recente sta in fondo. Se la
 * giornata c'e' gia' viene sostituita: durante la giornata la si riscrive piu'
 * volte, e devono restare i numeri finali, non i primi.
 */
export function withDay(history: History, day: DayState): History {
  const record: DayRecord = {
    day: day.dayKey,
    cards: day.cardsDone,
    xp: day.totalXp,
    won: day.queueCleared > 0,
  };

  const senzaQuelGiorno = history.filter((r) => r.day !== day.dayKey);
  const aggiornato = [...senzaQuelGiorno, record].sort((a, b) => a.day.localeCompare(b.day));
  return aggiornato.slice(-HISTORY_DAYS);
}

/** Quante giornate con almeno una card, fra quelle conservate */
export function activeDays(history: History): number {
  return history.filter((r) => r.cards > 0).length;
}

/** Il numero di card della giornata piu' piena: serve a scalare le colonnine */
/**
 * Le card di una giornata tipo: la media dei giorni in cui hai studiato.
 *
 * Serve a capire se oggi e' pesante *per te*: e' il numero a cui il bestiario
 * rapporta il carico. I giorni a zero restano fuori apposta — chi salta una
 * settimana non deve ritrovarsi la media dimezzata e mostri piu' grossi al
 * rientro, che sarebbe una punizione per essere tornato.
 *
 * Zero vuol dire "non lo so ancora": chi legge usa un carico di riferimento.
 */
export function averageCards(history: History): number {
  const attive = history.filter((record) => record.cards > 0);
  if (attive.length === 0) return 0;
  return attive.reduce((n, record) => n + record.cards, 0) / attive.length;
}

export function busiestDay(history: History): number {
  return history.reduce((max, r) => Math.max(max, r.cards), 0);
}

function count(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
}

function isRecord(value: unknown): value is DayRecord {
  return typeof value === 'object' && value !== null && typeof (value as DayRecord).day === 'string';
}

export function normalizeHistory(value: unknown): History {
  if (!Array.isArray(value)) return freshHistory();
  const righe = value.filter(isRecord).map((r) => ({
    day: r.day,
    cards: count(r.cards),
    xp: count(r.xp),
    won: r.won === true,
  }));
  // Un giorno duplicato arriva solo da uno storage rovinato: si tiene l'ultimo.
  const perGiorno = new Map(righe.map((r) => [r.day, r]));
  return [...perGiorno.values()].sort((a, b) => a.day.localeCompare(b.day)).slice(-HISTORY_DAYS);
}
