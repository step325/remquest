/**
 * Logica di gioco pura — nessuna dipendenza da @remnote/plugin-sdk.
 * Tutte le costanti XP/tetto sono qui per poterle ritoccare in un punto solo.
 */

// ---------------------------------------------------------------------------
// Costanti XP
// ---------------------------------------------------------------------------

/**
 * Esito di una ripetizione, cioe' quale dei quattro pulsanti e' stato premuto.
 * `other` copre le interazioni che non sono risposte: leech, reset, modifiche
 * manuali della data.
 */
export type ReviewOutcome = 'forgot' | 'partial' | 'effort' | 'easy' | 'other';

/**
 * XP per esito.
 *
 * La scala premia la padronanza: piu' sai la card, piu' prendi. E' l'unica
 * direzione che non si puo' sfruttare — per guadagnare di piu' devi sapere
 * davvero la risposta, e mentire verso l'alto ti rimanda la card di un mese.
 * La scala opposta (piu' fatichi, piu' prendi) si sfrutta cliccando sempre
 * "Partially recalled", che in piu' ti fa rivedere la card prima.
 */
export const XP_BY_OUTCOME: Record<ReviewOutcome, number> = {
  forgot: 0,
  partial: 5,
  effort: 8,
  easy: 10,
  other: 0,
};

/** XP quando il payload non dice quale pulsante e' stato premuto */
export const XP_REVIEW_FALLBACK = 8;

/** Bonus per la prima ripetizione riuscita di una card */
export const XP_FIRST_WIN_BONUS = 15;

// ---------------------------------------------------------------------------
// Boss
// ---------------------------------------------------------------------------

/**
 * Punti vita per ogni card in programma.
 *
 * Il boss non vale piu' una card un colpo: ogni card gli mette addosso cinque
 * punti vita, e quanti gliene togli dipende da come hai risposto. Un colpo che
 * vale sempre uno non dice niente, un colpo che pesa diverso si sente.
 */
export const HP_PER_CARD = 5;

/**
 * Danno per esito.
 *
 * La media dei tre esiti utili sta poco sotto HP_PER_CARD: con i critici il
 * conto torna e il boss cade piu' o meno quando finisci le card. Piu' o meno,
 * non esattamente — chi risponde bene lo abbatte in anticipo, ed e' il punto.
 */
export const DAMAGE_BY_OUTCOME: Record<ReviewOutcome, number> = {
  forgot: 0,
  partial: 3,
  effort: 5,
  easy: 7,
  other: 0,
};

/** Probabilita' che un colpo sia critico */
export const CRIT_CHANCE = 0.2;

/** Quanto moltiplica il danno un colpo critico */
export const CRIT_MULTIPLIER = 2;

/** XP per blocco di editing (5 minuti di attivita') */
export const XP_EDITING_BLOCK = 10;
/** Durata del blocco di editing in millisecondi (5 min) */
export const EDITING_BLOCK_MS = 5 * 60 * 1000;
/** Tetto giornaliero XP da editing */
export const EDITING_XP_DAILY_CAP = 60;

// ---------------------------------------------------------------------------
// Tipi stato giornaliero
// ---------------------------------------------------------------------------

export interface DayState {
  /** Chiave giorno YYYY-MM-DD in ora locale */
  dayKey: string;
  totalXp: number;
  cardsDone: number;
  /** Quante volte la coda e' stata svuotata oggi (basta >=1 per la missione) */
  queueCleared: number;
  /** Set di card-id gia' premiate con il bonus "prima vittoria" */
  firstWinIds: string[];
  /** XP accumulati dall'editing oggi (per tetto) */
  editingXpToday: number;
  /** Serie di colpi piu' lunga raggiunta oggi */
  bestCombo: number;
  /** Colpi critici messi a segno oggi */
  crits: number;
  /** Card risposte con "Easily recalled" */
  easyCards: number;
  /**
   * La meta' dei punti vita del boss e' gia' stata superata oggi.
   *
   * Serve a non ripetere l'annuncio: senza, ogni colpo dopo la meta' lo
   * rifarebbe partire, e un traguardo che scatta venti volte non e' piu' un
   * traguardo.
   */
  halfwayDone: number;
  /**
   * Danno inflitto al boss oggi.
   *
   * Va tenuto da parte perche' non e' piu' ricavabile: quando ogni colpo
   * valeva una card bastava contare le card fatte, ora dipende da come hai
   * risposto e dai critici, che non si possono ricalcolare a posteriori.
   */
  bossDamage: number;
}

