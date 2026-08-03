import test from 'node:test';
import assert from 'node:assert/strict';
import {
  HISTORY_DAYS,
  activeDays,
  busiestDay,
  freshHistory,
  normalizeHistory,
  withDay,
} from '../../src/lib/history';
import { freshDayState } from '../../src/lib/gamification';

const giornata = (day: string, cards: number, xp = cards * 8, won = false) => ({
  ...freshDayState(day),
  cardsDone: cards,
  totalXp: xp,
  queueCleared: won ? 1 : 0,
});

test('withDay', async (t) => {
  await t.test('registra la giornata', () => {
    const h = withDay(freshHistory(), giornata('2026-08-01', 40, 320, true));
    assert.deepEqual(h, [{ day: '2026-08-01', cards: 40, xp: 320, won: true }]);
  });

  await t.test('riscrivere lo stesso giorno lo sostituisce', () => {
    let h = withDay(freshHistory(), giornata('2026-08-01', 10));
    h = withDay(h, giornata('2026-08-01', 45));
    assert.equal(h.length, 1, 'non deve comparire due volte');
    assert.equal(h[0].cards, 45, 'devono restare i numeri finali, non i primi');
  });

  await t.test('le giornate restano in ordine, la piu\' recente in fondo', () => {
    let h = withDay(freshHistory(), giornata('2026-08-03', 5));
    h = withDay(h, giornata('2026-08-01', 5));
    h = withDay(h, giornata('2026-08-02', 5));
    assert.deepEqual(
      h.map((r) => r.day),
      ['2026-08-01', '2026-08-02', '2026-08-03']
    );
  });

  await t.test('non si conserva piu\' di un mese', () => {
    let h = freshHistory();
    for (let d = 1; d <= 40; d++) {
      h = withDay(h, giornata(`2026-09-${String(d).padStart(2, '0')}`, d));
    }
    assert.equal(h.length, HISTORY_DAYS);
    assert.equal(h[h.length - 1].day, '2026-09-40', 'la piu\' recente resta in fondo');
    assert.equal(h[0].day, '2026-09-11', 'le piu\' vecchie cadono per prime');
  });
});

test('activeDays', async (t) => {
  await t.test('conta solo le giornate in cui si e\' fatto qualcosa', () => {
    let h = withDay(freshHistory(), giornata('2026-08-01', 20));
    h = withDay(h, giornata('2026-08-02', 0, 0));
    h = withDay(h, giornata('2026-08-03', 5));
    assert.equal(activeDays(h), 2);
  });
});

test('busiestDay', async (t) => {
  await t.test('trova il massimo, per scalare le colonnine', () => {
    let h = withDay(freshHistory(), giornata('2026-08-01', 20));
    h = withDay(h, giornata('2026-08-02', 73));
    assert.equal(busiestDay(h), 73);
  });

  await t.test('uno storico vuoto non fa dividere per zero', () => {
    assert.equal(busiestDay(freshHistory()), 0);
  });
});

test('normalizeHistory', async (t) => {
  await t.test('quello che non e\' un elenco diventa vuoto', () => {
    for (const value of [undefined, null, 'boh', 7, {}]) {
      assert.deepEqual(normalizeHistory(value), freshHistory());
    }
  });

  await t.test('scarta le righe senza giorno', () => {
    const h = normalizeHistory([{ cards: 5 }, null, { day: '2026-08-01', cards: 5 }]);
    assert.equal(h.length, 1);
  });

  await t.test('di un giorno doppio tiene l\'ultimo', () => {
    const h = normalizeHistory([
      { day: '2026-08-01', cards: 5 },
      { day: '2026-08-01', cards: 50 },
    ]);
    assert.equal(h.length, 1);
    assert.equal(h[0].cards, 50);
  });

  await t.test('i numeri corrotti tornano a zero', () => {
    const h = normalizeHistory([{ day: '2026-08-01', cards: -3, xp: Number.NaN, won: 'si' }]);
    assert.equal(h[0].cards, 0);
    assert.equal(h[0].xp, 0);
    assert.equal(h[0].won, false, 'solo un vero booleano conta come vittoria');
  });
});
