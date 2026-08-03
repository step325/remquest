/**
 * Avviso a pixel per gli eventi rari: livello, missione, serie di giorni.
 *
 * Sostituisce `plugin.app.toast`, che disegna la notifica di sistema di
 * RemNote e non si puo' toccare. Questo invece e' un widget fluttuante: e'
 * roba nostra, quindi ha la cornice, il font e i colori del resto del gioco.
 *
 * Chi lo apre e chi lo chiude e' il motore: qui si legge soltanto l'ultimo
 * evento degno di annuncio e lo si disegna.
 */

import { renderWidget, useLocalStorageState, useSyncedStorageState } from '@remnote/plugin-sdk';
import { type FxEvent, type FxKind, freshFxState, normalizeFxState } from '../lib/fx';
import { KEY_FX, KEY_LANG } from '../lib/storage';
import {
  AUTO_LANG,
  type StringKey,
  type Translate,
  appLocale,
  resolveLang,
  translator,
} from '../lib/i18n/index';
import { PixelAnim, PixelSprite } from '../ui/pixel_sprite';
import { CHEST_OPEN, FLAME, SPARK } from '../ui/sprites';

/** Gli eventi che meritano un annuncio, con il loro titolo */
const ANNOUNCED: Partial<Record<FxKind, StringKey>> = {
  levelup: 'toast.levelup',
  mission: 'toast.mission',
  bossdown: 'toast.bossdown',
  halfway: 'toast.halfway',
  streak: 'toast.streak',
  feat: 'toast.feat',
};

/** L'ultimo evento da annunciare presente nell'anello */
function lastAnnounced(events: readonly FxEvent[]): FxEvent | null {
  for (let i = events.length - 1; i >= 0; i--) {
    if (ANNOUNCED[events[i].kind]) return events[i];
  }
  return null;
}

function icon(event: FxEvent) {
  if (event.kind === 'bossdown') return <PixelSprite sprite={CHEST_OPEN} scale={3} />;
  if (event.kind === 'streak') return <PixelAnim frames={FLAME} frameMs={220} scale={3} />;
  return <PixelSprite sprite={SPARK} scale={3} />;
}

/** Il corpo dell'annuncio, che cambia con il tipo di evento */
function message(t: Translate, event: FxEvent): string {
  switch (event.kind) {
    case 'levelup':
      return event.label ? `${event.amount} — ${event.label}` : `${event.amount}`;
    case 'streak':
      return t('toast.streakDays', { n: event.amount }) + (event.label ? ` · ${event.label}` : '');
    case 'bossdown':
      return t('toast.goalReached');
    case 'halfway':
      return t('toast.halfwayBody', { n: event.amount });
    case 'feat':
      return event.label ?? t('toast.milestone');
    default:
      // Il premio va detto: una missione che si completa senza dire cosa ha
      // fruttato sembra ancora una decorazione.
      return event.amount > 0
        ? t('toast.completedXp', { a: event.label ?? t('toast.completed'), b: event.amount })
        : (event.label ?? t('toast.completed'));
  }
}

function Toast() {
  const [rawFx] = useLocalStorageState(KEY_FX, freshFxState());
  const [rawLang] = useSyncedStorageState<string>(KEY_LANG, AUTO_LANG);
  const t = translator(resolveLang(rawLang, appLocale()));
  const event = lastAnnounced(normalizeFxState(rawFx).events);
  if (!event) return null;

  return (
    <div className="px rq-toast px-frame">
      <span className="rq-toast-icon">{icon(event)}</span>
      <span className="rq-toast-body">
        <span className="rq-toast-title">{t(ANNOUNCED[event.kind]!)}</span>
        <span className="rq-toast-text">{message(t, event)}</span>
      </span>
    </div>
  );
}

renderWidget(Toast);
