import test from 'node:test';
import assert from 'node:assert/strict';
import { queueFullscreenCss } from '../../src/lib/queue_fullscreen';

test('queueFullscreenCss', async (t) => {
  await t.test('da spento non inietta niente', () => {
    assert.equal(queueFullscreenCss(false), '');
  });

  await t.test('da acceso toglie il limite di larghezza', () => {
    const css = queueFullscreenCss(true);
    assert.ok(css.includes('max-width: none'));
    assert.ok(css.includes('width: 100%'));
  });

  await t.test('agisce sul contenitore della coda', () => {
    assert.ok(queueFullscreenCss(true).includes('.rn-queue'));
  });

  await t.test('scavalca le misure inline del riquadro ridimensionabile', () => {
    const css = queueFullscreenCss(true);
    // RemNote scrive width/min-width/max-width come attributo style a ogni
    // trascinamento delle maniglie: vanno sovrascritte tutte e tre.
    assert.ok(css.includes('min-width: 0'));
    assert.ok(/max-width:\s*calc\(100vw/.test(css));
    assert.ok(/width:\s*calc\(100vw/.test(css));
  });

  await t.test('lascia liberi i lati, dove stanno i pulsanti per uscire', () => {
    const css = queueFullscreenCss(true);
    // La X per uscire e la freccia di richiusura stanno fuori dal riquadro:
    // una coda larga quanto la finestra ci finirebbe sopra.
    const margin = css.match(/calc\(100vw - (\d+)px\)/);
    assert.ok(margin, 'la larghezza deve lasciare un margine');
    assert.ok(Number(margin[1]) >= 120, 'il margine deve bastare per i due pulsanti');
    assert.ok(css.includes('margin: auto'), 'e la coda resta centrata');
  });

  await t.test('la stessa spaziatura sopra e sotto', () => {
    const css = queueFullscreenCss(true);
    const wide = css.match(/calc\(100vw - (\d+)px\)/);
    const tall = css.match(/calc\(100vh - (\d+)px\)/);
    assert.ok(wide, 'la larghezza deve lasciare un margine');
    assert.ok(tall, 'anche l\'altezza deve lasciare un margine');
    assert.equal(tall[1], wide[1], 'i quattro lati vanno spaziati uguale');
  });

  await t.test('tiene i pulsanti di risposta alla loro misura', () => {
    const css = queueFullscreenCss(true);
    // La fascia dei pulsanti e' alta una percentuale del riquadro: senza un
    // tetto fisso, allargare la coda li fa diventare enormi.
    assert.ok(css.includes('.rn-queue__answer-btns'));
    assert.ok(css.includes('.spaced-repetition__bottom'));
    assert.ok(/max-height:\s*\d+px/.test(css));
  });

  await t.test('la larghezza di serie e\' scritta da RemNote: serve !important', () => {
    assert.ok(queueFullscreenCss(true).includes('!important'));
  });

  await t.test('a tutto schermo il testo non tocca i bordi', () => {
    const css = queueFullscreenCss(true);
    assert.ok(/padding-left:\s*\d+px/.test(css));
    assert.ok(/padding-right:\s*\d+px/.test(css));
  });

  await t.test('raggiunge il genitore, che non ha una classe propria', () => {
    const css = queueFullscreenCss(true);
    // Il riquadro ridimensionabile porta solo utility di Tailwind, che
    // cambiano: si arriva per posizione, non per nome.
    assert.ok(css.includes('*:has(> .rn-queue)'), 'genitore diretto');
    assert.ok(css.includes('*:has(> * > .rn-queue)'), 'nonno');
  });

  await t.test('libera anche l\'altezza, non solo la larghezza', () => {
    const css = queueFullscreenCss(true);
    assert.ok(css.includes('height: 100%'));
    assert.ok(css.includes('max-height: none'));
  });
});
