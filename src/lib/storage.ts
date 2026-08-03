/**
 * Accesso allo storage del plugin, tipizzato e normalizzato.
 *
 * Le stesse chiavi sono lette dal widget con useSyncedStorageState /
 * useLocalStorageState: scrivere qui fa aggiornare la UI da sola.
 */

import { type Lang, appLocale, resolveLang } from './i18n/index';
import type { RNPlugin } from '@remnote/plugin-sdk';
import { type DayState, type StreakState } from './gamification';
import { type FxState, normalizeFxState } from './fx';
import { type Collection, normalizeCollection } from './collection';
import { type Totals, normalizeTotals } from './feats';
import { type History, normalizeHistory } from './history';
import { type Wallet, normalizeWallet } from './wallet';
import type { Exam } from './exams';
import { normalizeDayState, normalizeStreakState } from './state';
import { todayKey } from './dates';
import { MONSTER_COUNT, type Monster, TIERS, monsterForDay } from './bestiary';

/** Stato del giorno corrente (sincronizzato tra dispositivi) */
export const KEY_DAY = 'rq_day';
/** Streak, record e XP di sempre (sincronizzato) */
export const KEY_STREAK = 'rq_streak';
/** Card ancora da ripassare (locale: dipende dal dispositivo, non va sincronizzato) */
export const KEY_BOSS = 'rq_boss';
/** Esami programmati, riletti dalla knowledge base (locale: e' una cache) */
export const KEY_EXAMS = 'rq_exams';
/** Ultimo esito della diagnostica API, mostrato nel pannello */
export const KEY_DIAGNOSTICS = 'rq_diagnostics';
/**
 * Effetti da disegnare (locale: sono di questa schermata, qui e ora).
 * E' il canale tra il motore, che sta nell'index widget, e l'HUD della coda,
 * che e' un altro iframe e non puo' essere chiamato direttamente.
 */
export const KEY_FX = 'rq_fx';
/** Bestiario raccolto: e' di una vita, quindi sincronizzato fra dispositivi */
export const KEY_COLLECTION = 'rq_collection';
/** Totali di sempre, da cui si ricavano le imprese (sincronizzato) */
export const KEY_TOTALS = 'rq_totals';
/** Storico delle ultime giornate (sincronizzato) */
export const KEY_HISTORY = 'rq_history';
/** Monete e roba comprata (sincronizzato) */
export const KEY_WALLET = 'rq_wallet';
/** Scheda aperta nel pannello (locale: e' una preferenza di questo schermo) */
export const KEY_TAB = 'rq_tab';
/**
 * Lingua delle scritte (sincronizzata).
 *
 * Sta nello storage e non nelle impostazioni di RemNote perche' la leggono in
 * tre — pannello, HUD e motore degli avvisi — e lo storage sincronizzato e'
 * gia' il canale che tutti e tre ascoltano: cambiarla si vede subito ovunque,
 * senza un secondo posto da tenere allineato.
 */
export const KEY_LANG = 'rq_lang';

/**
 * La lingua da usare: quella scelta, o quella dell'applicazione.
 *
 * La leggono il pannello, l'HUD e il motore degli avvisi. Finche' nessuno
 * sceglie, nello storage non c'e' niente e si segue RemNote.
 */
export async function readLang(plugin: RNPlugin): Promise<Lang> {
  return resolveLang(await plugin.storage.getSynced(KEY_LANG), appLocale());
}

/**
 * Formato dello stato del boss. Va alzato quando cambia il modo di contare:
 * un conteggio salvato con regole diverse e' un dato sbagliato, non vecchio, e
 * senza questo controllo resterebbe in cache finche' l'utente non lo azzera a
 * mano (e' successo con i 3003 HP del conteggio via `card.getAll()`).
 */
export const BOSS_FORMAT = 5;

/** Ultimo conteggio noto dei punti vita del boss di oggi */
export interface BossState {
  /** Versione del formato con cui e' stato scritto */
  format: number;
  /** Giorno a cui si riferisce il conteggio: il boss e' quello di oggi */
  dayKey: string;
  /** Punti vita rimasti, o null se oggi la coda non e' ancora stata aperta */
  remaining: number | null;
  /** HP massimo (card in programma per HP_PER_CARD), fissato al primo conteggio */
  maxHp: number;
  /** Card in programma per oggi: il boss cade comunque quando finiscono */
  cardsPlanned: number;
  /** Card scadute in tutto: il boss ne affronta solo la fetta di oggi */
  backlog: number;
  /**
   * Chi si affronta oggi, deciso una volta sola.
   *
   * Sta qui e non nei widget perche' la scelta guarda la media dello storico:
   * farla ricalcolare a pannello e HUD significherebbe due letture in piu' e,
   * peggio, due mostri diversi se la media cambia mentre la coda e' aperta.
   */
  monster: Monster;
}

export const freshBossState = (day: string = todayKey()): BossState => ({
  format: BOSS_FORMAT,
  dayKey: day,
  remaining: null,
  maxHp: 0,
  cardsPlanned: 0,
  monster: monsterForDay(day, 0, 0),
  backlog: 0,
});

