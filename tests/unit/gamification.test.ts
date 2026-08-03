import test from 'node:test';
import assert from 'node:assert/strict';
import {
  xpFromCardReview,
  cardIdFromPayload,
  updateStreak,
  bossDamagePercent,
  canAwardEditingXp,
  clampXp,
  freshDayState,
  freshStreakState,
  MAX_STREAK_TOKENS,
  XP_BY_OUTCOME,
  XP_REVIEW_FALLBACK,
  DAMAGE_BY_OUTCOME,
  CRIT_MULTIPLIER,
  outcomeFromScore,
  reviewOutcome,
  bossDamageFrom,
  countsAsDone,
  EDITING_BLOCK_MS,
} from '../../src/lib/gamification';

/*
 * I valori di QueueInteractionScore, che l'SDK dichiara frazionari:
 * AGAIN 0, TOO_EARLY 0.01, HARD 0.5, GOOD 1, EASY 1.5, LEECH 2, RESET 3.
 */
const AGAIN = 0;
const TOO_EARLY = 0.01;
const HARD = 0.5;
const GOOD = 1;
const EASY = 1.5;
const LEECH = 2;

test('outcomeFromScore', async (t) => {
  await t.test('riconosce i quattro pulsanti della coda', () => {
    assert.equal(outcomeFromScore(AGAIN), 'forgot');
    assert.equal(outcomeFromScore(HARD), 'partial');
    assert.equal(outcomeFromScore(GOOD), 'effort');
    assert.equal(outcomeFromScore(EASY), 'easy');
  });

  await t.test('una card vista troppo presto non e\' una risposta', () => {
    assert.equal(outcomeFromScore(TOO_EARLY), 'forgot');
  });

  await t.test('leech, reset e date manuali non sono ripetizioni', () => {
    assert.equal(outcomeFromScore(LEECH), 'other');
    assert.equal(outcomeFromScore(3), 'other');
    assert.equal(outcomeFromScore(5), 'other');
  });

  await t.test('senza punteggio non c\'e\' esito da dedurre', () => {
    for (const value of [undefined, null, 'facile', Number.NaN, {}]) {
      assert.equal(outcomeFromScore(value), null);
    }
  });
});

test('xpFromCardReview', async (t) => {
  await t.test('gli XP salgono con quanto sai la card', () => {
    assert.equal(xpFromCardReview({ score: HARD }), XP_BY_OUTCOME.partial);
    assert.equal(xpFromCardReview({ score: GOOD }), XP_BY_OUTCOME.effort);
    assert.equal(xpFromCardReview({ score: EASY }), XP_BY_OUTCOME.easy);
    assert.ok(
      XP_BY_OUTCOME.partial < XP_BY_OUTCOME.effort && XP_BY_OUTCOME.effort < XP_BY_OUTCOME.easy,
      'la scala deve premiare la padronanza, altrimenti conviene mentire'
    );
  });

  await t.test('una card dimenticata non vale niente', () => {
    assert.equal(xpFromCardReview({ score: AGAIN }), 0);
    assert.equal(xpFromCardReview({ score: TOO_EARLY }), 0);
    assert.equal(xpFromCardReview({ score: LEECH }), 0);
  });

  await t.test('usa rating se score manca', () => {
    assert.equal(xpFromCardReview({ rating: EASY }), XP_BY_OUTCOME.easy);
  });

  await t.test('fallback su payload inutilizzabile', () => {
    for (const payload of [undefined, null, 42, 'x', {}, { score: 'alto' }]) {
      assert.equal(xpFromCardReview(payload), XP_REVIEW_FALLBACK);
    }
  });
});

