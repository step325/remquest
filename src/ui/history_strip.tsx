/**
 * La striscia degli ultimi trenta giorni.
 *
 * Una colonnina per giornata, alta quanto le card fatte rispetto al giorno piu'
 * pieno. Oro se il boss e' caduto, blu se hai studiato senza abbatterlo, un
 * trattino spento se quel giorno non hai fatto niente — ed e' proprio quella
 * fila di trattini che si vuole evitare di far crescere.
 */

import { activeDays, busiestDay, type History } from '../lib/history';
import type { Translate } from '../lib/i18n/index';

/** Altezza massima di una colonnina, in pixel */
const MAX_HEIGHT = 40;

/** Anche la giornata piu' fiacca deve lasciare un segno visibile */
const MIN_HEIGHT = 3;

export function HistoryStrip({ history, t }: { history: History; t: Translate }) {
  if (history.length === 0) {
    return <p className="rq-empty">{t('history.empty')}</p>;
  }

  const busiest = busiestDay(history);

  return (
    <>
      <ul className="rq-history">
        {history.map((record) => {
          const share = busiest > 0 ? record.cards / busiest : 0;
          const height = record.cards > 0 ? Math.max(MIN_HEIGHT, Math.round(share * MAX_HEIGHT)) : 1;
          const tone = record.cards === 0 ? 'is-empty' : record.won ? 'is-won' : 'is-done';

          return (
            <li
              key={record.day}
              className={`rq-history-bar ${tone}`}
              style={{ height }}
              title={
                t('history.day', { a: record.day, b: record.cards, n: record.xp }) +
                (record.won ? t('history.dayWon') : '')
              }
            />
          );
        })}
      </ul>
      <div className="rq-history-legend">
        {t('history.legend', { a: activeDays(history), b: history.length, n: busiest })}
      </div>
    </>
  );
}
