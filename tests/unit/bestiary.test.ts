import test from 'node:test';
import assert from 'node:assert/strict';
import { MONSTER_COUNT, TIER_BOSS, TIER_COMMON, TIER_UNCOMMON, monsterForDay } from '../../src/lib/bestiary';

test('monsterForDay', async (t) => {
  await t.test('lo stesso giorno da\' sempre lo stesso mostro', () => {
    const a = monsterForDay('2026-08-02', 40);
    const b = monsterForDay('2026-08-02', 40);
    assert.deepEqual(a, b, 'il boss non puo\' cambiare faccia a meta\' giornata');
  });

  await t.test('giorni diversi danno mostri diversi', () => {
    const facce = new Set<string>();
    for (let d = 1; d <= 28; d++) {
      const day = `2026-09-${String(d).padStart(2, '0')}`;
      facce.add(JSON.stringify(monsterForDay(day, 40)));
    }
    assert.ok(facce.size >= 8, `in un mese devono comparire almeno otto mostri, non ${facce.size}`);
  });

  await t.test('le giornate leggere schierano creature comuni', () => {
    for (let d = 1; d <= 28; d++) {
      const day = `2026-10-${String(d).padStart(2, '0')}`;
      assert.equal(monsterForDay(day, 12).tier, TIER_COMMON);
    }
  });

  await t.test('le giornate di mezzo alzano il livello', () => {
    for (let d = 1; d <= 28; d++) {
      const day = `2026-10-${String(d).padStart(2, '0')}`;
      assert.equal(monsterForDay(day, 60).tier, TIER_UNCOMMON);
    }
  });

  await t.test('le giornate pesanti sono roba da boss', () => {
    for (let d = 1; d <= 28; d++) {
      const day = `2026-10-${String(d).padStart(2, '0')}`;
      assert.equal(monsterForDay(day, 200).tier, TIER_BOSS);
    }
  });

  await t.test('l\'indice resta dentro il suo scaglione', () => {
    for (let d = 1; d <= 31; d++) {
      const day = `2026-11-${String(d).padStart(2, '0')}`;
      for (const cards of [5, 40, 90, 300]) {
        const m = monsterForDay(day, cards);
        assert.ok(m.index >= 0, 'indice negativo');
        assert.ok(m.index < MONSTER_COUNT[m.tier], `indice ${m.index} fuori da ${m.tier}`);
      }
    }
  });

  await t.test('una giornata senza card in programma non lascia il posto vuoto', () => {
    const m = monsterForDay('2026-08-02', 0);
    assert.equal(m.tier, TIER_COMMON);
    assert.ok(m.index >= 0);
  });

  await t.test('un giorno malformato non fa esplodere niente', () => {
    for (const day of ['', 'boh', '????']) {
      const m = monsterForDay(day, 40);
      assert.ok(m.index >= 0 && m.index < MONSTER_COUNT[m.tier]);
    }
  });
});
