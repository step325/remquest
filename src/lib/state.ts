/**
 * Normalizzazione dello stato letto dallo storage.
 *
 * I valori arrivano da `plugin.storage` e dall'evento StorageSyncedChange
 * senza alcuna validazione: una versione precedente del plugin o un sync
 * parziale porterebbero forme diverse fino dentro al render.
 */

import { type DayState, type StreakState, freshDayState, freshStreakState } from './gamification';

function num(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

/** Riporta un valore arbitrario alla forma DayState, campo per campo */
export function normalizeDayState(value: unknown, fallbackDay: string): DayState {
  const base = freshDayState(fallbackDay);
  if (!value || typeof value !== 'object') return base;
  const p = value as Record<string, unknown>;
  return {
    dayKey: typeof p.dayKey === 'string' ? p.dayKey : base.dayKey,
    totalXp: num(p.totalXp, base.totalXp),
    cardsDone: num(p.cardsDone, base.cardsDone),
    queueCleared: num(p.queueCleared, base.queueCleared),
    firstWinIds: Array.isArray(p.firstWinIds)
      ? p.firstWinIds.filter((id): id is string => typeof id === 'string')
      : base.firstWinIds,
    editingXpToday: num(p.editingXpToday, base.editingXpToday),
    bossDamage: num(p.bossDamage, base.bossDamage),
    bestCombo: num(p.bestCombo, base.bestCombo),
    crits: num(p.crits, base.crits),
    easyCards: num(p.easyCards, base.easyCards),
    halfwayDone: num(p.halfwayDone, base.halfwayDone),
  };
}

/** Riporta un valore arbitrario alla forma StreakState */
export function normalizeStreakState(value: unknown): StreakState {
  const base = freshStreakState();
  if (!value || typeof value !== 'object') return base;
  const p = value as Record<string, unknown>;
  const currentStreak = num(p.currentStreak, base.currentStreak);
  return {
    lastActiveDay: typeof p.lastActiveDay === 'string' ? p.lastActiveDay : base.lastActiveDay,
    currentStreak,
    // Il record non puo' essere inferiore alla streak in corso
    bestStreak: Math.max(num(p.bestStreak, base.bestStreak), currentStreak),
    lifetimeXp: num(p.lifetimeXp, base.lifetimeXp),
    tokens: Math.max(0, num(p.tokens, base.tokens)),
  };
}
