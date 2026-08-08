import test from 'node:test';
import assert from 'node:assert/strict';
import { planFor, plannedFromQueue } from '../../src/lib/boss_plan';
import { HP_PER_CARD, freshDayState } from '../../src/lib/gamification';

const giorno = (patch: Partial<ReturnType<typeof freshDayState>> = {}) => ({
  ...freshDayState('2026-08-03'),
  ...patch,
});

test('plannedFromQueue', async (t) => {
  await t.test('a inizio sessione il piano e\' la coda', () => {
    // Il caso vero: RemNote diceva «Practice 13 Cards», e 13 dev'essere il boss.
    assert.equal(plannedFromQueue(giorno(), 13), 13);
  });

  await t.test('durante la sessione la somma non si muove', () => {
    // Ogni card fatta e' una in meno fra le rimaste: se la somma cambiasse, il
    // boss cambierebbe taglia ad ogni risposta.
    assert.equal(plannedFromQueue(giorno({ cardsDone: 5 }), 8), 13);
    assert.equal(plannedFromQueue(giorno({ cardsDone: 12 }), 1), 13);
  });

  await t.test('una seconda sessione aggiunge lavoro', () => {
    // Finite le 13, se ne aprono altre 6: la giornata ne vale 19, non 6.
    assert.equal(plannedFromQueue(giorno({ cardsDone: 13 }), 6), 19);
  });

  await t.test('un numero assurdo non toglie card gia\' fatte', () => {
    assert.equal(plannedFromQueue(giorno({ cardsDone: 4 }), -3), 4);
  });
});

test('planFor', async (t) => {
  await t.test('la prima misura fa il boss', () => {
    assert.deepEqual(planFor({ maxHp: 0, cardsPlanned: 0 }, 13), {
      cardsPlanned: 13,
      maxHp: 13 * HP_PER_CARD,
    });
  });

  await t.test('una misura piu\' grande allarga il boss', () => {
    assert.deepEqual(planFor({ maxHp: 13 * HP_PER_CARD, cardsPlanned: 13 }, 19), {
      cardsPlanned: 19,
      maxHp: 19 * HP_PER_CARD,
    });
  });

  await t.test('una misura piu\' piccola non lo rimpicciolisce', () => {
    // Riaprire una coda corta a fine giornata non deve far cadere il boss da
    // solo ne' far scendere la barra da due parti.
    const grosso = { maxHp: 19 * HP_PER_CARD, cardsPlanned: 19 };
    assert.deepEqual(planFor(grosso, 4), grosso);
  });

  await t.test('zero non azzera un boss gia\' misurato', () => {
    const grosso = { maxHp: 13 * HP_PER_CARD, cardsPlanned: 13 };
    assert.deepEqual(planFor(grosso, 0), grosso);
  });
});
