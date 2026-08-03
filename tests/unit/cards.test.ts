import test from 'node:test';
import assert from 'node:assert/strict';
import { countCards } from '../../src/lib/cards';

const NOW = 1_800_000_000_000;
const HOUR = 3_600_000;

test('countCards', async (t) => {
  await t.test('scadute e mai studiate restano separate', () => {
    const cards = [
      { nextRepetitionTime: NOW - HOUR }, // scaduta
      { nextRepetitionTime: NOW }, // scade proprio ora
      { nextRepetitionTime: NOW + HOUR }, // programmata avanti
      {}, // mai studiata
      { nextRepetitionTime: null }, // campo assente: mai studiata
    ];
    assert.deepEqual(countCards(cards, NOW), { due: 2, neverStudied: 2 });
  });

  await t.test('le mai studiate non gonfiano le dovute', () => {
    // Il caso reale: 3000 card nuove non sono 3000 ripassi da fare oggi
    const fresh = Array.from({ length: 3000 }, () => ({}));
    const due = Array.from({ length: 123 }, () => ({ nextRepetitionTime: NOW - HOUR }));
    assert.deepEqual(countCards([...fresh, ...due], NOW), { due: 123, neverStudied: 3000 });
  });

  await t.test('lista vuota', () => {
    assert.deepEqual(countCards([], NOW), { due: 0, neverStudied: 0 });
  });

  await t.test('elementi non validi vengono ignorati del tutto', () => {
    assert.deepEqual(countCards([null, undefined, 5, 'x'], NOW), { due: 0, neverStudied: 0 });
  });
});
