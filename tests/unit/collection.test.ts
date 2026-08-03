import test from 'node:test';
import assert from 'node:assert/strict';
import {
  collectionProgress,
  freshCollection,
  monsterId,
  normalizeCollection,
  withDefeated,
  withSeen,
} from '../../src/lib/collection';
import { TIER_BOSS, TIER_COMMON, TOTAL_MONSTERS } from '../../src/lib/bestiary';

const slime = { tier: TIER_COMMON, index: 0 } as const;
const drago = { tier: TIER_BOSS, index: 2 } as const;

test('monsterId', async (t) => {
  await t.test('scaglione e posizione insieme, cosi\' non si accavallano', () => {
    assert.notEqual(monsterId(slime), monsterId({ tier: TIER_BOSS, index: 0 }));
    assert.equal(monsterId(slime), monsterId({ tier: TIER_COMMON, index: 0 }));
  });
});

test('withSeen', async (t) => {
  await t.test('segna il mostro come incontrato', () => {
    const dopo = withSeen(freshCollection(), slime);
    assert.ok(dopo.seen.includes(monsterId(slime)));
  });

  await t.test('incontrarlo due volte non lo aggiunge due volte', () => {
    const uno = withSeen(freshCollection(), slime);
    const due = withSeen(uno, slime);
    assert.equal(due.seen.length, 1);
    assert.equal(due, uno, 'senza novita\' non serve riscrivere lo stato');
  });
});

test('withDefeated', async (t) => {
  await t.test('battere un mostro lo segna anche come incontrato', () => {
    const dopo = withDefeated(freshCollection(), drago);
    assert.ok(dopo.defeated.includes(monsterId(drago)));
    assert.ok(dopo.seen.includes(monsterId(drago)), 'battuto implica incontrato');
  });

  await t.test('batterlo di nuovo non cambia niente', () => {
    const uno = withDefeated(freshCollection(), drago);
    assert.equal(withDefeated(uno, drago), uno);
  });
});

test('collectionProgress', async (t) => {
  await t.test('una raccolta vuota parte da zero', () => {
    const p = collectionProgress(freshCollection());
    assert.deepEqual(p, { seen: 0, defeated: 0, total: TOTAL_MONSTERS });
  });

  await t.test('conta separatamente incontrati e battuti', () => {
    let c = freshCollection();
    c = withSeen(c, slime);
    c = withDefeated(c, drago);
    const p = collectionProgress(c);
    assert.equal(p.seen, 2, 'il battuto conta anche fra gli incontrati');
    assert.equal(p.defeated, 1);
  });
});

test('normalizeCollection', async (t) => {
  await t.test('uno storage vuoto diventa una raccolta pulita', () => {
    for (const value of [undefined, null, 'spazzatura', 42]) {
      assert.deepEqual(normalizeCollection(value), freshCollection());
    }
  });

  await t.test('scarta le voci che non sono stringhe', () => {
    const c = normalizeCollection({ seen: ['common:1', 3, null], defeated: [{}, 'boss:0'] });
    assert.deepEqual(c.seen, ['common:1']);
    assert.deepEqual(c.defeated, ['boss:0']);
  });

  await t.test('toglie i doppioni arrivati da uno storage rovinato', () => {
    const c = normalizeCollection({ seen: ['common:1', 'common:1'], defeated: [] });
    assert.equal(c.seen.length, 1);
  });
});
