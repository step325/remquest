import test from 'node:test';
import assert from 'node:assert/strict';
import { crossedHalfway, freshDayState } from '../../src/lib/gamification';

const day = (damage: number, done = 0) => ({
  ...freshDayState('2026-08-03'),
  bossDamage: damage,
  halfwayDone: done,
});

test('crossedHalfway', async (t) => {
  await t.test('sotto la meta\' non scatta', () => {
    assert.equal(crossedHalfway(day(49), 100), false);
  });

  await t.test('alla meta\' esatta scatta', () => {
    assert.equal(crossedHalfway(day(50), 100), true);
  });

  await t.test('scatta una volta sola per giornata', () => {
    assert.equal(crossedHalfway(day(80, 1), 100), false, 'gia\' annunciato oggi');
  });

  await t.test('senza boss misurato non scatta', () => {
    assert.equal(crossedHalfway(day(50), 0), false);
  });
});