export function normalizeBossState(value: unknown, fallbackDay: string = todayKey()): BossState {
  const base = freshBossState(fallbackDay);
  if (!value || typeof value !== 'object') return base;
  const p = value as Record<string, unknown>;
  // Si riparte da zero se il conteggio e' di ieri o e' stato scritto con regole
  // diverse, invece di ereditare un numero che non significa piu' niente.
  if (p.format !== BOSS_FORMAT) return base;
  if (typeof p.dayKey !== 'string' || p.dayKey !== fallbackDay) return base;
  return {
    format: BOSS_FORMAT,
    dayKey: p.dayKey,
    remaining:
      typeof p.remaining === 'number' && Number.isFinite(p.remaining) ? p.remaining : null,
    maxHp: typeof p.maxHp === 'number' && Number.isFinite(p.maxHp) ? p.maxHp : 0,
    cardsPlanned:
      typeof p.cardsPlanned === 'number' && Number.isFinite(p.cardsPlanned) ? p.cardsPlanned : 0,
    backlog: typeof p.backlog === 'number' && Number.isFinite(p.backlog) ? p.backlog : 0,
    monster: normalizeMonster(p.monster, base.monster),
  };
}

/** Il mostro scritto nello stato, se e' ancora uno di quelli che esistono */
function normalizeMonster(value: unknown, fallback: Monster): Monster {
  if (!value || typeof value !== 'object') return fallback;
  const p = value as Record<string, unknown>;
  const tier = TIERS.find((t) => t === p.tier);
  if (!tier) return fallback;
  const index = typeof p.index === 'number' && Number.isFinite(p.index) ? Math.floor(p.index) : -1;
  return index >= 0 && index < MONSTER_COUNT[tier] ? { tier, index } : fallback;
}

/** Esito dell'ultima lettura degli esami */
export interface ExamsState {
  exams: Exam[];
  /** Quanti rem sono stati esaminati: distingue "nessun deck" da "nessuna data" */
  decksScanned: number;
  /** Quanti rem ha trovato ciascuna strada di ricerca, per capire dove guardare */
  detail?: string;
  /** Presente solo se la lettura e' fallita */
  error?: string;
}

export const freshExamsState = (): ExamsState => ({ exams: [], decksScanned: 0 });

export function normalizeExamsState(value: unknown): ExamsState {
  if (!value || typeof value !== 'object') return freshExamsState();
  const p = value as Record<string, unknown>;
  return {
    exams: Array.isArray(p.exams) ? (p.exams as Exam[]) : [],
    decksScanned: typeof p.decksScanned === 'number' ? p.decksScanned : 0,
    detail: typeof p.detail === 'string' ? p.detail : undefined,
    error: typeof p.error === 'string' ? p.error : undefined,
  };
}

export async function readDay(plugin: RNPlugin, day: string = todayKey()): Promise<DayState> {
  return normalizeDayState(await plugin.storage.getSynced(KEY_DAY), day);
}

export async function readStreak(plugin: RNPlugin): Promise<StreakState> {
  return normalizeStreakState(await plugin.storage.getSynced(KEY_STREAK));
}

export async function readBoss(plugin: RNPlugin, day: string = todayKey()): Promise<BossState> {
  return normalizeBossState(await plugin.storage.getLocal(KEY_BOSS), day);
}

export async function readFx(plugin: RNPlugin): Promise<FxState> {
  return normalizeFxState(await plugin.storage.getLocal(KEY_FX));
}

export const writeFx = (plugin: RNPlugin, fx: FxState) => plugin.storage.setLocal(KEY_FX, fx);

export async function readCollection(plugin: RNPlugin): Promise<Collection> {
  return normalizeCollection(await plugin.storage.getSynced(KEY_COLLECTION));
}

export const writeCollection = (plugin: RNPlugin, c: Collection) =>
  plugin.storage.setSynced(KEY_COLLECTION, c);

export async function readTotals(plugin: RNPlugin): Promise<Totals> {
  return normalizeTotals(await plugin.storage.getSynced(KEY_TOTALS));
}

export const writeTotals = (plugin: RNPlugin, t: Totals) =>
  plugin.storage.setSynced(KEY_TOTALS, t);

export async function readHistory(plugin: RNPlugin): Promise<History> {
  return normalizeHistory(await plugin.storage.getSynced(KEY_HISTORY));
}

export const writeHistory = (plugin: RNPlugin, h: History) =>
  plugin.storage.setSynced(KEY_HISTORY, h);

export async function readWallet(plugin: RNPlugin): Promise<Wallet> {
  return normalizeWallet(await plugin.storage.getSynced(KEY_WALLET));
}

export const writeWallet = (plugin: RNPlugin, w: Wallet) =>
  plugin.storage.setSynced(KEY_WALLET, w);

export const writeDay = (plugin: RNPlugin, day: DayState) => plugin.storage.setSynced(KEY_DAY, day);
export const writeStreak = (plugin: RNPlugin, streak: StreakState) =>
  plugin.storage.setSynced(KEY_STREAK, streak);
export const writeBoss = (plugin: RNPlugin, boss: BossState) =>
  plugin.storage.setLocal(KEY_BOSS, boss);
