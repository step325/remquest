/**
 * Motore di gioco — gira nell'index widget, non in un widget React.
 *
 * Questo e' il punto chiave: i widget vengono smontati quando la loro zona di
 * UI sparisce (entrando nella coda a schermo intero la barra laterale non
 * c'e' piu'), e con loro morirebbero i listener. L'index widget invece resta
 * attivo finche' il plugin e' attivo, quindi gli XP si contano sempre.
 */

import { AppEvents, type RNPlugin } from '@remnote/plugin-sdk';
import {
  type DayState,
  freshDayState,
  xpFromCardReview,
  reviewOutcome,
  bossDamageFrom,
  countsAsDone,
  cardIdFromPayload,
  updateStreak,
  canAwardEditingXp,
  clampXp,
  XP_FIRST_WIN_BONUS,
  XP_EDITING_BLOCK,
  EDITING_XP_DAILY_CAP,
} from './gamification';
import { type FxInput, pushFx } from './fx';
import { MISSION_REWARD, MISSIONS_PER_DAY, missionReward, missionsForDay } from './missions';
import { levelFromXp, levelProgress } from './levels';
import { refreshExams } from './read_exams';
import { measureBoss, applyBossDamage } from './boss';
import { dayBeforeKey, todayKey, yesterdayKey } from './dates';
import {
  readDay,
  readFx,
  readLang,
  readHistory,
  readWallet,
  writeHistory,
  writeWallet,
  readStreak,
  readTotals,
  writeDay,
  writeFx,
  writeStreak,
  writeTotals,
} from './storage';
import { newlyEarned, type Totals } from './feats';
import { withDay } from './history';
import { COINS_PER_BOSS, COINS_PER_FEAT, earn, missionCoins } from './wallet';
import { itemById, itemNameKey } from './shop';
import { recapBody, recapFor } from './recap';
import { Notifier } from './notifier';
import { translator } from './i18n/index';

/** Ogni quanto rileggere le date d'esame */
const EXAM_REFRESH_MS = 30 * 60 * 1000;

/** Missioni completate da uno stato all'altro, fra quelle di oggi */
function newlyCompleted(before: DayState, after: DayState) {
  return missionsForDay(after.dayKey).filter(
    (m) => m.progress(before) < m.target && m.progress(after) >= m.target
  );
}

export interface Engine {
  /** Spegne il motore e stacca i suoi ascoltatori */
  stop: () => void;
  /** Rilegge le date d'esame subito, senza aspettare l'intervallo */
  refreshExams: () => Promise<void>;
}

