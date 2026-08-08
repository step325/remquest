import test from 'node:test';
import assert from 'node:assert/strict';
import {
  type Size,
  clampPosition,
  movedBy,
  normalizePosition,
} from '../../src/lib/panel_position';

const SCHERMO: Size = { width: 1920, height: 1080 };
const RIQUADRO: Size = { width: 380, height: 600 };

test('movedBy', async (t) => {
  await t.test('trascinare a destra avvicina il riquadro al bordo destro', () => {
    // `right` e' la distanza DAL bordo destro: muovendosi verso destra
    // diminuisce. Sbagliare il segno qui fa scappare il pannello dalla parte
    // opposta al mouse, ed e' l'errore che si nota subito.
    assert.deepEqual(movedBy({ top: 64, right: 20 }, 30, 0, SCHERMO, RIQUADRO), {
      top: 64,
      right: 0,
    });
  });

  await t.test('trascinare a sinistra lo allontana dal bordo destro', () => {
    assert.deepEqual(movedBy({ top: 64, right: 20 }, -100, 0, SCHERMO, RIQUADRO), {
      top: 64,
      right: 120,
    });
  });

  await t.test('trascinare in basso aumenta la distanza dall\'alto', () => {
    assert.deepEqual(movedBy({ top: 64, right: 20 }, 0, 50, SCHERMO, RIQUADRO), {
      top: 114,
      right: 20,
    });
  });

  await t.test('gli spostamenti si accumulano senza deriva', () => {
    let pos = { top: 100, right: 100 };
    for (let i = 0; i < 10; i++) pos = movedBy(pos, 3, 2, SCHERMO, RIQUADRO);
    assert.deepEqual(pos, { top: 120, right: 70 });
  });

  await t.test('uno spostamento assurdo non sposta niente', () => {
    // I numeri arrivano da un messaggio: se non sono numeri, la posizione
    // resta dov'e' invece di diventare NaN e sparire dallo schermo.
    const pos = { top: 64, right: 20 };
    assert.deepEqual(movedBy(pos, Number.NaN, 5, SCHERMO, RIQUADRO), pos);
    assert.deepEqual(movedBy(pos, 5, Infinity, SCHERMO, RIQUADRO), pos);
  });
});

test('clampPosition', async (t) => {
  await t.test('non si puo\' spingere sopra il bordo alto', () => {
    assert.equal(clampPosition({ top: -200, right: 20 }, SCHERMO, RIQUADRO).top, 0);
  });

  await t.test('non si puo\' spingere fuori dal bordo destro', () => {
    assert.equal(clampPosition({ top: 64, right: -300 }, SCHERMO, RIQUADRO).right, 0);
  });

  await t.test('il riquadro ci sta dentro tutto, non solo un lembo', () => {
    // Il difetto della 0.2.1: bastava che restassero 40 px. Si trascinava
    // verso un angolo, la striscia in alto restava afferrabile e tutto il
    // resto del pannello finiva oltre il bordo — illeggibile.
    const giu = clampPosition({ top: 99_999, right: 99_999 }, SCHERMO, RIQUADRO);
    assert.equal(giu.top, SCHERMO.height - RIQUADRO.height);
    assert.equal(giu.right, SCHERMO.width - RIQUADRO.width);
  });

  await t.test('il bordo basso e\' un limite, non un suggerimento', () => {
    // Un pixel oltre il punto in cui il fondo del riquadro tocca il fondo
    // dell'area non deve passare.
    const limite = SCHERMO.height - RIQUADRO.height;
    assert.equal(clampPosition({ top: limite + 1, right: 0 }, SCHERMO, RIQUADRO).top, limite);
    assert.equal(clampPosition({ top: limite, right: 0 }, SCHERMO, RIQUADRO).top, limite);
  });

  await t.test('un\'area piu\' piccola del riquadro lo mette nell\'angolo', () => {
    // Finestra bassa: il riquadro non ci sta comunque, e appoggiarlo in alto a
    // destra e' meglio che calcolare un massimo negativo.
    const stretta = clampPosition({ top: 500, right: 500 }, { width: 300, height: 400 }, RIQUADRO);
    assert.deepEqual(stretta, { top: 0, right: 0 });
  });
});

test('normalizePosition', async (t) => {
  await t.test('rilegge quello che aveva scritto', () => {
    assert.deepEqual(normalizePosition({ top: 120, right: 40 }), { top: 120, right: 40 });
  });

  await t.test('qualunque altra cosa non da\' posizione', () => {
    // Storage sporco o di una versione vecchia: meglio il posto di sempre che
    // un pannello che si apre fuori dallo schermo.
    for (const roba of [undefined, null, 'x', 42, {}, { top: 1 }, { top: 'a', right: 2 }]) {
      assert.equal(normalizePosition(roba), null);
    }
  });

  await t.test('i valori fuori scala non passano', () => {
    assert.equal(normalizePosition({ top: Number.NaN, right: 10 }), null);
  });
});
