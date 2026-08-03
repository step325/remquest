/**
 * Eventi degli effetti a schermo — logica pura, nessuna dipendenza dall'SDK.
 *
 * Il motore gira nell'index widget, gli effetti si disegnano in un widget
 * dentro la coda: sono due iframe diversi e non possono chiamarsi. Il ponte e'
 * lo storage locale, come per il resto dello stato.
 *
 * Un solo slot "ultimo evento" non basterebbe: due card ravvicinate lo
 * sovrascriverebbero prima che il widget riesca a leggerlo. Qui si tiene un
 * anello degli ultimi eventi, ognuno con un numero di sequenza; il widget
 * disegna quelli con `seq` piu' alto di quello gia' visto.
 */

/** Tipi di effetto che il motore sa emettere */
export const FX_KINDS = [
  'hit',
  'crit',
  'miss',
  'levelup',
  'mission',
  'bossdown',
  'halfway',
  'streak',
  'feat',
  'recap',
] as const;

export type FxKind = (typeof FX_KINDS)[number];

/** Gli effetti che fanno avanzare la combo: sono i colpi veri al boss */
const COMBAT_KINDS: ReadonlySet<string> = new Set<FxKind>(['hit', 'crit']);

/**
 * Gli effetti che si disegnano come numero sopra il boss.
 *
 * Non tutti: gli altri portano un `damage` che non e' il colpo appena messo a
 * segno — `halfway` ci mette il danno totale della giornata e `bossdown` i punti
 * vita del mostro intero. Disegnandoli, a metà battaglia compariva un
 * «-340 +5 XP» che non corrispondeva a niente di quello che era appena
 * successo, e quel +5 erano monete.
 *
 * La serie interrotta ne fa parte: e' l'unica cosa accaduta a quella card, e va
 * detta dove si sta guardando.
 */
const POPUP_KINDS: ReadonlySet<string> = new Set<FxKind>(['hit', 'crit', 'miss']);

/** Se questo effetto va disegnato sopra il boss */
export function isPopupFx(kind: string): boolean {
  return POPUP_KINDS.has(kind);
}

export interface FxEvent {
  /** Numero di sequenza globale, crescente */
  seq: number;
  kind: FxKind;
  /** XP guadagnati */
  amount: number;
  /**
   * Punti vita tolti al boss.
   *
   * Non coincide con gli XP e va tenuto a parte: un critico raddoppia il danno
   * ma non gli XP, quindi mostrare gli uni al posto degli altri fa comparire
   * "CRITICO!" sopra un numero identico a quello di un colpo normale.
   */
  damage: number;
  /** Testo di contorno: nome della missione, titolo del livello nuovo */
  label?: string;
  /** Colpi consecutivi al momento dell'evento */
  combo: number;
  at: number;
}

/** Quello che serve per far comparire un effetto */
export interface FxInput {
  kind: FxKind;
  /** XP guadagnati */
  amount?: number;
  /** Punti vita tolti al boss */
  damage?: number;
  /** Testo di contorno: nome della missione, titolo del livello nuovo */
  label?: string;
}

/**
 * Come il motore manda un effetto all'HUD, senza sapere come ci arriva.
 *
 * Restituisce una promessa perche' chi annuncia un evento deve poter aspettare
 * che sia stato scritto: l'avviso legge l'ultimo evento del canale, e aprirlo
 * troppo presto significa mostrare quello di prima.
 */
export type FxEmitter = (input: FxInput) => Promise<unknown>;

export interface FxState {
  /** Ultimo numero di sequenza assegnato */
  seq: number;
  /** Anello degli ultimi eventi, dal piu' vecchio al piu' recente */
  events: FxEvent[];
  /** Colpi consecutivi correnti */
  combo: number;
  /** Istante dell'ultimo colpo: da qui si misura la finestra della combo */
  comboAt: number;
}

/**
 * Quanti eventi restano disponibili. Serve solo a coprire il ritardo tra la
 * scrittura del motore e la lettura del widget: gli effetti gia' disegnati non
 * interessano piu' a nessuno.
 */
export const FX_BUFFER = 8;

/**
 * Pausa massima tra due card perche' la combo prosegua. Venti secondi sono
 * larghi per una card facile e stretti per una pausa caffe'.
 */
export const COMBO_WINDOW_MS = 20_000;

