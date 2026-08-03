/**
 * Chi affronti oggi — logica pura, senza sprite.
 *
 * Il mostro dipende dal giorno e da quante card ci sono in programma: le
 * giornate leggere schierano creature comuni, quelle pesanti un boss. Cosi'
 * l'avversario racconta gia' quanto sara' dura prima ancora di leggere gli HP.
 *
 * La scelta e' una funzione del giorno, non un sorteggio: deve restare la
 * stessa per tutta la giornata, anche riaprendo l'applicazione o passando da
 * un dispositivo all'altro, e nessuno deve salvarla da nessuna parte.
 */

export const TIER_COMMON = 'common';
export const TIER_UNCOMMON = 'uncommon';
export const TIER_BOSS = 'boss';

export type Tier = typeof TIER_COMMON | typeof TIER_UNCOMMON | typeof TIER_BOSS;

/** Quanti mostri contiene ogni scaglione */
export const MONSTER_COUNT: Record<Tier, number> = {
  [TIER_COMMON]: 10,
  [TIER_UNCOMMON]: 10,
  [TIER_BOSS]: 6,
};

/** Quante creature contiene il bestiario in tutto */
export const TOTAL_MONSTERS =
  MONSTER_COUNT[TIER_COMMON] + MONSTER_COUNT[TIER_UNCOMMON] + MONSTER_COUNT[TIER_BOSS];

/** Tutti gli scaglioni nell'ordine in cui si mostrano */
export const TIERS: readonly Tier[] = [TIER_COMMON, TIER_UNCOMMON, TIER_BOSS];

/**
 * Il carico di una giornata qualunque, per chi non ha ancora uno storico.
 *
 * Serve solo i primi giorni: senza una media a cui rapportarsi, cento card
 * sembrerebbero un'enormita' a chiunque e uscirebbero solo boss.
 */
export const REFERENCE_LOAD = 40;

/** Oltre questo, "pesante" non diventa piu' pesante: e' comunque durissima */
const MAX_LOAD = 4;

/**
 * Quanto pesa la giornata rispetto alle tue.
 *
 * Uno vuol dire "come al solito". Le soglie fisse di prima (35 e 120 card)
 * dicevano invece quanto e' pesante una giornata *in assoluto*: chi ne fa
 * centotrenta ogni giorno era sempre oltre il massimo e incontrava soltanto i
 * sei boss, con venti mostri su ventisei irraggiungibili.
 */
export function loadFactor(cardsPlanned: number, average: number): number {
  const carico = Number.isFinite(cardsPlanned) && cardsPlanned > 0 ? cardsPlanned : 0;
  const media = Number.isFinite(average) && average > 0 ? average : REFERENCE_LOAD;
  return Math.min(MAX_LOAD, carico / media);
}

/**
 * Quanto pesa ogni scaglione, prima di guardare la giornata.
 *
 * I comuni sono il fondo del bestiario, i boss un avvenimento: dieci contro
 * uno. E' il peso di *ciascun* mostro, quindi conta anche quanti ce ne sono.
 */
const TIER_WEIGHT: Record<Tier, number> = {
  [TIER_COMMON]: 10,
  [TIER_UNCOMMON]: 5,
  [TIER_BOSS]: 1,
};

/**
 * Come il carico sposta quei pesi.
 *
 * Una giornata leggera schiaccia i boss quasi a zero e gonfia i comuni; una
 * pesante fa il contrario, ma senza mai ribaltare la gerarchia: anche nel
 * giorno peggiore un boss resta piu' raro di una creatura comune, altrimenti
 * smetterebbe di essere un avvenimento.
 */
function loadMultiplier(tier: Tier, load: number): number {
  // 0 = giornata vuota, 1 = come al solito, 4 = quattro volte il normale
  if (tier === TIER_COMMON) return 1.6 - 0.5 * Math.min(load, 2);
  if (tier === TIER_UNCOMMON) return 0.6 + 0.4 * Math.min(load, 2);
  return 0.15 + 1.2 * load;
}

/** Le probabilita' dei tre scaglioni, per una giornata di quel peso */
export function tierOdds(load: number): Record<Tier, number> {
  const pesi = TIERS.map((tier) => TIER_WEIGHT[tier] * MONSTER_COUNT[tier] * loadMultiplier(tier, load));
  const totale = pesi.reduce((a, b) => a + b, 0);
  const odds = {} as Record<Tier, number>;
  TIERS.forEach((tier, i) => {
    odds[tier] = pesi[i] / totale;
  });
  return odds;
}

export interface Monster {
  tier: Tier;
  /** Posizione dentro lo scaglione */
  index: number;
}

/**
 * Numero stabile ricavato da una stringa.
 *
 * E' l'hash FNV-1a, scelto perche' sta in quattro righe e sparpaglia bene
 * anche stringhe quasi uguali — e due giorni consecutivi differiscono di un
 * carattere solo. Con una somma dei codici, "02" e "03" darebbero mostri
 * vicini e il bestiario sembrerebbe scorrere in ordine.
 */
function hash(text: string): number {
  let value = 2166136261;
  for (let i = 0; i < text.length; i++) {
    value ^= text.charCodeAt(i);
    value = Math.imul(value, 16777619);
  }
  return value >>> 0;
}

/**
 * Un numero fra 0 e 1 ricavato dal giorno: e' il dado, ma non e' un caso.
 *
 * Deve restare lo stesso per tutta la giornata e su ogni dispositivo, quindi
 * si tira dall'hash della data invece che da `Math.random()`.
 */
function roll(seed: string): number {
  return hash(seed) / 4294967296;
}

/**
 * Chi si affronta oggi.
 *
 * Il carico non decide piu' lo scaglione: ne sposta le probabilita'. Cosi' una
 * giornata pesante *rischia* un boss senza garantirlo, e una leggera puo'
 * comunque riservarne uno ogni tanto — che e' l'unico modo perche' tutti e
 * ventisei i mostri restino raggiungibili.
 */
export function monsterForDay(dayKey: string, cardsPlanned: number, average = 0): Monster {
  const odds = tierOdds(loadFactor(cardsPlanned, average));

  let dado = roll(`${dayKey}:tier`);
  let tier: Tier = TIER_COMMON;
  for (const candidato of TIERS) {
    if (dado < odds[candidato]) {
      tier = candidato;
      break;
    }
    dado -= odds[candidato];
    tier = candidato;
  }

  // Lo scaglione entra nel secondo tiro: senza, lo stesso giorno mostrerebbe la
  // creatura nella stessa posizione di ogni elenco e i tre sembrerebbero legati.
  return { tier, index: hash(`${dayKey}:${tier}`) % MONSTER_COUNT[tier] };
}
