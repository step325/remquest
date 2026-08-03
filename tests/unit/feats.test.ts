import test from 'node:test';
import assert from 'node:assert/strict';
import {
  FEATS,
  earnedFeats,
  freshTotals,
  newlyEarned,
  normalizeTotals,
} from '../../src/lib/feats';
import { TOTAL_MONSTERS } from '../../src/lib/bestiary';

test('FEATS', async (t) => {
  await t.test('gli identificativi sono unici', () => {
    const ids = FEATS.map((f) => f.id);
    assert.equal(new Set(ids).size, ids.length);
  });

  await t.test('nessuna impresa e\' gia\' meritata appena si comincia', () => {
    assert.deepEqual(earnedFeats(freshTotals()), []);
  });

  await t.test('il bestiario completo chiede tutti i mostri che esistono', () => {
    const completo = FEATS.find((f) => f.id === 'bestiary_all');
    assert.ok(completo);
    assert.equal(
      completo.target,
      TOTAL_MONSTERS,
      'il traguardo deve seguire la misura vera del bestiario'
    );
  });
});

test('earnedFeats', async (t) => {
  await t.test('scattano al raggiungimento esatto', () => {
    const ids = earnedFeats({ ...freshTotals(), cards: 100 }).map((f) => f.id);
    assert.ok(ids.includes('cards_100'));
    assert.ok(!ids.includes('cards_1000'));
  });

  await t.test('i traguardi piu' + '\'' + ' bassi restano presi', () => {
    const ids = earnedFeats({ ...freshTotals(), bosses: 50 }).map((f) => f.id);
    assert.ok(ids.includes('boss_1'));
    assert.ok(ids.includes('boss_10'));
    assert.ok(ids.includes('boss_50'));
  });
});

test('newlyEarned', async (t) => {
  await t.test('riporta solo quelle cadute adesso', () => {
    const prima = { ...freshTotals(), cards: 99 };
    const dopo = { ...freshTotals(), cards: 100 };
    assert.deepEqual(
      newlyEarned(prima, dopo).map((f) => f.id),
      ['cards_100']
    );
  });

  await t.test('senza passi avanti non scatta niente', () => {
    const totals = { ...freshTotals(), cards: 500 };
    assert.deepEqual(newlyEarned(totals, totals), []);
  });

  await t.test('un balzo grosso ne fa cadere piu\' di una insieme', () => {
    const ids = newlyEarned(freshTotals(), { ...freshTotals(), bosses: 10 }).map((f) => f.id);
    assert.deepEqual(ids, ['boss_1', 'boss_10']);
  });
});

test('normalizeTotals', async (t) => {
  await t.test('uno storage vuoto parte da zero', () => {
    for (const value of [undefined, null, 'boh', 7]) {
      assert.deepEqual(normalizeTotals(value), freshTotals());
    }
  });

  await t.test('i valori impossibili tornano a zero', () => {
    const t2 = normalizeTotals({ cards: -5, bosses: Number.NaN, bestCombo: 'tanti' });
    assert.equal(t2.cards, 0);
    assert.equal(t2.bosses, 0);
    assert.equal(t2.bestCombo, 0);
  });

  await t.test('i decimali si troncano: mezza card non esiste', () => {
    assert.equal(normalizeTotals({ cards: 12.7 }).cards, 12);
  });
});