/** Sotto questo numero di colpi la combo non si mostra nemmeno */
export const COMBO_MIN = 5;

export function freshFxState(): FxState {
  return { seq: 0, events: [], combo: 0, comboAt: 0 };
}

/** Aggiunge un evento e aggiorna la combo. Non tocca lo stato ricevuto. */
export function pushFx(state: FxState, input: FxInput, now: number): FxState {
  const isCombat = COMBAT_KINDS.has(input.kind);
  const continues = isCombat && state.combo > 0 && now - state.comboAt <= COMBO_WINDOW_MS;
  const seq = state.seq + 1;

  let combo = state.combo;
  // Una card sbagliata spezza la serie: e' quello che rende una combo lunga
  // una cosa di cui andare fieri invece di un contatore che sale e basta.
  if (input.kind === 'miss') combo = 0;
  else if (isCombat) combo = continues ? state.combo + 1 : 1;

  const event: FxEvent = {
    seq,
    kind: input.kind,
    amount: input.amount ?? 0,
    damage: input.damage ?? 0,
    combo,
    at: now,
  };
  if (input.label) event.label = input.label;

  return {
    seq,
    events: [...state.events, event].slice(-FX_BUFFER),
    combo,
    // Solo un colpo vero riapre la finestra: se bastasse un level up, una
    // pausa lunga terminata da una notifica terrebbe viva la combo.
    comboAt: isCombat ? now : state.comboAt,
  };
}

/**
 * Oltre questa eta' un effetto non si disegna piu'. Serve all'apertura della
 * coda: senza, il widget appena montato sparerebbe in faccia tutti gli eventi
 * rimasti nell'anello, compresi quelli di mezz'ora prima.
 */
export const FX_MAX_AGE_MS = 4_000;

/** Gli eventi comparsi dopo l'ultimo gia' disegnato */
export function unseenFx(state: FxState, lastSeq: number): FxEvent[] {
  return state.events.filter((e) => e.seq > lastSeq);
}

/** Gli eventi ancora da disegnare che sono anche abbastanza freschi */
export function recentFx(state: FxState, lastSeq: number, now: number): FxEvent[] {
  return unseenFx(state, lastSeq).filter((e) => now - e.at < FX_MAX_AGE_MS);
}

/**
 * Numero di sequenza dell'ultimo colpo al boss, 0 se non ce ne sono.
 * Il boss deve sussultare quando lo colpisci, non quando sali di livello.
 */
export function lastCombatSeq(state: FxState): number {
  for (let i = state.events.length - 1; i >= 0; i--) {
    if (COMBAT_KINDS.has(state.events[i].kind)) return state.events[i].seq;
  }
  return 0;
}

/** Scaglione di combo, per decidere quanto insistere con l'effetto */
export function comboTier(combo: number): 0 | 1 | 2 | 3 {
  if (combo >= 20) return 3;
  if (combo >= 10) return 2;
  if (combo >= COMBO_MIN) return 1;
  return 0;
}

/** Numero non negativo, oppure 0 se lo storage contiene qualcos'altro */
function count(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : 0;
}

function isFxEvent(value: unknown): value is FxEvent {
  if (typeof value !== 'object' || value === null) return false;
  const e = value as Record<string, unknown>;
  return (
    typeof e.seq === 'number' &&
    Number.isFinite(e.seq) &&
    typeof e.kind === 'string' &&
    (FX_KINDS as readonly string[]).includes(e.kind) &&
    typeof e.amount === 'number' &&
    typeof e.combo === 'number' &&
    typeof e.at === 'number'
  );
}

/** Il danno manca negli eventi scritti prima che esistesse: vale zero */
function withDamage(event: FxEvent): FxEvent {
  return typeof event.damage === 'number' && Number.isFinite(event.damage)
    ? event
    : { ...event, damage: 0 };
}

/** Rilegge lo stato dallo storage senza fidarsi di quello che ci trova */
export function normalizeFxState(raw: unknown): FxState {
  if (typeof raw !== 'object' || raw === null) return freshFxState();
  const state = raw as Record<string, unknown>;
  return {
    seq: count(state.seq),
    events: Array.isArray(state.events)
      ? state.events.filter(isFxEvent).map(withDamage).slice(-FX_BUFFER)
      : [],
    combo: count(state.combo),
    comboAt: count(state.comboAt),
  };
}
