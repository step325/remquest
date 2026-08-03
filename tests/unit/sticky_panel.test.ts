import test from 'node:test';
import assert from 'node:assert/strict';
import { REOPEN_GAP_MS, shouldReopen } from '../../src/lib/sticky_panel';

const stato = (sticky: boolean, lastOpenAt = 0) => ({ sticky, lastOpenAt });

test('shouldReopen', async (t) => {
  await t.test('chi non l\'ha mai aperto non se lo vede comparire', () => {
    assert.equal(shouldReopen(stato(false), 10_000), false);
  });

  await t.test('dopo una navigazione il pannello torna', () => {
    assert.equal(shouldReopen(stato(true, 0), REOPEN_GAP_MS), true);
  });

  await t.test('una raffica di eventi lo riapre una volta sola', () => {
    // Cambiare pagina fa scattare piu' eventi ravvicinati: senza la pausa il
    // pannello verrebbe riaperto tre o quattro volte di fila, e ogni riapertura
    // ruba il posto a quello che c'e' nella barra.
    assert.equal(shouldReopen(stato(true, 1_000), 1_000 + REOPEN_GAP_MS - 1), false);
    assert.equal(shouldReopen(stato(true, 1_000), 1_000 + REOPEN_GAP_MS), true);
  });

  await t.test('la pausa e\' breve: non deve sembrare un ritardo', () => {
    assert.ok(REOPEN_GAP_MS <= 1_000, 'oltre un secondo si vedrebbe il pannello sparire e tornare');
  });

  await t.test('un orologio che va indietro non blocca la riapertura', () => {
    // `now` viene dal dispositivo: se l'ora si sposta all'indietro, la
    // differenza diventa negativa e senza questa cura il pannello non
    // tornerebbe piu' fino a recuperare il salto.
    assert.equal(shouldReopen(stato(true, 5_000), 1_000), true);
  });
});