export function startEngine(plugin: RNPlugin): Engine {
  const notifier = new Notifier(plugin);
  let lastEditingXpAt = 0;

  // Gli eventi possono arrivare a raffica: serializzo le modifiche, altrimenti
  // due letture concorrenti dello stesso stato si sovrascriverebbero a vicenda.
  let queue: Promise<unknown> = Promise.resolve();
  const serialize = <T>(task: () => Promise<T>): Promise<T> => {
    const next = queue.then(task, task);
    queue = next.catch(() => undefined);
    return next;
  };

  /** Legge lo stato del giorno, azzerandolo se e' passata la mezzanotte */
  const currentDay = async (): Promise<DayState> => {
    const today = todayKey();
    const day = await readDay(plugin, today);
    return day.dayKey === today ? day : freshDayState(today);
  };

  /**
   * Scrive l'effetto senza passare dalla coda.
   *
   * Va usata solo da dentro un compito gia' serializzato: aspettare `emit` da
   * li' bloccherebbe tutto, perche' il nuovo compito verrebbe accodato dietro
   * a quello che lo sta aspettando.
   */
  const emitNow = async (input: FxInput) => {
    const next = pushFx(await readFx(plugin), input, Date.now());
    await writeFx(plugin, next);
    return next;
  };

  /**
   * Manda un effetto all'HUD della coda. E' l'unico ponte verso quel widget:
   * gira in un altro iframe e non si puo' chiamare direttamente.
   */
  const emit = (input: FxInput) => serialize(() => emitNow(input));

  /**
   * Aggiorna i totali di sempre e annuncia le imprese appena meritate.
   *
   * Da chiamare solo dentro un compito gia' serializzato: legge e riscrive,
   * quindi due esecuzioni in parallelo si perderebbero un pezzo per strada.
   */
  const bumpTotals = async (change: (t: Totals) => Totals): Promise<void> => {
    const before = await readTotals(plugin);
    const after = change(before);
    await writeTotals(plugin, after);
    const meritate = newlyEarned(before, after);
    await payCoins(meritate.length * COINS_PER_FEAT);
    // La lingua si rilegge a ogni annuncio: cambiarla deve valere subito, e
    // questi eventi sono rari — un giro in piu' nello storage non pesa.
    const t = translator(await readLang(plugin));
    for (const feat of meritate) {
      await emitNow({ kind: 'feat', label: t(feat.key, { n: feat.target }) });
      notifier.now();
    }
  };

  /**
   * Accredita monete. Da chiamare dentro un compito gia' serializzato: legge e
   * riscrive, e due esecuzioni in parallelo si perderebbero un accredito.
   */
  const payCoins = async (amount: number): Promise<void> => {
    if (amount <= 0) return;
    await writeWallet(plugin, earn(await readWallet(plugin), amount));
  };

  /** Applica una modifica al giorno e segnala livelli e missioni */
  const awardXp = (mutate: (day: DayState) => { day: DayState; gained: number }) =>
    serialize(async () => {
      const before = await currentDay();
      const base = mutate(before);

      // Le missioni cadute con questa mossa pagano subito, nella stessa
      // scrittura: un secondo giro dalla coda per aggiungere gli XP darebbe
      // alla UI un istante in cui la missione e' completa ma il premio non e'
      // ancora arrivato.
      const completed = newlyCompleted(before, base.day);
      const doneToday = missionsForDay(base.day.dayKey).filter(
        (m) => m.progress(base.day) >= m.target
      ).length;
      const bonus = missionReward(completed.length, doneToday);
      await payCoins(missionCoins(completed.length, doneToday, MISSIONS_PER_DAY));

      const day =
        bonus > 0 ? { ...base.day, totalXp: base.day.totalXp + bonus } : base.day;
      const gained = base.gained + bonus;
      await writeDay(plugin, day);

      if (gained > 0) {
        const streak = await readStreak(plugin);
        const levelBefore = levelFromXp(streak.lifetimeXp);
        const lifetimeXp = streak.lifetimeXp + gained;
        await writeStreak(plugin, { ...streak, lifetimeXp });

        const levelAfter = levelFromXp(lifetimeXp);
        if (levelAfter > levelBefore) {
          // Prima l'evento, poi l'avviso: il widget legge l'ultimo evento
          // scritto, quindi deve trovarcelo gia'.
          await emitNow({
            kind: 'levelup',
            amount: levelAfter,
            label: levelProgress(lifetimeXp).title,
          });
          notifier.now();
        }
      }

      const t = translator(await readLang(plugin));
      for (const mission of completed) {
        await emitNow({
          kind: 'mission',
          label: t(mission.key, { n: mission.target }),
          amount: MISSION_REWARD,
        });
        notifier.now();
      }
      return { day, gained };
    });

  // --- Card completata: XP di ripasso, danno al boss, bonus, streak ---
  const onCompleteCard = (payload: unknown) => {
    const outcome = reviewOutcome(payload);
    // Il caso sta qui e non dentro le regole: quelle restano funzioni pure e
    // verificabili, il tiro di dado lo fa chi le chiama.
    const { damage, critical } = bossDamageFrom(outcome, Math.random());
    const done = countsAsDone(outcome);

    void awardXp((day) => {
      const cardId = cardIdFromPayload(payload);
      // Una card dimenticata non e' una prima vittoria: tornera' in coda e
      // l'occasione di vincerla e' ancora davanti.
      const isFirstWin = done && cardId != null && !day.firstWinIds.includes(cardId);
      const gained = xpFromCardReview(payload) + (isFirstWin ? XP_FIRST_WIN_BONUS : 0);

      return {
        gained,
        day: {
          ...day,
          totalXp: day.totalXp + gained,
          // Chi dimentica non ha finito la card: torna in coda e non conta
          // ne' per il boss ne' per le missioni.
          cardsDone: day.cardsDone + (done ? 1 : 0),
          bossDamage: day.bossDamage + damage,
          crits: day.crits + (critical ? 1 : 0),
          easyCards: day.easyCards + (outcome === 'easy' ? 1 : 0),
          firstWinIds: isFirstWin ? [...day.firstWinIds, cardId] : day.firstWinIds,
        },
      };
    })
      // Solo le card colpiscono il boss: gli XP degli appunti non lo toccano,
      // per questo il colpo parte da qui e non da dentro awardXp.
      .then(({ gained }) =>
        serialize(async () => {
          // "Forgot" e le interazioni che non sono risposte: il boss non
          // incassa niente e la serie di colpi si spezza.
          const fx =
            damage <= 0
              ? await emitNow({ kind: 'miss' })
              : await emitNow({ kind: critical ? 'crit' : 'hit', amount: gained, damage });

          // La serie piu' lunga si sa solo dopo aver scritto il colpo: e' la
          // combo a contarla, e vive nel canale degli effetti.
          const day = await currentDay();
          if (fx.combo > day.bestCombo) await writeDay(plugin, { ...day, bestCombo: fx.combo });

          await bumpTotals((t) => ({
            ...t,
            cards: t.cards + (done ? 1 : 0),
            bestCombo: Math.max(t.bestCombo, fx.combo),
          }));
        })
      );

    void serialize(async () => {
      // La streak avanza alla prima card del giorno
      const streak = await readStreak(plugin);
      const updated = updateStreak(streak, todayKey(), yesterdayKey(), dayBeforeKey());
      if (updated === streak) return;
      await writeStreak(plugin, updated);
      // Se un gettone e' stato speso va detto: una serie che continua dopo un
      // giorno saltato, senza spiegazione, sembra un errore di conteggio.
      const salvata = updated.tokens < streak.tokens;
      const t = translator(await readLang(plugin));
      await emitNow({
        kind: 'streak',
        amount: updated.currentStreak,
        label: salvata ? t('toast.tokenSpent') : undefined,
      });
      notifier.now();
      await bumpTotals((t) => ({ ...t, bestStreak: Math.max(t.bestStreak, updated.bestStreak) }));
    });

    if (damage > 0) void damageBoss();
  };

  // --- Editing: un blocco di XP ogni 5 minuti di attivita', con tetto ---
  const onEdit = () => {
    const now = Date.now();
    if (!canAwardEditingXp(lastEditingXpAt, now)) return;
    lastEditingXpAt = now;

    void awardXp((day) => {
      const gained = clampXp(XP_EDITING_BLOCK, day.editingXpToday, EDITING_XP_DAILY_CAP);
      return {
        gained,
        day: {
          ...day,
          totalXp: day.totalXp + gained,
          editingXpToday: day.editingXpToday + gained,
        },
      };
    });
  };

  const bossDeps = { plugin, currentDay, notifier, emit: emitNow, bumpTotals, payCoins };
  /**
   * Misura il boss su quello che dice la coda.
   *
   * Ad ogni card caricata e non solo alla prima: all'ingresso in coda RemNote
   * non sa ancora quante ne ha, e la somma «fatte + rimaste» non si muove
   * durante la sessione, quindi rifarla non costa ne' cambia niente.
   */
  const planBoss = () => serialize(() => measureBoss(bossDeps));
  /** Solo il danno delle card fatte: leggero, si fa ad ogni card */
  const damageBoss = () => serialize(() => applyBossDamage(bossDeps));

  /**
   * Fissa la giornata nello storico.
   *
   * Non a ogni card: sarebbe una scrittura sincronizzata ogni pochi secondi
   * per un dato che interessa solo a consuntivo. Basta a fine sessione e a
   * intervalli, cosi' la riga di oggi resta comunque aggiornata.
   */
  const recordHistory = () =>
    serialize(async () => {
      const day = await currentDay();
      if (day.cardsDone === 0 && day.totalXp === 0) return;
      const history = await readHistory(plugin);
      await writeHistory(plugin, withDay(history, day));
    });

  /**
   * Il riepilogo di chiusura.
   *
   * Le card gia' raccontate stanno in memoria e non nello storage: entrare e
   * uscire dalla coda tre volte di fila deve dare un annuncio, non tre, ma un
   * riepilogo perso al riavvio del plugin non manca a nessuno.
   *
   * Il giorno fa parte del segno: a mezzanotte le card ripartono da zero, e
   * senza confrontare la data il primo riepilogo del giorno nuovo non
   * arriverebbe mai.
   */
  let recapShown = { day: '', cards: 0 };

  const announceRecap = () =>
    serialize(async () => {
      const day = await currentDay();
      const gia = recapShown.day === day.dayKey ? recapShown.cards : 0;
      const recap = recapFor(day, gia);
      if (!recap) return;
      recapShown = { day: day.dayKey, cards: recap.cards };

      const t = translator(await readLang(plugin));
      const wallet = await readWallet(plugin);
      // Un identificativo che non e' in catalogo non ha un nome da mostrare:
      // senza questo controllo comparirebbe la chiave del dizionario.
      const petName = itemById(wallet.companion) ? t(itemNameKey(wallet.companion)) : '';

      await emitNow({
        kind: 'recap',
        amount: recap.cards,
        label: recapBody(t, recap, petName),
      });
      notifier.now();
    });

  const onQueueExit = () => {
    void recordHistory();
    void refreshExams(plugin);
    void announceRecap();
  };

  plugin.event.addListener(AppEvents.QueueCompleteCard, undefined, onCompleteCard);
  plugin.event.addListener(AppEvents.EditorTextEdited, undefined, onEdit);
  plugin.event.addListener(AppEvents.QueueExit, undefined, onQueueExit);
  plugin.event.addListener(AppEvents.QueueLoadCard, undefined, planBoss);

  void refreshExams(plugin);
  // Il conto alla rovescia degli esami va rifatto almeno quando scatta la
  // mezzanotte con l'app aperta. Il boss no: lo misura la coda.
  const timer = setInterval(() => {
    void recordHistory();
    void refreshExams(plugin);
  }, EXAM_REFRESH_MS);

  return {
    refreshExams: async () => void (await refreshExams(plugin)),
    stop: () => {
      clearInterval(timer);
      plugin.event.removeListener(AppEvents.QueueCompleteCard, undefined, onCompleteCard);
      plugin.event.removeListener(AppEvents.EditorTextEdited, undefined, onEdit);
      plugin.event.removeListener(AppEvents.QueueExit, undefined, onQueueExit);
      plugin.event.removeListener(AppEvents.QueueLoadCard, undefined, planBoss);
    },
  };
}
