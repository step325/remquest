/**
 * La griglia del bestiario.
 *
 * Tre stati per ogni creatura: mai vista, incontrata, abbattuta. I mai visti
 * restano sagome scure — si intuisce la forma senza rivelarla, che e' il motivo
 * per cui si continua a guardare la griglia.
 */

import { MONSTER_COUNT, TIERS, type Monster } from '../lib/bestiary';
import { monsterId, type Collection } from '../lib/collection';
import { monsterSprite } from './monsters';
import type { Translate } from '../lib/i18n/index';
import { PixelSprite } from './pixel_sprite';

/** Tutti i mostri, scaglione per scaglione */
function everyMonster(): Monster[] {
  return TIERS.flatMap((tier) =>
    Array.from({ length: MONSTER_COUNT[tier] }, (_, index) => ({ tier, index }))
  );
}

function Cell({ monster, collection, t }: { monster: Monster; collection: Collection; t: Translate }) {
  const id = monsterId(monster);
  const defeated = collection.defeated.includes(id);
  const seen = defeated || collection.seen.includes(id);

  const state = defeated ? 'is-defeated' : seen ? 'is-seen' : 'is-unknown';
  const title = t(defeated ? 'bestiary.defeated' : seen ? 'bestiary.seen' : 'bestiary.unseen');

  return (
    <li className={`rq-bestiary-cell ${state}`} title={title}>
      {/* La sagoma sconosciuta e' lo sprite vero tinto di scuro: cosi' la
          silhouette si intuisce ma non si riconosce ancora chi sia. */}
      <PixelSprite sprite={monsterSprite(monster)} scale={2} tint={seen ? undefined : '#232f52'} />
    </li>
  );
}

export function BestiaryGrid({ collection, t }: { collection: Collection; t: Translate }) {
  return (
    <ul className="rq-bestiary">
      {everyMonster().map((monster) => (
        <Cell key={monsterId(monster)} monster={monster} collection={collection} t={t} />
      ))}
    </ul>
  );
}
