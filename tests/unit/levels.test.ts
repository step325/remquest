import test from 'node:test';
import assert from 'node:assert/strict';
import { xpForLevel, levelFromXp, levelProgress } from '../../src/lib/levels';

test('xpForLevel', async (t) => {
  await t.test('soglie cumulative note', () => {
    assert.equal(xpForLevel(1), 0);
    assert.equal(xpForLevel(2), 100);
    assert.equal(xpForLevel(3), 300);
    assert.equal(xpForLevel(4), 600);
    assert.equal(xpForLevel(5), 1000);
  });

  await t.test('livelli sotto 1 non costano nulla', () => {
    assert.equal(xpForLevel(0), 0);
    assert.equal(xpForLevel(-3), 0);
  });

  await t.test('ogni livello costa 100 XP in piu\' del precedente', () => {
    for (let l = 2; l < 30; l++) {
      assert.equal(xpForLevel(l + 1) - xpForLevel(l) - (xpForLevel(l) - xpForLevel(l - 1)), 100);
    }
  });
});

test('levelFromXp', async (t) => {
  await t.test('e\' l\'inversa di xpForLevel sulle soglie esatte', () => {
    for (let l = 1; l < 50; l++) {
      assert.equal(levelFromXp(xpForLevel(l)), l);
    }
  });

  await t.test('un XP prima della soglia si resta al livello sotto', () => {
    for (let l = 2; l < 50; l++) {
      assert.equal(levelFromXp(xpForLevel(l) - 1), l - 1);
    }
  });

  await t.test('valori assurdi non producono livelli assurdi', () => {
    assert.equal(levelFromXp(0), 1);
    assert.equal(levelFromXp(-500), 1);
    assert.equal(levelFromXp(NaN), 1);
    assert.equal(levelFromXp(Infinity), 1);
  });
});

test('levelProgress', async (t) => {
  await t.test('a inizio livello la barra e\' vuota', () => {
    const p = levelProgress(100);
    assert.equal(p.level, 2);
    assert.equal(p.xpIntoLevel, 0);
    assert.equal(p.xpForNextLevel, 200);
    assert.equal(p.percent, 0);
  });

  await t.test('a meta\' livello la barra e\' al 50%', () => {
    const p = levelProgress(200);
    assert.equal(p.level, 2);
    assert.equal(p.xpIntoLevel, 100);
    assert.equal(p.percent, 50);
  });

  await t.test('percent resta sempre tra 0 e 100', () => {
    for (const xp of [0, 1, 99, 100, 299, 5000, 123456]) {
      const p = levelProgress(xp);
      assert.ok(p.percent >= 0 && p.percent <= 100, `xp=${xp} -> ${p.percent}`);
      assert.ok(p.xpIntoLevel >= 0 && p.xpIntoLevel < p.xpForNextLevel);
    }
  });

  await t.test('il titolo esiste anche oltre l\'ultimo previsto', () => {
    assert.equal(typeof levelProgress(0).title, 'string');
    assert.equal(typeof levelProgress(10_000_000).title, 'string');
  });
});