test('bossDamageFrom', async (t) => {
  // roll >= CRIT_CHANCE non e' critico, roll piccolo lo e' sempre
  const NORMALE = 0.99;
  const CRITICO = 0;

  await t.test('il danno cresce con la qualita\' della risposta', () => {
    assert.equal(bossDamageFrom('partial', NORMALE).damage, DAMAGE_BY_OUTCOME.partial);
    assert.equal(bossDamageFrom('effort', NORMALE).damage, DAMAGE_BY_OUTCOME.effort);
    assert.equal(bossDamageFrom('easy', NORMALE).damage, DAMAGE_BY_OUTCOME.easy);
  });

  await t.test('chi dimentica non fa danno, nemmeno con un critico', () => {
    assert.deepEqual(bossDamageFrom('forgot', CRITICO), { damage: 0, critical: false });
    assert.deepEqual(bossDamageFrom('other', CRITICO), { damage: 0, critical: false });
  });

  await t.test('il critico raddoppia', () => {
    const colpo = bossDamageFrom('easy', CRITICO);
    assert.equal(colpo.critical, true);
    assert.equal(colpo.damage, DAMAGE_BY_OUTCOME.easy * CRIT_MULTIPLIER);
  });

  await t.test('senza esito vale una risposta media', () => {
    assert.equal(bossDamageFrom(null, NORMALE).damage, DAMAGE_BY_OUTCOME.effort);
  });
});

test('countsAsDone', async (t) => {
  await t.test('la card dimenticata torna in coda, quindi non e\' fatta', () => {
    assert.equal(countsAsDone('forgot'), false);
    assert.equal(countsAsDone('other'), false);
  });

  await t.test('le tre risposte riuscite contano', () => {
    assert.equal(countsAsDone('partial'), true);
    assert.equal(countsAsDone('effort'), true);
    assert.equal(countsAsDone('easy'), true);
  });

  await t.test('un payload illeggibile si conta: meglio di perdere la card', () => {
    assert.equal(countsAsDone(null), true);
  });
});

test('reviewOutcome', async (t) => {
  await t.test('legge il punteggio dal payload dell\'evento', () => {
    assert.equal(reviewOutcome({ score: EASY }), 'easy');
    assert.equal(reviewOutcome({ rating: AGAIN }), 'forgot');
  });

  await t.test('un payload che non e\' un oggetto non ha esito', () => {
    for (const payload of [undefined, null, 7, 'boh']) {
      assert.equal(reviewOutcome(payload), null);
    }
  });
});

test('cardIdFromPayload', async (t) => {
  await t.test('preferisce cardId, poi remId, poi _id', () => {
    assert.equal(cardIdFromPayload({ cardId: 'a', remId: 'b', _id: 'c' }), 'a');
    assert.equal(cardIdFromPayload({ remId: 'b', _id: 'c' }), 'b');
    assert.equal(cardIdFromPayload({ _id: 'c' }), 'c');
  });

  await t.test('null se nessun id valido', () => {
    assert.equal(cardIdFromPayload({ cardId: 7 }), null);
    assert.equal(cardIdFromPayload(null), null);
  });
});

test('updateStreak', async (t) => {
  const s = (lastActiveDay: string, currentStreak: number, bestStreak = currentStreak) => ({
    ...freshStreakState(),
    lastActiveDay,
    currentStreak,
    bestStreak,
  });

  await t.test("gia' attivo oggi: invariato", () => {
    const cur = s('2026-08-01', 4);
    assert.equal(updateStreak(cur, '2026-08-01', '2026-07-31'), cur);
  });

  await t.test('attivo ieri: incrementa', () => {
    const next = updateStreak(s('2026-07-31', 4), '2026-08-01', '2026-07-31');
    assert.equal(next.lastActiveDay, '2026-08-01');
    assert.equal(next.currentStreak, 5);
  });

  await t.test('buco o primo giorno: riparte da 1', () => {
    assert.equal(updateStreak(s('2026-07-20', 9), '2026-08-01', '2026-07-31').currentStreak, 1);
    assert.equal(
      updateStreak(freshStreakState(), '2026-08-01', '2026-07-31').currentStreak,
      1
    );
  });

  await t.test('il record sale con la streak e non scende mai', () => {
    const grown = updateStreak(s('2026-07-31', 4), '2026-08-01', '2026-07-31');
    assert.equal(grown.bestStreak, 5);
    // streak spezzata: current riparte da 1 ma il record resta
    const broken = updateStreak(s('2026-07-20', 9), '2026-08-01', '2026-07-31');
    assert.equal(broken.currentStreak, 1);
    assert.equal(broken.bestStreak, 9);
  });

  await t.test('gli XP di sempre non vengono toccati', () => {
    const withXp = { ...s('2026-07-31', 2), lifetimeXp: 1234 };
    assert.equal(updateStreak(withXp, '2026-08-01', '2026-07-31').lifetimeXp, 1234);
  });
});

