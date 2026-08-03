import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

/**
 * La festa allo scrigno e' fatta di CSS e di una prop: non c'e' logica pura da
 * provare, ma ci sono due modi di romperla in silenzio — togliere le regole
 * dal foglio, o rimettere il compagno a sparire quando il boss cade. Questi
 * test guardano proprio quelle due cose.
 */

const css = readFileSync('src/styles/hud.css', 'utf8');
const hud = readFileSync('src/ui/hud.tsx', 'utf8');
const queue = readFileSync('src/widgets/queue_hud.tsx', 'utf8');

test('la festa allo scrigno', async (t) => {
  await t.test('ha le sue regole nel foglio', () => {
    // Senza, `atChest` mette una classe che non fa niente: il compagno resta
    // fermo accanto allo scrigno e la festa non si vede.
    assert.ok(css.includes('.rq-pet-wrap.is-at-chest'), 'manca la classe');
    assert.ok(css.includes('@keyframes px-to-chest'), 'manca il tragitto');
  });

  await t.test('il tragitto finisce e resta li\'', () => {
    // Senza `forwards` il compagno torna di scatto al punto di partenza appena
    // l'animazione finisce, che e' peggio del non muoversi affatto.
    const blocco = css.slice(css.indexOf('.rq-pet-wrap.is-at-chest'));
    assert.ok(/px-to-chest[^;]*forwards/.test(blocco), 'il tragitto non si ferma allo scrigno');
  });

  await t.test('il compagno accetta di essere allo scrigno', () => {
    assert.ok(/atChest/.test(hud), 'il componente non sa cos\'e\' lo scrigno');
  });

  await t.test('non sparisce piu\' quando il boss cade', () => {
    // Prima il compagno si nascondeva a boss abbattuto: se quella condizione
    // tornasse, la festa non avrebbe nessuno a farla.
    assert.ok(/atChest=\{defeated\}/.test(queue), 'il compagno non sa che il boss e\' caduto');
    assert.ok(
      !/!defeated && \(\s*<Companion/.test(queue),
      'il compagno viene ancora nascosto a boss abbattuto'
    );
  });
});

test('il movimento resta a scatti', async (t) => {
  await t.test('il tragitto e le zampate usano steps()', () => {
    // Tutto il gioco si muove a scatti: un movimento fluido a questa scala
    // sfuma i pixel e li fa sembrare sporchi.
    const blocco = css.slice(css.indexOf('.rq-pet-wrap.is-at-chest'));
    assert.ok(/steps\(/.test(blocco.slice(0, 400)), 'il tragitto e\' fluido');
  });
});

test('chi ha chiesto meno animazioni', async (t) => {
  await t.test('non si perde il compagno allo scrigno', () => {
    // Con `prefers-reduced-motion` le animazioni si spengono: se il tragitto
    // sparisce del tutto, il compagno resta al suo posto — che va bene — ma
    // deve restare *visibile*, non a meta' strada.
    const ridotto = css.slice(css.indexOf('@media (prefers-reduced-motion'));
    assert.ok(ridotto.includes('px-to-chest') || ridotto.includes('is-at-chest'));
  });
});
