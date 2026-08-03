import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MONSTER_COUNT,
  REFERENCE_LOAD,
  TIERS,
  TIER_BOSS,
  TIER_COMMON,
  TIER_UNCOMMON,
  type Tier,
  loadFactor,
  monsterForDay,
  tierOdds,
} from '../../src/lib/bestiary';

/** Le probabilita' dei tre scaglioni per una giornata da `cards` sulla media `avg` */
const odds = (cards: number, avg: number) => tierOdds(loadFactor(cards, avg));

test('loadFactor', async (t) => {
  await t.test('una giornata come le tue solite vale uno', () => {
    assert.equal(loadFactor(100, 100), 1);
  });

  await t.test('senza storico si usa un carico di riferimento', () => {
    // I primi giorni non c'e' nessuna media: senza un valore di appoggio ogni
    // giornata sembrerebbe enorme e uscirebbero solo boss.
    assert.equal(loadFactor(REFERENCE_LOAD, 0), 1);
  });

  await t.test('non esplode con numeri assurdi', () => {
    // Un arretrato di mille card non deve valere venti volte una giornata
    // normale: oltre un certo punto e' comunque "durissima".
    assert.ok(loadFactor(10_000, 50) <= 4);
    assert.ok(loadFactor(0, 50) >= 0);
  });
});

test('tierOdds', async (t) => {
  await t.test('le probabilita' + ' sommano a uno', () => {
    for (const carico of [0, 0.5, 1, 1.5, 3, 4]) {
      const p = tierOdds(carico);
      const somma = TIERS.reduce((n, tier) => n + p[tier], 0);
      assert.ok(Math.abs(somma - 1) < 1e-9, `carico ${carico} somma ${somma}`);
    }
  });

  await t.test('i boss restano rari anche nelle giornate pesanti', () => {
    // Devono restare un avvenimento: se capitano un giorno su due smettono di
    // valere qualcosa.
    assert.ok(odds(300, 100)[TIER_BOSS] <= 0.25);
  });

  await t.test('ma non sono impossibili nelle giornate leggere', () => {
    // Chi fa poche card deve poterli incontrare lo stesso, ogni tanto:
    // altrimenti sei mostri su ventisei non li vedrebbe mai.
    assert.ok(odds(10, 100)[TIER_BOSS] > 0);
  });

  await t.test('piu' + ' e\' pesante la giornata, piu' + ' sale il rischio', () => {
    const leggera = odds(30, 100)[TIER_BOSS];
    const normale = odds(100, 100)[TIER_BOSS];
    const pesante = odds(250, 100)[TIER_BOSS];
    assert.ok(leggera < normale && normale < pesante);
  });

  await t.test('le giornate leggere restano roba da creature comuni', () => {
    assert.ok(odds(20, 100)[TIER_COMMON] > 0.7);
  });
});

test('monsterForDay', async (t) => {
  await t.test('lo stesso giorno da' + ' sempre lo stesso mostro', () => {
    // Non e' un sorteggio: riaprire l'app o passare a un altro dispositivo non
    // deve cambiare l'avversario a meta' giornata.
    const uno = monsterForDay('2026-08-03', 120, 90);
    const due = monsterForDay('2026-08-03', 120, 90);
    assert.deepEqual(uno, due);
  });

  await t.test('resta dentro gli elenchi', () => {
    for (let i = 1; i <= 60; i++) {
      const m = monsterForDay(`2026-08-${String(i % 28 + 1).padStart(2, '0')}`, i * 7, 80);
      assert.ok(TIERS.includes(m.tier));
      assert.ok(m.index >= 0 && m.index < MONSTER_COUNT[m.tier]);
    }
  });

  await t.test('in un mese si incontrano tutti e tre gli scaglioni', () => {
    // E' il punto di tutto: con le soglie fisse, chi studiava sempre tanto
    // vedeva soltanto i sei boss e il bestiario restava grigio per due terzi.
    const visti = new Set<Tier>();
    for (let i = 1; i <= 30; i++) {
      visti.add(monsterForDay(`2026-09-${String(i).padStart(2, '0')}`, 130, 100).tier);
    }
    assert.equal(visti.size, 3, `in un mese pesante sono usciti solo: ${[...visti].join(', ')}`);
  });

  await t.test('anche chi fa poche card incontra qualcosa di raro, prima o poi', () => {
    const visti = new Set<Tier>();
    for (let i = 0; i < 400; i++) {
      visti.add(monsterForDay(`2027-01-${String(i % 28 + 1).padStart(2, '0')}-${i}`, 20, 100).tier);
    }
    assert.ok(visti.has(TIER_UNCOMMON) && visti.has(TIER_BOSS));
  });
});
