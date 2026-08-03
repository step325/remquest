import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { sidebarIconCss, sidebarLinkSelector } from '../../src/lib/sidebar_icon';

const PNG = 'data:image/png;base64,iVBORw0KGgo=';

test('sidebarLinkSelector', async (t) => {
  await t.test('aggancia il bottone del plugin per nome', () => {
    // RemNote scrive `data-test="Extension Sidebar Link <nome>"` sul bottone:
    // e' l'unico attributo che distingue il nostro da quello di un altro
    // plugin, che ha le stesse identiche classi.
    assert.equal(
      sidebarLinkSelector('Remquest'),
      '[data-test="Extension Sidebar Link Remquest"]'
    );
  });

  await t.test('un nome con virgolette non spezza il selettore', () => {
    // Il nome arriva dal manifest: se ci finisse una virgoletta, il selettore
    // si chiuderebbe a meta' e il CSS successivo verrebbe buttato via.
    assert.equal(
      sidebarLinkSelector('Rem"quest'),
      '[data-test="Extension Sidebar Link Rem\\"quest"]'
    );
  });
});

test('sidebarIconCss', async (t) => {
  const css = sidebarIconCss('Remquest', PNG);

  await t.test('colpisce solo l\'icona del nostro bottone', () => {
    assert.ok(css.includes('[data-test="Extension Sidebar Link Remquest"]'));
    assert.ok(css.includes('[data-icon="extension"]'));
  });

  await t.test('spegne la maschera del puzzle', () => {
    // L'icona di serie e' una mask-image monocroma tinta da `currentcolor`:
    // lasciandola accesa, il nostro disegno resterebbe sotto una sagoma di
    // puzzle e non si vedrebbe niente.
    for (const riga of ['mask-image: none', 'background-color: transparent']) {
      assert.ok(css.includes(riga), `manca ${riga}`);
    }
  });

  await t.test('ogni dichiarazione e\' !important', () => {
    // Le proprieta' che sovrascriviamo sono stili inline scritti da RemNote:
    // una regola normale perde contro un attributo style.
    // Il disegno viene tolto prima di guardare: dentro un data URL ci sono
    // due punti e punti e virgola che sembrano dichiarazioni e non lo sono.
    const senzaDisegno = css.replace(/url\("[^"]*"\)/g, 'url(...)');
    const dichiarazioni = senzaDisegno.match(/[\w-]+:[^;{}]+;/g) ?? [];
    assert.ok(dichiarazioni.length > 0);
    for (const d of dichiarazioni) assert.ok(d.includes('!important'), `senza peso: ${d.trim()}`);
  });

  await t.test('i pixel restano quadrati', () => {
    assert.ok(css.includes('image-rendering: pixelated'));
  });

  await t.test('porta dentro il disegno', () => {
    assert.ok(css.includes(PNG));
  });
});

test('il nome del plugin e\' uno solo', async (t) => {
  await t.test('quello del manifest e' + '\' quello che cerca il CSS', () => {
    // Il selettore contiene il nome mostrato da RemNote: se il manifest e il
    // codice divergessero, l'icona resterebbe il puzzle senza un errore.
    const manifest = JSON.parse(readFileSync('public/manifest.json', 'utf8'));
    const sorgente = readFileSync('src/widgets/index.tsx', 'utf8');
    assert.ok(
      sorgente.includes(`const PLUGIN_NAME = '${manifest.name}'`),
      `il manifest dice "${manifest.name}", index.tsx dice altro`
    );
  });
});
