/**
 * Il bestiario, messo insieme.
 *
 * Gli sprite stanno qui, la regola di chi tocca oggi sta in src/lib/bestiary.ts:
 * quella e' logica pura e verificabile, questa e' un elenco di disegni.
 */

import { TIER_BOSS, TIER_COMMON, TIER_UNCOMMON, type Monster, type Tier } from '../../lib/bestiary';
import type { Sprite } from './sprite';
import { COMMON } from './common';
import { UNCOMMON } from './uncommon';
import { BOSS } from './boss';

export type { Sprite } from './sprite';

const BY_TIER: Record<Tier, readonly Sprite[]> = {
  [TIER_COMMON]: COMMON,
  [TIER_UNCOMMON]: UNCOMMON,
  [TIER_BOSS]: BOSS,
};

/**
 * Lo sprite di un mostro. L'indice viene gia' preso a modulo dalla regola di
 * selezione, ma qui si ripete: un elenco accorciato non deve poter restituire
 * `undefined` a chi disegna.
 */
export function monsterSprite(monster: Monster): Sprite {
  const list = BY_TIER[monster.tier] ?? COMMON;
  return list[monster.index % list.length];
}
