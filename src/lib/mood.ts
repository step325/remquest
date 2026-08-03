import type { Translate } from './i18n/index';

/**
 * Umore del compagno — logica pura.
 *
 * Non e' un Tamagotchi: il compagno non peggiora se non studi e non c'e'
 * niente da curare. Cambia solo espressione in base a quello che il plugin
 * gia' sa della giornata, e non toglie mai nulla a nessuno.
 *
 * La differenza sta tutta qui: uno stato che *reagisce* a com'e' andata fa
 * compagnia, uno che *peggiora* se manchi fa venire i sensi di colpa — ed e'
 * il motivo per cui si chiude il pannello invece di aprirlo.
 */

import type { DayState } from './gamification';

export type Mood = 'asleep' | 'idle' | 'happy';

/** Card sotto le quali la giornata non e' ancora cominciata davvero */
const AWAKE_FROM = 1;

/** Card oltre le quali il compagno e' contento anche senza aver finito nulla */
const HAPPY_FROM = 30;

/**
 * Come sta il compagno adesso.
 *
 * `happy` quando c'e' qualcosa da festeggiare: boss abbattuto o una giornata
 * gia' piena. `asleep` prima della prima card — dorme, non e' triste, e al
 * primo colpo si sveglia.
 */
export function companionMood(day: DayState): Mood {
  if (day.queueCleared > 0 || day.cardsDone >= HAPPY_FROM) return 'happy';
  return day.cardsDone >= AWAKE_FROM ? 'idle' : 'asleep';
}

/** Cosa dice il compagno, per il tooltip */
export function moodLabel(t: Translate, mood: Mood, days: number, bosses: number): string {
  const storia =
    (days > 0 ? t('mood.days', { n: days }) : '') +
    (bosses > 0 ? t('mood.bosses', { n: bosses }) : '');

  if (mood === 'asleep') return t('mood.asleep') + storia;
  if (mood === 'happy') return t('mood.happy') + storia;
  return t('mood.idle') + storia;
}
