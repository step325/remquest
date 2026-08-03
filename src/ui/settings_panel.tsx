/**
 * La scheda delle impostazioni.
 *
 * Sta nel pannello e non fra le impostazioni di RemNote per una ragione
 * pratica: quelle accettano interruttori e menu a tendina, non un pulsante che
 * chiede conferma. E l'azzeramento dei progressi una conferma la deve chiedere.
 *
 * La doppia conferma non e' un fastidio inutile: dietro quel pulsante ci sono
 * mesi di serie di giorni e un bestiario che non si ricostruisce.
 */

import { useState } from 'react';
import { AUTO_LANG, LANGS, type Lang, type Translate } from '../lib/i18n/index';
import { Section } from './components';

/** Dove si offre il caffe'. Un indirizzo solo, scritto una volta */
const COFFEE_URL = 'https://www.buymeacoffee.com/step325';

/** Il nome di una lingua, scritto in quella lingua */
const LANG_NAMES: Record<Lang, string> = { it: 'Italiano', en: 'English' };

/**
 * La scelta della lingua, con «Automatica» in testa.
 *
 * Il pulsante acceso e' quello *scelto*, non quello in uso: chi ha lasciato
 * fare all'applicazione deve vedere che sta lasciando fare, non credere di
 * aver scelto l'italiano.
 */
function LanguagePicker({
  lang,
  chosen,
  onPick,
  t,
}: {
  /** La lingua che si sta usando davvero */
  lang: Lang;
  /** Quella scelta a mano, o AUTO_LANG se si segue l'applicazione */
  chosen: string;
  onPick: (value: string) => void;
  t: Translate;
}) {
  const options: { value: string; label: string }[] = [
    { value: AUTO_LANG, label: t('settings.langAuto', { n: LANG_NAMES[lang] }) },
    ...LANGS.map((code) => ({ value: code as string, label: LANG_NAMES[code] })),
  ];

  return (
    <div className="rq-settings-row">
      <span className="px-label">{t('settings.language')}</span>
      <div className="rq-settings-actions">
        {options.map((option) => (
          <button
            key={option.value || 'auto'}
            className="rq-button"
            type="button"
            aria-pressed={option.value === chosen}
            disabled={option.value === chosen}
            onClick={() => onPick(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * Quanto si perde, detto in numeri.
 *
 * «Sei sicuro?» non aiuta a decidere: mostrare gli XP di sempre, le monete e i
 * mostri raccolti si'.
 */
function DangerZone({
  lifetimeXp,
  coins,
  monsters,
  onReset,
  t,
}: {
  lifetimeXp: number;
  coins: number;
  monsters: number;
  onReset: () => void;
  t: Translate;
}) {
  const [asking, setAsking] = useState(false);
  const [done, setDone] = useState(false);

  return (
    <div className="rq-danger">
      <div className="rq-danger-title">{t('settings.danger')}</div>
      <p className="rq-danger-note">{t('settings.resetIntro')}</p>

      {done ? (
        <div className="rq-danger-note">{t('settings.resetDone')}</div>
      ) : asking ? (
        <>
          <p className="rq-danger-ask">
            {t('settings.resetAsk', { a: lifetimeXp, b: coins, n: monsters })}
          </p>
          <div className="rq-settings-actions">
            <button className="rq-button" type="button" onClick={() => setAsking(false)}>
              {t('settings.resetCancel')}
            </button>
            <button
              className="rq-button is-danger"
              type="button"
              onClick={() => {
                onReset();
                setAsking(false);
                setDone(true);
              }}
            >
              {t('settings.resetConfirm')}
            </button>
          </div>
        </>
      ) : (
        <button className="rq-button is-danger" type="button" onClick={() => setAsking(true)}>
          {t('settings.resetStart')}
        </button>
      )}
    </div>
  );
}

/**
 * L'offerta del caffe'.
 *
 * Un collegamento di testo e non il bottone ufficiale: quello e' un'immagine
 * presa da un CDN esterno, e dentro l'iframe di un widget non e' detto che
 * arrivi. Il testo si vede sempre.
 *
 * `noreferrer` oltre a `noopener`: la pagina che si apre non ha motivo di
 * sapere da dove arriva.
 */
function Coffee({ t }: { t: Translate }) {
  return (
    <div className="rq-coffee">
      <span className="rq-coffee-note">{t('settings.coffeeNote')}</span>
      <a
        className="rq-button"
        href={COFFEE_URL}
        target="_blank"
        rel="noopener noreferrer"
      >
        {t('settings.coffee')}
      </a>
    </div>
  );
}

export function SettingsPanel({
  lang,
  chosen,
  onLang,
  lifetimeXp,
  coins,
  monsters,
  onReset,
  t,
}: {
  lang: Lang;
  chosen: string;
  onLang: (value: string) => void;
  lifetimeXp: number;
  coins: number;
  monsters: number;
  onReset: () => void;
  t: Translate;
}) {
  return (
    <Section title={t('settings.section')}>
      <LanguagePicker lang={lang} chosen={chosen} onPick={onLang} t={t} />
      <Coffee t={t} />
      <DangerZone
        lifetimeXp={lifetimeXp}
        coins={coins}
        monsters={monsters}
        onReset={onReset}
        t={t}
      />
    </Section>
  );
}
