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

/** Da qui in su la giornata smette di essere leggera */
const UNCOMMON_FROM = 35;

/** Da qui in su e' roba da boss */
const BOSS_FROM = 120;

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

/** Lo scaglione che tocca a una giornata da tante card */
function tierFor(cardsPlanned: number): Tier {
  if (!Number.isFinite(cardsPlanned) || cardsPlanned < UNCOMMON_FROM) return TIER_COMMON;
  return cardsPlanned < BOSS_FROM ? TIER_UNCOMMON : TIER_BOSS;
}

export function monsterForDay(dayKey: string, cardsPlanned: number): Monster {
  const tier = tierFor(cardsPlanned);
  // Lo scaglione entra nell'hash: cambiando il carico cambia anche la faccia,
  // altrimenti lo stesso giorno mostrerebbe la creatura nella stessa posizione
  // di ogni scaglione e i tre elenchi sembrerebbero legati fra loro.
  return { tier, index: hash(`${dayKey}:${tier}`) % MONSTER_COUNT[tier] };
}
