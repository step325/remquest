/**
 * Il boss del giorno: l'obiettivo di oggi, ferito dalle card che completi.
 *
 * `plugin.queue.getNumRemainingCards()` non serve: fuori dalla coda restituisce
 * undefined e dentro restituisce tutte le card praticabili della knowledge base
 * (3442), non quelle della sessione. Gli HP vengono percio' dall'obiettivo
 * giornaliero dichiarato dal deck in `ExamConfig` — 123 card durante il
 * recupero dell'arretrato, 52 a regime — e il danno dalle card fatte oggi.
 */

import type { RNPlugin } from '@remnote/plugin-sdk';
import { type DayState, HP_PER_CARD, crossedHalfway } from './gamification';
import type { FxEmitter } from './fx';
import { countDueCards } from './due_cards';
import { todayKey } from './dates';
import {
  readBoss,
  writeBoss,
  writeDay,
  freshBossState,
  readCollection,
  writeCollection,
} from './storage';
import { monsterForDay } from './bestiary';
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
 * Ricalcola quanto e' grosso il boss di oggi.
 *
 * Costa qualche secondo (scandisce i discendenti dei deck), quindi va chiamata
 * di rado: all'avvio, ad intervalli e all'uscita dalla coda. Il danno inflitto
 * durante la sessione lo aggiorna `applyBossDamage`, che non costa nulla.
 */
export async function refreshBossPlan(deps: BossDeps): Promise<void> {
  const counted = await countDueCards(deps.plugin).catch(() => null);
  if (!counted) return;

  const today = todayKey();
  const [boss, day] = [await readBoss(deps.plugin, today), await deps.currentDay()];

  // Il boss non rimpicciolisce a meta' giornata: se l'obiettivo cala mentre si
  // studia, gli HP restano quelli con cui la battaglia e' cominciata.
  const maxHp = Math.max(boss.maxHp, counted.today * HP_PER_CARD);

  const cardsPlanned = Math.max(boss.cardsPlanned, counted.today);

  await writeBoss(deps.plugin, {
    ...freshBossState(today),
    maxHp,
    cardsPlanned,
    remaining: Math.max(0, maxHp - day.bossDamage),
    backlog: counted.backlog,
  });

  // Chi si e' presentato oggi entra nel bestiario anche se non lo si abbatte:
  // averlo incontrato e' gia' qualcosa, abbatterlo e' un'altra.
  await recordSeen(deps, cardsPlanned, today);
}

/** Segna nel bestiario il mostro di oggi, senza riscrivere se c'era gia' */
async function recordSeen(deps: BossDeps, cardsPlanned: number, today: string): Promise<void> {
  const monster = monsterForDay(today, cardsPlanned);
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

  const cardsFinished = boss.cardsPlanned > 0 && day.cardsDone >= boss.cardsPlanned;
  const remaining = cardsFinished ? 0 : Math.max(0, boss.maxHp - day.bossDamage);
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

    const monster = monsterForDay(today, boss.cardsPlanned);
    const collection = await readCollection(deps.plugin);
    const next = withDefeated(collection, monster);
    if (next !== collection) await writeCollection(deps.plugin, next);

    await deps.payCoins(COINS_PER_BOSS);
    await deps.bumpTotals((totals) => ({
      ...totals,
      bosses: totals.bosses + 1,
      monstersDefeated: next.defeated.length,
    }));
  }
}