test('bossDamagePercent', async (t) => {
  await t.test('percentuale normale', () => {
    assert.equal(bossDamagePercent(100, 25), 75);
    assert.equal(bossDamagePercent(40, 40), 0);
    assert.equal(bossDamagePercent(40, 0), 100);
  });

  await t.test('maxHp non positivo: 0, niente divisione per zero', () => {
    assert.equal(bossDamagePercent(0, 10), 0);
    assert.equal(bossDamagePercent(-5, 10), 0);
  });

  await t.test('clamp 0-100 se rimanenti > max (card aggiunte durante il giorno)', () => {
    assert.equal(bossDamagePercent(10, 30), 0);
  });
});

test('canAwardEditingXp', async (t) => {
  await t.test('serve un blocco intero di 5 minuti', () => {
    assert.equal(canAwardEditingXp(1000, 1000 + EDITING_BLOCK_MS - 1), false);
    assert.equal(canAwardEditingXp(1000, 1000 + EDITING_BLOCK_MS), true);
  });

  await t.test('primo edit della sessione premiato subito', () => {
    assert.equal(canAwardEditingXp(0, Date.now()), true);
  });
});

test('clampXp', async (t) => {
  await t.test('taglia al tetto giornaliero', () => {
    assert.equal(clampXp(10, 55, 60), 5);
    assert.equal(clampXp(10, 60, 60), 0);
    assert.equal(clampXp(10, 99, 60), 0);
    assert.equal(clampXp(10, 0, 60), 10);
  });
});

test('freshDayState', async (t) => {
  await t.test('parte da zero sul giorno richiesto', () => {
    const s = freshDayState('2026-08-01');
    assert.equal(s.dayKey, '2026-08-01');
    assert.equal(s.totalXp, 0);
    assert.equal(s.cardsDone, 0);
    assert.equal(s.queueCleared, 0);
    assert.equal(s.editingXpToday, 0);
    assert.deepEqual(s.firstWinIds, []);
  });
});

test('protezione della serie', async (t) => {
  const con = (giorni: number, gettoni: number, ultimo: string) => ({
    ...freshStreakState(),
    lastActiveDay: ultimo,
    currentStreak: giorni,
    bestStreak: giorni,
    tokens: gettoni,
  });

  await t.test('un gettone salva una giornata saltata', () => {
    // Ultimo giorno attivo l'altroieri: ne e' stato saltato uno solo
    const next = updateStreak(con(40, 1, '2026-07-30'), '2026-08-01', '2026-07-31', '2026-07-30');
    assert.equal(next.currentStreak, 41, 'la serie continua invece di ripartire');
    assert.equal(next.tokens, 0, 'e il gettone si consuma');
  });

  await t.test('senza gettoni la serie riparte da uno', () => {
    const next = updateStreak(con(40, 0, '2026-07-30'), '2026-08-01', '2026-07-31', '2026-07-30');
    assert.equal(next.currentStreak, 1);
    assert.equal(next.tokens, 0);
  });

  await t.test('due giorni saltati non si salvano con un gettone solo', () => {
    // Ultimo giorno attivo ancora prima dell'altroieri
    const next = updateStreak(con(40, 3, '2026-07-20'), '2026-08-01', '2026-07-31', '2026-07-30');
    assert.equal(next.currentStreak, 1, 'un buco lungo azzera comunque');
    assert.equal(next.tokens, 3, 'e i gettoni restano dove sono');
  });

  await t.test('un gettone si guadagna ogni sette giorni di fila', () => {
    const next = updateStreak(con(6, 0, '2026-07-31'), '2026-08-01', '2026-07-31', '2026-07-30');
    assert.equal(next.currentStreak, 7);
    assert.equal(next.tokens, 1, 'il settimo giorno frutta un gettone');
  });

  await t.test('i gettoni non si accumulano oltre il tetto', () => {
    const next = updateStreak(con(13, MAX_STREAK_TOKENS, '2026-07-31'), '2026-08-01', '2026-07-31', '2026-07-30');
    assert.equal(next.tokens, MAX_STREAK_TOKENS);
  });

  await t.test('giornata gia' + "'" + ' contata: niente gettoni doppi', () => {
    const cur = con(7, 1, '2026-08-01');
    assert.equal(updateStreak(cur, '2026-08-01', '2026-07-31', '2026-07-30'), cur);
  });
});