export interface StreakState {
  /** Ultimo giorno in cui l'utente ha fatto almeno una card */
  lastActiveDay: string;
  /** Giorni consecutivi attuali */
  currentStreak: number;
  /** Record storico di giorni consecutivi */
  bestStreak: number;
  /** XP totali di sempre: gli XP giornalieri si azzerano, il livello no */
  lifetimeXp: number;
  /**
   * Gettoni che assorbono una giornata saltata.
   *
   * Perdere quaranta giorni di fila per una serata storta e' il momento in cui
   * si molla, e non ha niente a che vedere con quanto si e' studiato fin li'.
   */
  tokens: number;
}

/** Giorni di fila che fruttano un gettone */
export const TOKEN_EVERY = 7;

/** Oltre questo numero i gettoni non si accumulano piu' */
export const MAX_STREAK_TOKENS = 3;

// ---------------------------------------------------------------------------
// Factory per stato fresco
// ---------------------------------------------------------------------------

export function freshDayState(day: string): DayState {
  return {
    dayKey: day,
    totalXp: 0,
    cardsDone: 0,
    queueCleared: 0,
    firstWinIds: [],
    editingXpToday: 0,
    bossDamage: 0,
    bestCombo: 0,
    crits: 0,
    easyCards: 0,
    halfwayDone: 0,
  };
}

export function freshStreakState(): StreakState {
  return { lastActiveDay: '', currentStreak: 0, bestStreak: 0, lifetimeXp: 0, tokens: 0 };
}

// ---------------------------------------------------------------------------
// Calcolo XP ripasso
// ---------------------------------------------------------------------------

/**
 * Traduce il punteggio dell'evento nel pulsante che e' stato premuto.
 *
 * I valori di `QueueInteractionScore` sono frazionari e ravvicinati:
 * AGAIN 0, TOO_EARLY 0.01, HARD 0.5, GOOD 1, EASY 1.5, poi 2 e oltre per
 * leech, reset e modifiche manuali. Si confrontano per fasce e non per valore
 * esatto: sono numeri in virgola mobile, e un `=== 0.5` e' una trappola.
 *
 * Restituisce null quando il punteggio non c'e': non e' un esito, e' un
 * payload che non sappiamo leggere, e chi chiama deve poterlo distinguere.
 */
export function outcomeFromScore(score: unknown): ReviewOutcome | null {
  if (typeof score !== 'number' || !Number.isFinite(score)) return null;
  // TOO_EARLY sta con AGAIN: la card e' comparsa prima del tempo, non e' una
  // risposta e non deve valere XP.
  if (score <= 0.01) return 'forgot';
  if (score < 0.75) return 'partial';
  if (score < 1.25) return 'effort';
  if (score < 1.75) return 'easy';
  return 'other';
}

/** L'esito di una ripetizione a partire dal payload dell'evento */
export function reviewOutcome(payload: unknown): ReviewOutcome | null {
  if (!payload || typeof payload !== 'object') return null;
  const p = payload as Record<string, unknown>;
  return outcomeFromScore(p['score'] ?? p['rating']);
}

/** Gli XP di una ripetizione; il fallback vale una risposta media */
export function xpFromCardReview(payload: unknown): number {
  const outcome = reviewOutcome(payload);
  return outcome === null ? XP_REVIEW_FALLBACK : XP_BY_OUTCOME[outcome];
}

/**
 * Danno inflitto al boss da una ripetizione.
 * `roll` e' un numero tra 0 e 1 preso da chi chiama: tenere il caso fuori da
 * qui e' cio' che rende la regola verificabile.
 */
export function bossDamageFrom(
  outcome: ReviewOutcome | null,
  roll: number
): { damage: number; critical: boolean } {
  const base = outcome === null ? DAMAGE_BY_OUTCOME.effort : DAMAGE_BY_OUTCOME[outcome];
  if (base <= 0) return { damage: 0, critical: false };

  const critical = roll < CRIT_CHANCE;
  return { damage: critical ? base * CRIT_MULTIPLIER : base, critical };
}

