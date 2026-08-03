import test from 'node:test';
import assert from 'node:assert/strict';
import { IT } from '../../src/lib/i18n/it';
import {
  ALL_MISSIONS_BONUS,
  MISSION_POOL,
  MISSION_REWARD,
  MISSIONS_PER_DAY,
  missionReward,
  missionsForDay,
} from '../../src/lib/missions';
import { freshDayState } from '../../src/lib/gamification';

const giorni = (mese: string, quanti: number) =>
  Array.from({ length: quanti }, (_, i) => `${mese}-${String(i + 1).padStart(2, '0')}`);

test('missionsForDay', async (t) => {
  await t.test('ne assegna sempre tre', () => {
    for (const day of giorni('2026-08', 31)) {
      assert.equal(missionsForDay(day).length, MISSIONS_PER_DAY);
    }
  });

  await t.test('lo stesso giorno da\' sempre le stesse', () => {
    const a = missionsForDay('2026-08-02').map((m) => m.id);
    const b = missionsForDay('2026-08-02').map((m) => m.id);
    assert.deepEqual(a, b, 'le missioni non possono cambiare a meta\' giornata');
  });

  await t.test('mai due volte la stessa nello stesso giorno', () => {
    for (const day of giorni('2026-09', 30)) {
      const ids = missionsForDay(day).map((m) => m.id);
      assert.equal(new Set(ids).size, ids.length, `doppione il ${day}: ${ids.join(', ')}`);
    }
  });

  await t.test('in un mese girano parecchie missioni diverse', () => {
    const viste = new Set<string>();
    for (const day of giorni('2026-10', 31)) {
      for (const m of missionsForDay(day)) viste.add(m.id);
    }
    assert.ok(viste.size >= 8, `solo ${viste.size} missioni diverse in un mese`);
  });

  await t.test('nessun giorno resta senza una missione facile', () => {
    // Tre obiettivi tosti insieme scoraggiano invece di invogliare.
    for (const day of giorni('2026-11', 30)) {
      const facili = missionsForDay(day).filter((m) => m.easy);
      assert.ok(facili.length >= 1, `il ${day} non ha nessuna missione abbordabile`);
    }
  });

  await t.test('ogni missione sa leggere il proprio progresso', () => {
    const day = freshDayState('2026-08-02');
    for (const mission of MISSION_POOL) {
      const valore = mission.progress(day);
      assert.equal(typeof valore, 'number', `${mission.id} non restituisce un numero`);
      assert.equal(valore, 0, `${mission.id} parte gia' avviata su una giornata vuota`);
      assert.ok(mission.target > 0, `${mission.id} ha un obiettivo non positivo`);
      assert.ok(IT[mission.key], `${mission.id} non ha una frase nel dizionario`);
    }
  });

  await t.test('gli identificativi sono unici in tutto il mazzo', () => {
    const ids = MISSION_POOL.map((m) => m.id);
    assert.equal(new Set(ids).size, ids.length);
  });
});

test('missionReward', async (t) => {
  await t.test('nessuna missione completata non paga niente', () => {
    assert.equal(missionReward(0, 0), 0);
    assert.equal(missionReward(-1, 0), 0);
  });

  await t.test('ogni missione vale il suo premio', () => {
    assert.equal(missionReward(1, 1), MISSION_REWARD);
    assert.equal(missionReward(2, 2), MISSION_REWARD * 2);
  });

  await t.test('il tris aggiunge il suo extra', () => {
    // La terza cade da sola: base piu' bonus
    assert.equal(missionReward(1, 3), MISSION_REWARD + ALL_MISSIONS_BONUS);
    // Tutte e tre insieme: tre premi piu' un solo bonus
    assert.equal(missionReward(3, 3), MISSION_REWARD * 3 + ALL_MISSIONS_BONUS);
  });

  await t.test('il tris non si paga due volte', () => {
    // Le tre erano gia' completate prima: qui non ne cade nessuna nuova
    assert.equal(missionReward(0, 3), 0);
  });
});
