/**
 * Prestigio: le decorazioni che arrivano con i livelli alti — logica pura.
 *
 * Il livello e' un numero che sale e si legge in un angolo: dopo il decimo non
 * cambia piu' niente a schermo, e chi ripassa da tre mesi vede la stessa
 * intestazione di chi ha installato il plugin ieri. Qui si decide *quando*
 * l'intestazione cambia aspetto, e nient'altro.
 *
 * Non c'e' niente da comprare e niente da equipaggiare: il prestigio non sta
 * nel negozio perche' non e' merce, e' il segno di quanto hai ripassato — e per
 * lo stesso motivo per cui il negozio non vende potenziamenti (vedi la nota in
 * src/lib/wallet.ts) qui non si tocca nessun numero del gioco. Cambia solo
 * quello che si vede: una cornice attorno al livello, qualche scintilla sulla
 * barra, l'oro all'ultimo grado.
 */

import type { Translate } from './i18n/index';

/**
 * I livelli che sbloccano un grado.
 *
 * Dieci, venti, trenta: con la scala di src/lib/levels.ts sono 4.500, 19.000 e
 * 43.500 XP di sempre, cioe' settimane, un mese e mezzo, qualche mese. Sono
 * lontani di proposito — una decorazione che arriva al terzo giorno non dice
 * "vado avanti da un pezzo", che e' l'unica cosa che deve dire.
 *
 * L'ordine crescente e' un requisito, non una convenzione: un test lo pretende,
 * perche' una soglia fuori posto farebbe *scendere* il grado salendo di livello.
 */
export const PRESTIGE_LEVELS: readonly number[] = [10, 20, 30];

/** Quanti gradi si possono raggiungere; zero vuol dire nessuna decorazione */
export type PrestigeRank = 0 | 1 | 2 | 3;

export interface Prestige {
  rank: PrestigeRank;
  /**
   * La classe da aggiungere al contenitore del pannello.
   *
   * Vuota a grado zero, cosi' chi non ha sbloccato niente non si porta dietro
   * una classe che non fa nulla: il foglio di stile non deve avere regole che
   * annullano altre regole.
   */
  className: string;
  /** Il livello da cui arriva il grado attuale; zero se non ce n'e' nessuno */
  since: number;
}

const NESSUNO: Prestige = { rank: 0, className: '', since: 0 };

/**
 * Il grado di prestigio a un certo livello.
 *
 * Cumulativo: il terzo grado tiene anche le decorazioni del primo e del
 * secondo, perche' togliere qualcosa che era stato sbloccato — pur
 * sostituendolo con altro — si legge come una perdita.
 *
 * Il livello arriva da `levelFromXp` su XP letti dallo storage: se li' e'
 * rimasta roba rovinata, il conto non deve produrre una classe inventata.
 */
export function prestigeFor(level: number): Prestige {
  if (!Number.isFinite(level) || level < PRESTIGE_LEVELS[0]) return NESSUNO;

  // L'ultima soglia raggiunta: le soglie crescono, quindi contarle basta.
  const raggiunte = PRESTIGE_LEVELS.filter((soglia) => level >= soglia);
  const rank = raggiunte.length as PrestigeRank;

  return {
    rank,
    className: `rq-prestige-${rank}`,
    since: raggiunte[raggiunte.length - 1],
  };
}

/**
 * Cosa dice il prestigio, per il suggerimento a schermo.
 *
 * Serve perche' una cornice comparsa da sola non si spiega: chi la vede deve
 * poter capire da dove arriva, altrimenti sembra un difetto grafico invece di
 * un traguardo. `null` a grado zero — non c'e' niente da raccontare.
 */
export function prestigeLabel(t: Translate, prestige: Prestige): string | null {
  if (prestige.rank === 0) return null;
  return t('prestige.badge', { n: prestige.rank, a: prestige.since });
}