/** Una ripetizione conta come card fatta? Quella dimenticata torna in coda. */
export function countsAsDone(outcome: ReviewOutcome | null): boolean {
  if (outcome === null) return true; // payload illeggibile: meglio contarla
  return outcome !== 'forgot' && outcome !== 'other';
}

/**
 * Tenta di estrarre un id card dal payload dell'evento.
 * Restituisce null se non disponibile.
 */
export function cardIdFromPayload(payload: unknown): string | null {
  if (payload && typeof payload === 'object') {
    const p = payload as Record<string, unknown>;
    if (typeof p['cardId'] === 'string') return p['cardId'];
    if (typeof p['remId'] === 'string') return p['remId'];
    if (typeof p['_id'] === 'string') return p['_id'];
  }
  return null;
}

// ---------------------------------------------------------------------------
// Streak
// ---------------------------------------------------------------------------

/**
 * Fa avanzare la serie di giorni.
 *
 * `dayBefore` e' l'altroieri: serve a distinguere una sola giornata saltata —
 * che un gettone puo' assorbire — da un buco piu' lungo, che non si ripara.
 */
export function updateStreak(
  streak: StreakState,
  today: string,
  yesterday: string,
  dayBefore?: string
): StreakState {
  if (streak.lastActiveDay === today) {
    // Gia' aggiornato oggi, niente da fare
    return streak;
  }

  const continua = streak.lastActiveDay === yesterday;
  // Un giorno solo saltato, e un gettone da spendere: la serie tiene.
  const salvabile =
    !continua && dayBefore !== undefined && streak.lastActiveDay === dayBefore && streak.tokens > 0;

  const currentStreak = continua || salvabile ? streak.currentStreak + 1 : 1;
  const spesi = salvabile ? 1 : 0;
  // Il gettone si guadagna sulla soglia, non ogni giorno oltre: senza il resto
  // a zero se ne prenderebbe uno al giorno da li' in avanti.
  const guadagnati = currentStreak > 0 && currentStreak % TOKEN_EVERY === 0 ? 1 : 0;

  return {
    ...streak,
    lastActiveDay: today,
    currentStreak,
    bestStreak: Math.max(streak.bestStreak, currentStreak),
    tokens: Math.min(MAX_STREAK_TOKENS, streak.tokens - spesi + guadagnati),
  };
}

// ---------------------------------------------------------------------------
// Boss HP
// ---------------------------------------------------------------------------

/** Percentuale di danno inflitto (0–100) */
export function bossDamagePercent(maxHp: number, remaining: number): number {
  if (maxHp <= 0) return 0;
  const done = maxHp - remaining;
  return Math.min(100, Math.max(0, Math.round((done / maxHp) * 100)));
}

// ---------------------------------------------------------------------------
// Editing XP — throttle helper
// ---------------------------------------------------------------------------

/** Controlla se e' trascorso almeno un blocco di 5 min dall'ultimo XP di editing */
export function canAwardEditingXp(lastEditingXpTimestamp: number, now: number): boolean {
  return now - lastEditingXpTimestamp >= EDITING_BLOCK_MS;
}

/** Applica il tetto giornaliero e restituisce gli XP effettivi da aggiungere */
export function clampXp(xpToAdd: number, alreadyEarned: number, cap: number): number {
  const room = Math.max(0, cap - alreadyEarned);
  return Math.min(xpToAdd, room);
}

/**
 * Il boss ha appena passato la meta' dei punti vita?
 *
 * In una sessione lunga l'unico momento grosso e' la caduta del boss, e fino a
 * li' non succede niente per venti minuti. Questo riempie il vuoto a meta'
 * strada, una volta sola per giornata.
 *
 * Sta qui e non in boss.ts perche' quello importa l'SDK e non si puo'
 * verificare da solo: le regole pure devono restare raggiungibili dai test.
 */
export function crossedHalfway(day: DayState, maxHp: number): boolean {
  if (maxHp <= 0 || day.halfwayDone > 0) return false;
  return day.bossDamage * 2 >= maxHp;
}
