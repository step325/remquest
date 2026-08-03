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

  /** Quante volte esce ogni scaglione in un mese con quel carico */
  const conta = (cards: number, media: number) => {
    const visti = { common: 0, uncommon: 0, boss: 0 } as Record<string, number>;
    for (let d = 1; d <= 28; d++) {
      const day = `2026-10-${String(d).padStart(2, '0')}`;
      visti[monsterForDay(day, cards, media).tier] += 1;
    }
    return visti;
  };

  await t.test('le giornate leggere schierano soprattutto creature comuni', () => {
    // Non "sempre": il carico sposta le probabilita', non decide da solo. Ma in
    // un mese fiacco i comuni devono restare la regola.
    const visti = conta(20, 100);
    assert.ok(visti[TIER_COMMON] >= 20, `solo ${visti[TIER_COMMON]} comuni su 28`);
  });

  await t.test('le giornate pesanti alzano il rischio senza garantire il boss', () => {
    const pesante = conta(260, 100);
    const leggera = conta(20, 100);
    assert.ok(pesante[TIER_BOSS] > leggera[TIER_BOSS]);
    // E restano un avvenimento: un mese durissimo non e' un mese di soli boss
    assert.ok(pesante[TIER_BOSS] <= 10, `${pesante[TIER_BOSS]} boss su 28 giorni`);
  });

  await t.test('un mese pesante fa incontrare comunque tutti gli scaglioni', () => {
    const visti = conta(150, 100);
    for (const tier of [TIER_COMMON, TIER_UNCOMMON, TIER_BOSS]) {
      assert.ok(visti[tier] > 0, `mai visto ${tier} in un mese`);
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
