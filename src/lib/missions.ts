/**
 * Missioni giornaliere — logica pura.
 *
 * Tre missioni fisse ogni giorno diventano rumore di fondo dopo una settimana:
 * si smette di leggerle. Qui ce n'e' un mazzo e ogni giornata ne pesca tre,
 * sempre le stesse per tutta la giornata ma diverse da un giorno all'altro.
 *
 * La pesca e' una funzione del giorno, non un sorteggio: deve dare lo stesso
 * risultato su ogni dispositivo e dopo ogni riavvio, senza salvare niente.
 */

import type { StringKey } from './i18n/index';
import type { DayState } from './gamification';

export interface Mission {
  id: string;
  /** La frase da mostrare, nel dizionario delle lingue; `{n}` diventa `target` */
  key: StringKey;
  target: number;
  /** Quanto ne e' stato fatto oggi */
  progress: (day: DayState) => number;
  /**
   * Alla portata di una sessione qualunque.
   *
   * Serve a garantire che nessuna giornata esca con tre obiettivi tosti: tre
   * muri insieme scoraggiano invece di invogliare.
   */
  easy?: boolean;
}

/** Quante missioni si affrontano in un giorno */
export const MISSIONS_PER_DAY = 3;

/**
 * XP per una missione completata.
 *
 * Senza ricompensa le missioni sono decorazioni: si leggono una volta e poi si
 * ignorano, perche' fare o non fare quello che chiedono non cambia niente.
 */
export const MISSION_REWARD = 40;

/** Extra per averle completate tutte e tre nella stessa giornata */
export const ALL_MISSIONS_BONUS = 100;

/** Gli XP dovuti per aver completato `count` missioni in una volta sola */
export function missionReward(count: number, completedToday: number): number {
  if (count <= 0) return 0;
  const base = count * MISSION_REWARD;
  // Il tris si paga una volta sola, quando l'ultima delle tre cade.
  const tris = completedToday >= MISSIONS_PER_DAY && completedToday - count < MISSIONS_PER_DAY;
  return base + (tris ? ALL_MISSIONS_BONUS : 0);
}

export const MISSION_POOL: readonly Mission[] = [
  // --- Volume: si completano studiando e basta ---
  { id: 'cards_20', key: 'mission.cards', target: 20, progress: (d) => d.cardsDone, easy: true },
  { id: 'cards_50', key: 'mission.cards', target: 50, progress: (d) => d.cardsDone },
  { id: 'cards_100', key: 'mission.cards', target: 100, progress: (d) => d.cardsDone },
  { id: 'xp_150', key: 'mission.xp', target: 150, progress: (d) => d.totalXp, easy: true },
  { id: 'xp_300', key: 'mission.xp', target: 300, progress: (d) => d.totalXp },
  { id: 'xp_600', key: 'mission.xp', target: 600, progress: (d) => d.totalXp },

  // --- Obiettivo della giornata ---
  { id: 'queue_clear', key: 'mission.queueClear', target: 1, progress: (d) => d.queueCleared },
  {
    id: 'boss_damage',
    key: 'mission.bossDamage',
    target: 200,
    progress: (d) => d.bossDamage,
    easy: true,
  },

  // --- Qualita' della risposta: chiedono di sapere le card, non di farne tante ---
  {
    id: 'easy_10',
    key: 'mission.easy',
    target: 10,
    progress: (d) => d.easyCards,
    easy: true,
  },
  { id: 'easy_25', key: 'mission.easy', target: 25, progress: (d) => d.easyCards },
  {
    id: 'first_wins_10',
    key: 'mission.firstWins',
    target: 10,
    progress: (d) => d.firstWinIds.length,
    easy: true,
  },
  {
    id: 'first_wins_25',
    key: 'mission.firstWins',
    target: 25,
    progress: (d) => d.firstWinIds.length,
  },

  // --- Costanza dentro la sessione ---
  { id: 'combo_10', key: 'mission.combo', target: 10, progress: (d) => d.bestCombo, easy: true },
  { id: 'combo_25', key: 'mission.combo', target: 25, progress: (d) => d.bestCombo },
  { id: 'combo_50', key: 'mission.combo', target: 50, progress: (d) => d.bestCombo },

  // --- Fortuna e appunti ---
  { id: 'crits_5', key: 'mission.crits', target: 5, progress: (d) => d.crits, easy: true },
  { id: 'crits_15', key: 'mission.crits', target: 15, progress: (d) => d.crits },
  {
    id: 'notes_30',
    key: 'mission.notes',
    target: 30,
    progress: (d) => d.editingXpToday,
    easy: true,
  },
];

/** Vedi la nota in src/lib/bestiary.ts: FNV-1a, per sparpagliare giorni vicini */
function hash(text: string): number {
  let value = 2166136261;
  for (let i = 0; i < text.length; i++) {
    value ^= text.charCodeAt(i);
    value = Math.imul(value, 16777619);
  }
  return value >>> 0;
}

/**
 * Le missioni di una giornata.
 *
 * Si pesca da due mazzi separati — una facile e due qualsiasi — invece di
 * pescare tre volte dallo stesso: cosi' nessuna giornata puo' uscire con tre
 * obiettivi fuori portata, che e' il modo piu' rapido per far smettere di
 * guardare le missioni.
 */
export function missionsForDay(dayKey: string): Mission[] {
  const facili = MISSION_POOL.filter((m) => m.easy);
  const prima = facili[hash(`${dayKey}:facile`) % facili.length];

  const scelte: Mission[] = [prima];
  const resto = MISSION_POOL.filter((m) => m.id !== prima.id);

  // Passo primo rispetto alla lunghezza del mazzo: partendo da un punto
  // qualunque e avanzando sempre di quel passo si toccano tutte le posizioni
  // senza ripetersi, quindi i doppioni sono esclusi per costruzione.
  const passo = 7;
  let i = hash(`${dayKey}:resto`) % resto.length;
  while (scelte.length < MISSIONS_PER_DAY && scelte.length <= resto.length) {
    const candidata = resto[i % resto.length];
    if (!scelte.some((m) => m.id === candidata.id)) scelte.push(candidata);
    i += passo;
  }
  return scelte;
}
