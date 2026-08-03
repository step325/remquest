import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { themeClassById } from '../../src/lib/themes';
import { CATALOG, themeClass } from '../../src/lib/shop';
import { freshWallet } from '../../src/lib/wallet';

/** Le variabili colore dichiarate in un blocco CSS, per nome */
function colorVars(css: string, selector: string): Record<string, string> {
  const start = css.indexOf(`${selector} {`);
  assert.ok(start >= 0, `blocco ${selector} non trovato`);
  const block = css.slice(start, css.indexOf('}', start));
  const vars: Record<string, string> = {};
  const colore = /(--px-[\w-]+):\s*(#[0-9a-fA-F]+|rgba?\([^)]*\));/g;
  for (const [, name, value] of block.matchAll(colore)) {
    vars[name] = value.toLowerCase();
  }
  return vars;
}

test('themeClassById', async (t) => {
  await t.test('senza tema non aggiunge nessuna classe', () => {
    assert.equal(themeClassById(''), '');
  });

  await t.test('traduce l\'articolo nel nome della classe', () => {
    assert.equal(themeClassById('theme:gameboy'), 'theme-gameboy');
  });

  await t.test('un identificativo storto non produce una classe a caso', () => {
    assert.equal(themeClassById('roba'), '');
  });

  await t.test('e\' la stessa regola che usa il portafoglio', () => {
    // Se le due strade divergessero, il portafoglio direbbe un tema e il
    // pannello ne indosserebbe un altro.
    assert.equal(themeClass(freshWallet()), themeClassById(freshWallet().theme));
  });
});

test('i temi in vendita', async (t) => {
  const css = readFileSync('src/styles/themes.css', 'utf8');
  const temi = CATALOG.filter((i) => i.kind === 'theme');

  await t.test('ognuno ha il suo blocco nel foglio di stile', () => {
    // Se un tema si vende ma la classe non esiste, si compra il nulla.
    for (const item of temi) {
      assert.ok(css.includes(`.px.${themeClassById(item.id)}`), `manca lo stile per ${item.id}`);
    }
  });

  await t.test('nessuno si dimentica una tinta', () => {
    // Una variabile non ridefinita eredita da .px, cioe' resta del tema di
    // serie: e' cosi' che la barra del livello restava viola sotto Game Boy.
    const attese = Object.keys(colorVars(readFileSync('src/styles/pixel.css', 'utf8'), '.px'));
    for (const item of temi) {
      const classe = themeClassById(item.id);
      const tema = colorVars(css, `.px.${classe}`);
      assert.deepEqual(Object.keys(tema).sort(), [...attese].sort(), `${classe} incompleto`);
    }
  });
});
