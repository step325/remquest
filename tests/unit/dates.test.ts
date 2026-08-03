import test from 'node:test';
import assert from 'node:assert/strict';
import { dayKeyOf, todayKey, yesterdayKey, dayBeforeKey } from '../../src/lib/dates';

test('dayKeyOf', async (t) => {
  await t.test('formato YYYY-MM-DD con padding', () => {
    assert.equal(dayKeyOf(new Date(2026, 0, 5)), '2026-01-05');
    assert.equal(dayKeyOf(new Date(2026, 11, 31)), '2026-12-31');
  });

  await t.test("usa l'ora locale, non UTC (mezzanotte non slitta al giorno prima)", () => {
    // 00:30 locale: in UTC potrebbe essere ancora il giorno precedente
    assert.equal(dayKeyOf(new Date(2026, 7, 1, 0, 30)), '2026-08-01');
    // 23:30 locale: in UTC potrebbe essere gia' il giorno dopo
    assert.equal(dayKeyOf(new Date(2026, 7, 1, 23, 30)), '2026-08-01');
  });
});

test('todayKey / yesterdayKey', async (t) => {
  await t.test('formato valido', () => {
    assert.match(todayKey(), /^\d{4}-\d{2}-\d{2}$/);
    assert.match(yesterdayKey(), /^\d{4}-\d{2}-\d{2}$/);
  });

  await t.test("ieri e' esattamente un giorno prima di oggi", () => {
    const today = new Date(`${todayKey()}T12:00:00`);
    const yesterday = new Date(`${yesterdayKey()}T12:00:00`);
    const deltaDays = Math.round((today.getTime() - yesterday.getTime()) / 86_400_000);
    assert.equal(deltaDays, 1);
  });

  await t.test("la streak avanza usando queste chiavi (ieri !== oggi)", () => {
    assert.notEqual(todayKey(), yesterdayKey());
  });
});

test('dayBeforeKey', async (t) => {
  await t.test("sta un giorno prima di ieri", () => {
    const ieri = new Date(`${yesterdayKey()}T12:00:00`);
    ieri.setDate(ieri.getDate() - 1);
    assert.equal(dayBeforeKey(), dayKeyOf(ieri));
  });
});
