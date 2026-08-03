import test from 'node:test';
import assert from 'node:assert/strict';
import { translator } from '../../src/lib/i18n/index';

/** Le frasi in italiano: i test guardano il testo, non la chiave */
const tr = translator('it');
import { companionMood, moodLabel } from '../../src/lib/mood';
import { freshDayState } from '../../src/lib/gamification';

const giorno = (cards: number, cleared = 0) => ({
  ...freshDayState('2026-08-02'),
  cardsDone: cards,
  queueCleared: cleared,
});

test('companionMood', async (t) => {
  await t.test('prima della prima card sonnecchia', () => {
    assert.equal(companionMood(giorno(0)), 'asleep');
  });

  await t.test('alla prima card si sveglia', () => {
    assert.equal(companionMood(giorno(1)), 'idle');
  });

  await t.test('con il boss abbattuto festeggia, anche con poche card', () => {
    assert.equal(companionMood(giorno(3, 1)), 'happy');
  });

  await t.test('una giornata piena basta da sola', () => {
    assert.equal(companionMood(giorno(30)), 'happy');
  });

  await t.test('non esiste uno stato peggiore di "dorme"', () => {
    // Il compagno non deve mai poter stare male: nessuna giornata, per quanto
    // vuota, produce qualcosa di piu' triste del sonno.
    const stati = new Set([0, 1, 5, 29, 30, 200].map((n) => companionMood(giorno(n))));
    for (const stato of stati) {
      assert.ok(['asleep', 'idle', 'happy'].includes(stato));
    }
  });
});

test('moodLabel', async (t) => {
  await t.test('senza storia dice solo come sta', () => {
    assert.ok(moodLabel(tr, 'idle', 0, 0).length > 0);
    assert.ok(!moodLabel(tr, 'idle', 0, 0).includes('giorni'));
  });

  await t.test('con la storia la racconta', () => {
    const testo = moodLabel(tr, 'happy', 23, 4);
    assert.ok(testo.includes('23 giorni'));
    assert.ok(testo.includes('4 boss'));
  });

  await t.test('i tre stati dicono cose diverse', () => {
    const testi = new Set([
      moodLabel(tr, 'asleep', 5, 1),
      moodLabel(tr, 'idle', 5, 1),
      moodLabel(tr, 'happy', 5, 1),
    ]);
    assert.equal(testi.size, 3);
  });
});
