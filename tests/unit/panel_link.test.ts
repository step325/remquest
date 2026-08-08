import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PANEL_CLOSE,
  PANEL_MOVE,
  heard,
  moveOf,
  say,
  sayMove,
} from '../../src/lib/panel_link';

test('say', async (t) => {
  await t.test('impacchetta il messaggio sotto una chiave nostra', () => {
    // Il canale e' condiviso da tutto il plugin: senza un contenitore
    // riconoscibile non si distinguerebbe un nostro messaggio da un altro.
    assert.deepEqual(say(PANEL_CLOSE), { rq: PANEL_CLOSE });
  });
});

test('heard', async (t) => {
  await t.test('riconosce i messaggi che spediamo', () => {
    for (const kind of [PANEL_CLOSE, PANEL_MOVE] as const) {
      assert.equal(heard(say(kind)), kind);
    }
  });

  await t.test('riconosce anche il messaggio avvolto', () => {
    // La forma del payload dell'evento non e' documentata: puo' arrivare nudo
    // o dentro `message`, e sbagliare significherebbe un pannello che non
    // risponde piu' a niente.
    assert.equal(heard({ message: say(PANEL_CLOSE) }), PANEL_CLOSE);
  });

  await t.test('la roba di altri non e\' un nostro messaggio', () => {
    for (const roba of [undefined, null, '', 42, {}, { rq: 'qualcos-altro' }, { message: 1 }]) {
      assert.equal(heard(roba), null);
    }
  });
});

test('moveOf', async (t) => {
  await t.test('porta lo spostamento fino a chi tiene la posizione', () => {
    assert.deepEqual(moveOf(sayMove(12, -4)), { dx: 12, dy: -4 });
  });

  await t.test('funziona anche avvolto, come gli altri', () => {
    assert.deepEqual(moveOf({ message: sayMove(1, 2) }), { dx: 1, dy: 2 });
  });

  await t.test('gli altri nostri messaggi non sono spostamenti', () => {
    // Senza questo controllo una richiesta di chiusura verrebbe letta come uno
    // spostamento di `undefined`, e la posizione andrebbe a NaN.
    assert.equal(moveOf(say(PANEL_CLOSE)), null);
  });

  await t.test('la roba di altri nemmeno', () => {
    assert.equal(moveOf({ dx: 5, dy: 5 }), null);
  });
});
