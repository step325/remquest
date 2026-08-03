
import type { StringKey } from './i18n/index';

/**
 * Imprese: i traguardi che restano.
 *
 * Tutto il resto si azzera a mezzanotte — XP del giorno, missioni, boss — e
 * dopo un mese non c'e' niente che dica cosa hai fatto finora. Le imprese
 * invece si accumulano e non si perdono piu'.
 *
 * Si calcolano da uno stato cumulativo, non da una lista di flag: cosi' una
 * versione futura puo' aggiungere traguardi e quelli gia' meritati compaiono
 * subito, senza migrazioni.
 */

import { TOTAL_MONSTERS } from './bestiary';

export interface Totals {
  /** Card completate da sempre */
  cards: number;
  /** Boss abbattuti da sempre */
  bosses: number;
  /** Serie di colpi piu' lunga di sempre */
  bestCombo: number;
  /** Giorni di fila, record storico */
  bestStreak: number;
  /** Mostri diversi abbattuti */
  monstersDefeated: number;
}

export const freshTotals = (): Totals => ({
  cards: 0,
  bosses: 0,
  bestCombo: 0,
  bestStreak: 0,
  monstersDefeated: 0,
});

export interface Feat {
  id: string;
  /** La frase da mostrare, nel dizionario delle lingue; `{n}` diventa `target` */
  key: StringKey;
  /** Quanto serve per meritarla */
  target: number;
  /** Dove si legge il progresso */
  of: (t: Totals) => number;
}

export const FEATS: readonly Feat[] = [
  { id: 'cards_100', key: 'feat.cards', target: 100, of: (t) => t.cards },
  { id: 'cards_1000', key: 'feat.cards', target: 1000, of: (t) => t.cards },
  { id: 'cards_5000', key: 'feat.cards', target: 5000, of: (t) => t.cards },
  { id: 'streak_7', key: 'feat.streak', target: 7, of: (t) => t.bestStreak },
  { id: 'streak_30', key: 'feat.streak', target: 30, of: (t) => t.bestStreak },
  { id: 'streak_100', key: 'feat.streak', target: 100, of: (t) => t.bestStreak },
  { id: 'combo_50', key: 'feat.combo', target: 50, of: (t) => t.bestCombo },
  { id: 'combo_100', key: 'feat.combo', target: 100, of: (t) => t.bestCombo },
  { id: 'boss_1', key: 'feat.bossFirst', target: 1, of: (t) => t.bosses },
  { id: 'boss_10', key: 'feat.boss', target: 10, of: (t) => t.bosses },
  { id: 'boss_50', key: 'feat.boss', target: 50, of: (t) => t.bosses },
  { id: 'bestiary_10', key: 'feat.bestiaryPart', target: 10, of: (t) => t.monstersDefeated },
  {
    id: 'bestiary_all',
    key: 'feat.bestiary',
    // Non un 26 scritto a mano: aggiungendo mostri il traguardo si sposta da solo
    target: TOTAL_MONSTERS,
    of: (t) => t.monstersDefeated,
  },
];

/** Le imprese gia' meritate con questi totali */
export function earnedFeats(totals: Totals): Feat[] {
  return FEATS.filter((f) => f.of(totals) >= f.target);
}

/** Quelle appena cadute passando da un totale all'altro */
export function newlyEarned(before: Totals, after: Totals): Feat[] {
  return FEATS.filter((f) => f.of(before) < f.target && f.of(after) >= f.target);
}

function count(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
}

export function normalizeTotals(value: unknown): Totals {
  if (!value || typeof value !== 'object') return freshTotals();
  const p = value as Record<string, unknown>;
  return {
    cards: count(p.cards),
    bosses: count(p.bosses),
    bestCombo: count(p.bestCombo),
    bestStreak: count(p.bestStreak),
    monstersDefeated: count(p.monstersDefeated),
  };
}
