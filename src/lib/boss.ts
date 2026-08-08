/**
 * Il boss del giorno: l'obiettivo di oggi, ferito dalle card che completi.
 *
 * Gli HP vengono da `plugin.queue.getNumRemainingCards()`, letta a card
 * caricata: `fatte oggi + rimaste` e' il programma di RemNote, e coincide con
 * quello che l'applicazione mostra nel suo "Today's Goal".
 *
 * Prima si contavano le card scadute scandendo i deck. Sbagliava alla radice —
 * le card stanno in documenti referenziati dal deck e non appesi sotto, e il
 * "Daily Goal" non appartiene a nessun deck: su una knowledge base vera dava 0
 * mentre RemNote chiedeva 13 card.
 */

import type { RNPlugin } from '@remnote/plugin-sdk';
import { bossRemaining, type DayState, crossedHalfway } from './gamification';
import { planFor, plannedFromQueue } from './boss_plan';
import type { FxEmitter } from './fx';
import { averageCards } from './history';
import { todayKey } from './dates';
import {
  readBoss,
  readHistory,
  writeBoss,
  writeDay,
  freshBossState,
  readCollection,
  writeCollection,
} from './storage';
import { type Monster, monsterForDay } from './bestiary';
import { withDefeated, withSeen } from './collection';
import type { Totals } from './feats';
import { COINS_HALFWAY, COINS_PER_BOSS } from './wallet';
import type { Notifier } from './notifier';

export interface BossDeps {
  plugin: RNPlugin;
  /** Stato del giorno gia' azzerato se e' passata la mezzanotte */
  currentDay: () => Promise<DayState>;
  notifier: Notifier;
  /** Effetti a schermo: qui serve solo per la caduta del boss */
  emit: FxEmitter;
  /** Aggiorna i totali di sempre e annuncia le imprese meritate */
  bumpTotals: (change: (t: Totals) => Totals) => Promise<void>;
  /** Accredita monete */
  payCoins: (amount: number) => Promise<void>;
}

/**
 * Misura il boss dalla coda aperta.
 *
 * Da chiamare quando una card viene caricata: all'ingresso in coda RemNote non
 * sa ancora quante ne ha, e il boss nascerebbe con gli HP delle card gia'
 * fatte. Non costa niente, quindi si puo' rifare ad ogni card — la somma
 * `fatte + rimaste` non si muove durante la sessione.
 */
export async function measureBoss(deps: BossDeps): Promise<void> {
  const letto = await deps.plugin.queue.getNumRemainingCards().catch(() => undefined);
  if (typeof letto !== 'number' || !Number.isFinite(letto)) return;

  const today = todayKey();
  const [boss, day] = [await readBoss(deps.plugin, today), await deps.currentDay()];

  // La regola sta in boss_plan.ts: il piano non torna mai indietro.
  const { maxHp, cardsPlanned } = planFor(boss, plannedFromQueue(day, letto));
  if (maxHp === 0) return; // coda vuota: non c'e' nessun boss da misurare

  // Il mostro si sceglie una volta sola, alla prima misura della giornata:
  // rifarlo ad ogni card lo cambierebbe sotto gli occhi.
  const monster =
    boss.maxHp > 0
      ? boss.monster
      : monsterForDay(today, cardsPlanned, averageCards(await readHistory(deps.plugin)));

  await writeBoss(deps.plugin, {
    ...freshBossState(today),
    maxHp,
    cardsPlanned,
    remaining: bossRemaining(maxHp, cardsPlanned, day),
    queueRead: letto,
    monster,
  });

  // Chi si e' presentato oggi entra nel bestiario anche se non lo si abbatte:
  // averlo incontrato e' gia' qualcosa, abbatterlo e' un'altra.
  await recordSeen(deps, monster);
}

/** Segna nel bestiario il mostro di oggi, senza riscrivere se c'era gia' */
async function recordSeen(deps: BossDeps, monster: Monster): Promise<void> {
  const collection = await readCollection(deps.plugin);
  const next = withSeen(collection, monster);
  if (next !== collection) await writeCollection(deps.plugin, next);
}

/**
 * Aggiorna gli HP rimasti, senza rifare la scansione.
 *
 * Il boss cade in due modi: quando finisce i punti vita, oppure quando le card
 * in programma sono esaurite. Il secondo caso serve perche' il danno dipende da
 * come rispondi: chi risponde sempre "Partially recalled" arriverebbe in fondo
 * alla giornata con il boss ancora in piedi, che e' una punizione per aver
 * studiato. Chi risponde bene invece lo abbatte in anticipo, ed e' voluto.
 */
export async function applyBossDamage(deps: BossDeps): Promise<void> {
  const today = todayKey();
  const [boss, day] = [await readBoss(deps.plugin, today), await deps.currentDay()];
  if (boss.maxHp === 0) return; // il boss non e' ancora stato misurato

  const remaining = bossRemaining(boss.maxHp, boss.cardsPlanned, day);
  if (remaining === boss.remaining) return;

  await writeBoss(deps.plugin, { ...boss, remaining });

  // Traguardo di meta' strada: riempie il vuoto fra l'inizio e la caduta del
  // boss, che in una sessione lunga sono venti minuti senza niente in mezzo.
  if (crossedHalfway(day, boss.maxHp) && remaining > 0) {
    await writeDay(deps.plugin, { ...day, halfwayDone: 1 });
    await deps.payCoins(COINS_HALFWAY);
    await deps.emit({ kind: 'halfway', damage: day.bossDamage, amount: COINS_HALFWAY });
    deps.notifier.now();
  }

  if (remaining === 0 && day.queueCleared === 0) {
    await writeDay(deps.plugin, { ...day, queueCleared: 1 });
    // Prima l'evento, poi l'avviso: quest'ultimo legge l'ultimo evento
    // scritto, quindi deve trovarcelo gia'.
    await deps.emit({ kind: 'bossdown', damage: boss.maxHp });
    deps.notifier.now();

    const collection = await readCollection(deps.plugin);
    const next = withDefeated(collection, boss.monster);
    if (next !== collection) await writeCollection(deps.plugin, next);

    await deps.payCoins(COINS_PER_BOSS);
    await deps.bumpTotals((totals) => ({
      ...totals,
      bosses: totals.bosses + 1,
      monstersDefeated: next.defeated.length,
    }));
  }
}

