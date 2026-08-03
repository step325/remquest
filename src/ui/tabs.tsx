import type { Translate } from '../lib/i18n/index';

/**
 * Le schede del pannello.
 *
 * Tutto su una colonna sola era diventato un rotolo: per arrivare al negozio
 * bisognava scorrere oltre missioni, storico e imprese. Divise per scheda, ogni
 * sezione sta in una schermata e si raggiunge con un clic.
 *
 * La scheda scelta si ricorda fra un'apertura e l'altra: chi sta guardando il
 * bestiario di solito ci torna.
 */

export const TABS = [
  { id: 'diario', key: 'tab.diario' },
  { id: 'cronache', key: 'tab.cronache' },
  { id: 'bestiario', key: 'tab.bestiario' },
  { id: 'emporio', key: 'tab.emporio' },
  { id: 'impostazioni', key: 'tab.impostazioni' },
] as const;

export type TabId = (typeof TABS)[number]['id'];

/** La scheda da mostrare: quella salvata, se esiste ancora */
export function validTab(value: unknown): TabId {
  return TABS.some((t) => t.id === value) ? (value as TabId) : 'diario';
}

export function TabBar({
  active,
  onPick,
  t,
}: {
  active: TabId;
  onPick: (id: TabId) => void;
  t: Translate;
}) {
  return (
    <nav className="rq-tabs" aria-label={t('tab.aria')}>
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={`rq-tab${tab.id === active ? ' is-active' : ''}`}
          aria-current={tab.id === active ? 'page' : undefined}
          onClick={() => onPick(tab.id)}
        >
          {t(tab.key)}
        </button>
      ))}
    </nav>
  );
}
