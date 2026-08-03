import test from 'node:test';
import assert from 'node:assert/strict';
import { recapBody, recapFor } from '../../src/lib/recap';
import { freshDayState } from '../../src/lib/gamification';
import { translator } from '../../src/lib/i18n/index';

const it = translator('it');
const en = translator('en');

const giorno = (cards: number, xp = 0, cleared = 0) => ({
  ...freshDayState('2026-08-03'),
  cardsDone: cards,
  totalXp: xp,
  queueCleared: cleared,
});

test('recapFor', async (t) => {
  await t.test('una coda aperta e chiusa senza fare niente non si riepiloga', () => {
    // Aprire la coda, guardare una card e uscire non e' una sessione: un
    // riepilogo da zero colpi e' solo un avviso in faccia.
    assert.equal(recapFor(giorno(0), 0), null);
  });

  await t.test('con del lavoro fatto dice quanto', () => {
    const r = recapFor(giorno(43, 620), 0);
    assert.deepEqual(r, { cards: 43, xp: 620, bossDown: false });
  });

  await t.test('il boss abbattuto entra nel riepilogo', () => {
    assert.equal(recapFor(giorno(80, 900, 1), 0)?.bossDown, true);
  });

  await t.test('richiudere la coda senza card nuove non ripete l\'annuncio', () => {
    // Entrare e uscire tre volte di seguito deve dare un riepilogo, non tre.
    assert.equal(recapFor(giorno(43), 43), null);
  });

  await t.test('una card in piu\' e\' una sessione nuova', () => {
    assert.equal(recapFor(giorno(44), 43)?.cards, 44);
  });

  await t.test('un contatore rovinato non produce un riepilogo assurdo', () => {
    // `shownAtCards` vive in memoria e le card arrivano dallo storage: se
    // qualcosa e' andato storto, meglio nessun annuncio che uno con -3 colpi.
    for (const roba of [Number.NaN, -5, Number.POSITIVE_INFINITY]) {
      assert.equal(recapFor(giorno(roba as number), 0), null);
    }
    assert.equal(recapFor(giorno(10), Number.NaN), null);
  });
});

test('recapBody', async (t) => {
  const r = recapFor(giorno(43, 620), 0)!;

  await t.test('senza compagno parla solo dei colpi', () => {
    for (const tr of [it, en]) {
      const testo = recapBody(tr, r, '');
      assert.ok(testo.includes('43'), testo);
      assert.ok(!testo.includes('{'), testo);
    }
  });

  await t.test('con il compagno lo nomina', () => {
    const testo = recapBody(it, r, 'Gufo');
    assert.ok(testo.includes('Gufo'), testo);
    assert.ok(testo.includes('43'), testo);
  });

  await t.test('il boss caduto si aggiunge, non sostituisce', () => {
    const vinto = recapFor(giorno(80, 900, 1), 0)!;
    const testo = recapBody(it, vinto, 'Gufo');
    assert.ok(testo.includes('80'), testo);
    assert.ok(testo.length > recapBody(it, { ...vinto, bossDown: false }, 'Gufo').length);
  });

  await t.test('le due lingue riempiono tutti i buchi', () => {
    const vinto = recapFor(giorno(80, 900, 1), 0)!;
    for (const tr of [it, en]) {
      for (const nome of ['', 'Gufo']) {
        assert.ok(!recapBody(tr, vinto, nome).includes('{'), tr === it ? 'it' : 'en');
      }
    }
  });
});
