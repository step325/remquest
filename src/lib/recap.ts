/**
 * Il riepilogo di chiusura — logica pura.
 *
 * La coda si apre e si chiude senza cerimonie: si esce dalle card e la giornata
 * resta un numero dentro il pannello, che magari non si riapre. Un riepilogo
 * alla chiusura chiude il cerchio — dice com'e' andata *adesso*, nel momento in
 * cui uno sta smettendo.
 *
 * Non aggiunge niente al gioco: legge quello che il motore ha gia' contato e ne
 * fa una frase. Non c'e' nessun premio attaccato, perche' un premio per aver
 * chiuso la coda si prenderebbe uscendo e rientrando.
 */

import type { DayState } from './gamification';
import type { Translate } from './i18n/index';

export interface Recap {
  /** Card completate oggi */
  cards: number;
  /** XP di oggi */
  xp: number;
  /** Il boss di oggi e' caduto */
  bossDown: boolean;
}

/** Numero utile, oppure null se non e' un conteggio credibile */
function count(value: number): number | null {
  return Number.isFinite(value) && value >= 0 ? Math.floor(value) : null;
}

/**
 * Il riepilogo da annunciare, oppure `null` se non c'e' niente da dire.
 *
 * `shownAtCards` sono le card che l'ultimo riepilogo aveva gia' raccontato:
 * senza, entrare e uscire dalla coda tre volte di fila darebbe tre annunci
 * identici. Vive in memoria e non nello storage — un riepilogo perso al riavvio
 * non manca a nessuno, e una scrittura sincronizzata in piu' si', invece.
 */
export function recapFor(day: DayState, shownAtCards: number): Recap | null {
  const cards = count(day.cardsDone);
  const gia = count(shownAtCards);
  if (cards === null || gia === null) return null;
  // Chiudere una coda senza aver completato niente non e' una sessione.
  if (cards === 0 || cards <= gia) return null;

  return {
    cards,
    xp: count(day.totalXp) ?? 0,
    bossDown: (count(day.queueCleared) ?? 0) > 0,
  };
}

/**
 * La frase del riepilogo.
 *
 * La compone chi ha lo stato in mano (il motore) e non l'avviso, come per le
 * missioni e le imprese: cosi' il widget resta una cosa che disegna e basta.
 *
 * Il compagno entra nella frase quando c'e' — «tu e il gufo» invece di «tu» e'
 * tutta la differenza fra un consuntivo e una giornata passata insieme.
 */
export function recapBody(t: Translate, recap: Recap, petName: string): string {
  const testa =
    petName === ''
      ? t('toast.recapAlone', { n: recap.cards })
      : t('toast.recapWith', { a: petName, b: recap.cards });

  return testa + (recap.bossDown ? t('toast.recapBossDown') : '');
}
