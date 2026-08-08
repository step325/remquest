import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeDayState, normalizeStreakState } from '../../src/lib/state';
import { freshDayState, freshStreakState } from '../../src/lib/gamification';
import { normalizeBossState, freshBossState } from '../../src/lib/storage';

const TODAY = '2026-08-01';

test('normalizeDayState', async (t) => {
  await t.test('preserva uno stato valido', () => {
    const valid = { ...freshDayState('2026-07-30'), totalXp: 120, firstWinIds: ['a', 'b'] };
    assert.deepEqual(normalizeDayState(valid, TODAY), valid);
  });

  await t.test('valori non-oggetto tornano allo stato fresco', () => {
    for (const bad of [undefined, null, 42, 'stato', true]) {
      assert.deepEqual(normalizeDayState(bad, TODAY), freshDayState(TODAY));
    }
  });

  await t.test('firstWinIds non-array non arriva mai al render (crash .includes)', () => {
    assert.deepEqual(normalizeDayState({ firstWinIds: null }, TODAY).firstWinIds, []);
    assert.deepEqual(normalizeDayState({ firstWinIds: 'a,b' }, TODAY).firstWinIds, []);
  });

  await t.test('scarta gli elementi non stringa dentro firstWinIds', () => {
    const out = normalizeDayState({ firstWinIds: ['a', 3, null, 'b'] }, TODAY);
    assert.deepEqual(out.firstWinIds, ['a', 'b']);
  });

  await t.test('campi numerici corrotti tornano al default', () => {
    const out = normalizeDayState(
      { totalXp: 'molti', cardsDone: NaN, editingXpToday: Infinity, queueCleared: null },
      TODAY
    );
    assert.equal(out.totalXp, 0);
    assert.equal(out.cardsDone, 0);
    assert.equal(out.editingXpToday, 0);
    assert.equal(out.queueCleared, 0);
  });

  await t.test('stato parziale (versione vecchia del plugin) completato coi default', () => {
    const out = normalizeDayState({ dayKey: '2026-07-31', totalXp: 40 }, TODAY);
    assert.equal(out.dayKey, '2026-07-31');
    assert.equal(out.totalXp, 40);
    assert.equal(out.editingXpToday, 0);
    assert.deepEqual(out.firstWinIds, []);
  });

  await t.test('dayKey non stringa usa il giorno passato come fallback', () => {
    assert.equal(normalizeDayState({ dayKey: 20260801 }, TODAY).dayKey, TODAY);
  });
});

test('normalizeStreakState', async (t) => {
  await t.test('preserva uno stato valido', () => {
    const valid = {
      lastActiveDay: '2026-07-31',
      currentStreak: 7,
      bestStreak: 12,
      lifetimeXp: 3400,
      tokens: 2,
    };
    assert.deepEqual(normalizeStreakState(valid), valid);
  });

  await t.test('uno stato scritto prima dei gettoni ne riceve zero', () => {
    const vecchio = {
      lastActiveDay: '2026-07-31',
      currentStreak: 7,
      bestStreak: 12,
      lifetimeXp: 3400,
    };
    assert.equal(normalizeStreakState(vecchio).tokens, 0);
  });

  await t.test('currentStreak corrotto non finisce nel render', () => {
    assert.equal(normalizeStreakState({ currentStreak: 'sette' }).currentStreak, 0);
    assert.equal(normalizeStreakState({ currentStreak: NaN }).currentStreak, 0);
  });

  await t.test('stato pre-livelli: lifetimeXp e bestStreak arrivano a zero, non undefined', () => {
    const legacy = normalizeStreakState({ lastActiveDay: '2026-07-31', currentStreak: 3 });
    assert.equal(legacy.lifetimeXp, 0);
    // il record non puo' essere sotto la streak gia' in corso
    assert.equal(legacy.bestStreak, 3);
  });

  await t.test('bestStreak incoerente viene alzato alla streak corrente', () => {
    assert.equal(normalizeStreakState({ currentStreak: 9, bestStreak: 2 }).bestStreak, 9);
  });

  await t.test('valori non-oggetto tornano allo stato fresco', () => {
    for (const bad of [undefined, null, 'x', 5]) {
      assert.deepEqual(normalizeStreakState(bad), freshStreakState());
    }
  });
});

test('normalizeBossState', async (t) => {
  const saved = (extra: Record<string, unknown>) => ({ ...freshBossState(TODAY), ...extra });

  await t.test("l'arretrato viene conservato accanto agli HP", () => {
    assert.equal(normalizeBossState(saved({ queueRead: 702 }), TODAY).queueRead, 702);
    assert.equal(normalizeBossState(saved({ queueRead: 'tante' }), TODAY).queueRead, 0);
  });

  await t.test('conserva il conteggio di oggi', () => {
    const boss = saved({ remaining: 42, maxHp: 60 });
    assert.deepEqual(normalizeBossState(boss, TODAY), boss);
  });

  await t.test('il boss di ieri non passa a oggi', () => {
    const yesterday = saved({ dayKey: '2026-07-31', remaining: 12, maxHp: 90 });
    assert.deepEqual(normalizeBossState(yesterday, TODAY), freshBossState(TODAY));
  });

  await t.test('stato senza dayKey: viene da una versione vecchia, si butta', () => {
    assert.deepEqual(normalizeBossState({ remaining: 3003, maxHp: 3003 }, TODAY), freshBossState(TODAY));
  });

  await t.test('formato precedente: si butta anche se il giorno e\' quello giusto', () => {
    // Il caso reale: 3442 HP salvati oggi da un conteggio con regole diverse
    const oldFormat = { format: 2, dayKey: TODAY, remaining: 0, maxHp: 3442 };
    assert.deepEqual(normalizeBossState(oldFormat, TODAY), freshBossState(TODAY));
  });

  await t.test('valori non-oggetto o corrotti tornano allo stato fresco', () => {
    for (const bad of [undefined, null, 'boss', 7]) {
      assert.deepEqual(normalizeBossState(bad, TODAY), freshBossState(TODAY));
    }
    const corrupt = normalizeBossState(saved({ remaining: NaN, maxHp: 'tanti' }), TODAY);
    assert.equal(corrupt.remaining, null);
    assert.equal(corrupt.maxHp, 0);
  });
});
