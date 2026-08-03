import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  CATALOG,
  buy,
  itemById,
  itemDescKey,
  itemNameKey,
  nextUnlock,
  themeClass,
  wear,
} from '../../src/lib/shop';
import { EN } from '../../src/lib/i18n/en';
import { IT } from '../../src/lib/i18n/it';
import {
  COINS_HALFWAY,
  COINS_PER_BOSS,
  COINS_PER_MISSION,
  freshWallet,
  earn,
  missionCoins,
  normalizeWallet,
} from '../../src/lib/wallet';
import { MAX_STREAK_TOKENS } from '../../src/lib/gamification';
import { MISSIONS_PER_DAY } from '../../src/lib/missions';
import { COMPANIONS, companionSprite } from '../../src/ui/companions';

const ricco = (coins: number) => earn(freshWallet(), coins);

test('CATALOG', async (t) => {
  await t.test('gli identificativi sono unici', () => {
    const ids = CATALOG.map((i) => i.id);
    assert.equal(new Set(ids).size, ids.length);
  });

  await t.test('ogni articolo ha un prezzo positivo e una descrizione', () => {
    for (const item of CATALOG) {
      assert.ok(item.price > 0, `${item.id} costa ${item.price}`);
      // Le frasi stanno nei dizionari: un articolo senza nome o senza
      // descrizione comparirebbe in vetrina come una chiave grezza.
      assert.ok(IT[itemNameKey(item.id)], `${item.id} senza nome`);
      assert.ok(IT[itemDescKey(item.id)], `${item.id} senza descrizione`);
      assert.ok(EN[itemNameKey(item.id)], `${item.id} senza nome inglese`);
      assert.ok(EN[itemDescKey(item.id)], `${item.id} senza descrizione inglese`);
    }
  });

  await t.test('non si vendono potenziamenti', () => {
    // Il negozio non deve poter toccare XP, danno o probabilita' di critico:
    // gonfiare i numeri toglierebbe peso a ogni card invece di aggiungerne.
    const kinds = new Set(CATALOG.map((i) => i.kind));
    for (const kind of kinds) {
      assert.ok(
        ['theme', 'companion', 'token'].includes(kind),
        `${kind} non e' una categoria ammessa: si vende aspetto e comodita', non numeri`
      );
    }
  });
});

test('buy', async (t) => {
  const tema = CATALOG.find((i) => i.kind === 'theme')!;

  await t.test('senza monete non si compra', () => {
    const esito = buy(ricco(tema.price - 1), tema.id, 0);
    assert.deepEqual(esito, { refused: 'monete' });
  });

  await t.test('comprare scala il prezzo e consegna l\'articolo', () => {
    const esito = buy(ricco(1000), tema.id, 0);
    assert.ok('wallet' in esito);
    assert.equal(esito.wallet.coins, 1000 - tema.price);
    assert.ok(esito.wallet.owned.includes(tema.id));
  });

  await t.test('un tema comprato e\' anche indossato subito', () => {
    const esito = buy(ricco(1000), tema.id, 0);
    assert.ok('wallet' in esito);
    assert.equal(esito.wallet.theme, tema.id, 'un secondo clic per metterselo sarebbe di troppo');
  });

  await t.test('non si compra due volte la stessa cosa', () => {
    const primo = buy(ricco(1000), tema.id, 0);
    assert.ok('wallet' in primo);
    assert.deepEqual(buy(primo.wallet, tema.id, 0), { refused: 'gia-posseduto' });
  });

  await t.test('un articolo inventato viene rifiutato', () => {
    assert.deepEqual(buy(ricco(1000), 'theme:inesistente', 0), { refused: 'sconosciuto' });
  });

  await t.test('il gettone si consuma e si puo\' ricomprare', () => {
    const gettone = itemById('token')!;
    const primo = buy(ricco(1000), 'token', 0);
    assert.ok('wallet' in primo);
    assert.equal(primo.tokens, 1);
    assert.ok(!primo.wallet.owned.includes('token'), 'i consumabili non si possiedono');
    // e si puo' ricomprare
    const secondo = buy(primo.wallet, 'token', 1);
    assert.ok('wallet' in secondo);
    assert.equal(secondo.wallet.coins, 1000 - gettone.price * 2);
  });

  await t.test('col tetto dei gettoni raggiunto non se ne comprano altri', () => {
    assert.deepEqual(buy(ricco(1000), 'token', MAX_STREAK_TOKENS), {
      refused: 'gettoni-al-massimo',
    });
  });
});

test('wear', async (t) => {
  await t.test('non si indossa quello che non si possiede', () => {
    const w = ricco(0);
    assert.equal(wear(w, 'theme', 'theme:gameboy'), w);
  });

  await t.test('si torna al normale con l\'identificativo vuoto', () => {
    const comprato = buy(ricco(1000), 'theme:gameboy', 0);
    assert.ok('wallet' in comprato);
    assert.equal(wear(comprato.wallet, 'theme', '').theme, '');
  });
});

test('monete', async (t) => {
  await t.test('guadagnare aggiorna saldo e totale di sempre', () => {
    const w = earn(earn(freshWallet(), 30), 20);
    assert.equal(w.coins, 50);
    assert.equal(w.earned, 50);
  });

  await t.test('spendere non tocca il totale guadagnato', () => {
    const comprato = buy(ricco(1000), 'theme:crypt', 0);
    assert.ok('wallet' in comprato);
    assert.equal(comprato.wallet.earned, 1000);
  });

  await t.test('le missioni pagano, e il gruppo una volta sola', () => {
    assert.equal(missionCoins(0, 0, MISSIONS_PER_DAY), 0);
    assert.ok(missionCoins(1, 1, MISSIONS_PER_DAY) > 0);
    const ultima = missionCoins(1, MISSIONS_PER_DAY, MISSIONS_PER_DAY);
    const singola = missionCoins(1, 1, MISSIONS_PER_DAY);
    assert.ok(ultima > singola, 'chiudere il gruppo vale di piu\'');
    assert.equal(missionCoins(0, MISSIONS_PER_DAY, MISSIONS_PER_DAY), 0);
  });
});

test('normalizeWallet', async (t) => {
  await t.test('uno storage vuoto parte da zero', () => {
    for (const value of [undefined, null, 'boh', 5]) {
      assert.deepEqual(normalizeWallet(value), freshWallet());
    }
  });

  await t.test('il guadagnato non puo\' essere meno del posseduto', () => {
    assert.equal(normalizeWallet({ coins: 500, earned: 10 }).earned, 500);
  });

  await t.test('scarta gli articoli che non sono stringhe e i doppioni', () => {
    const w = normalizeWallet({ owned: ['a', 'a', 3, null] });
    assert.deepEqual(w.owned, ['a']);
  });
});

test('themeClass', async (t) => {
  await t.test('senza tema comprato non aggiunge nessuna classe', () => {
    assert.equal(themeClass(freshWallet()), '');
  });

  await t.test('traduce l\'articolo nel nome della classe', () => {
    const comprato = buy(ricco(1000), 'theme:gameboy', 0);
    assert.ok('wallet' in comprato);
    assert.equal(themeClass(comprato.wallet), 'theme-gameboy');
  });

  await t.test('un identificativo storto non produce una classe a caso', () => {
    assert.equal(themeClass({ ...freshWallet(), theme: 'roba' }), '');
  });

  await t.test('ogni tema in vendita ha la sua classe nel foglio di stile', () => {
    // Se un tema si vende ma la classe non esiste, si compra il nulla.
    const css = readFileSync('src/styles/themes.css', 'utf8');
    for (const item of CATALOG.filter((i) => i.kind === 'theme')) {
      const classe = `theme-${item.id.slice('theme:'.length)}`;
      assert.ok(css.includes(`.px.${classe}`), `manca lo stile per ${classe}`);
    }
  });
});

test('compagni', async (t) => {
  await t.test('ogni compagno in vendita ha il suo sprite', () => {
    // Senza questo si potrebbe mettere in vendita un compagno che non esiste,
    // e chi lo compra si ritrova con niente accanto al boss.
    for (const item of CATALOG.filter((i) => i.kind === 'companion')) {
      assert.ok(companionSprite(item.id), `manca lo sprite di ${item.id}`);
    }
  });

  await t.test('ogni sprite disegnato e\' anche in vendita', () => {
    // Uno sprite senza articolo e' lavoro che nessuno vedra' mai.
    for (const companion of COMPANIONS) {
      assert.ok(itemById(companion.id), `${companion.id} non e' in catalogo`);
    }
  });

  await t.test('gli sprite hanno la misura del bestiario', () => {
    for (const companion of COMPANIONS) {
      assert.equal(companion.sprite.width, 16, `${companion.id} non e' largo 16`);
      assert.equal(companion.sprite.height, 16, `${companion.id} non e' alto 16`);
    }
  });

  await t.test('comprare un compagno lo mette subito accanto al boss', () => {
    const primo = CATALOG.find((i) => i.kind === 'companion')!;
    const esito = buy(ricco(1000), primo.id, 0);
    assert.ok('wallet' in esito);
    assert.equal(esito.wallet.companion, primo.id);
  });
});

test('nextUnlock', async (t) => {
  await t.test('a mani vuote punta al piu\' economico', () => {
    const next = nextUnlock(freshWallet());
    assert.ok(next);
    const minimo = Math.min(...CATALOG.map((i) => i.price));
    assert.equal(next.item.price, minimo);
    assert.equal(next.missing, minimo, 'senza monete manca tutto');
    assert.equal(next.percent, 0);
  });

  await t.test('avvicinandosi il traguardo si riempie', () => {
    const minimo = Math.min(...CATALOG.map((i) => i.price));
    const next = nextUnlock(ricco(Math.floor(minimo / 2)));
    assert.ok(next);
    assert.ok(next.percent > 40 && next.percent < 60, `percentuale strana: ${next.percent}`);
  });

  await t.test('quando ci si puo\' permettere qualcosa, punta al prossimo', () => {
    const prezzi = [...new Set(CATALOG.map((i) => i.price))].sort((a, b) => a - b);
    const next = nextUnlock(ricco(prezzi[0]));
    assert.ok(next);
    assert.ok(next.item.price > prezzi[0], 'deve indicare qualcosa che non hai ancora');
  });

  await t.test('non propone quello che si possiede gia\'', () => {
    const tema = CATALOG.find((i) => i.kind === 'theme')!;
    const comprato = buy(ricco(5000), tema.id, 0);
    assert.ok('wallet' in comprato);
    const next = nextUnlock(comprato.wallet);
    assert.ok(next);
    assert.notEqual(next.item.id, tema.id);
  });

  await t.test('il gettone resta sempre proponibile: si consuma', () => {
    // Comprato tutto il comprabile una volta sola, resta il consumabile
    let w = ricco(100000);
    for (const item of CATALOG.filter((i) => i.kind !== 'token')) {
      const esito = buy(w, item.id, 0);
      if ('wallet' in esito) w = esito.wallet;
    }
    const next = nextUnlock(w);
    assert.ok(next, 'non deve restare senza obiettivi');
    assert.equal(next.item.kind, 'token');
  });
});

test('il ritmo del negozio', async (t) => {
  // Una giornata perfetta: le tre missioni, il premio del gruppo, la meta' del
  // boss e il boss abbattuto. Le imprese non contano: sono dodici in tutto e
  // finiscono.
  const giornataPiena =
    missionCoins(MISSIONS_PER_DAY, MISSIONS_PER_DAY, MISSIONS_PER_DAY) +
    COINS_HALFWAY +
    COINS_PER_BOSS;

  await t.test('una giornata perfetta paga trentacinque monete', () => {
    // Il numero e' una scelta, non un caso: alzarlo accorcia tutto il gioco.
    assert.equal(giornataPiena, 35);
  });

  await t.test('il primo acquisto costa piu' + ' di una settimana', () => {
    // Poter comprare il secondo giorno svuoterebbe il negozio prima che il
    // ripasso diventi un'abitudine, ed e' l'abitudine il punto.
    const piuEconomico = Math.min(...CATALOG.map((i) => i.price));
    assert.ok(
      piuEconomico / giornataPiena >= 7,
      `il pezzo piu' economico costa ${(piuEconomico / giornataPiena).toFixed(1)} giornate piene`
    );
  });

  await t.test('il catalogo intero non si esaurisce in un mese', () => {
    const tutto = CATALOG.filter((i) => i.kind !== 'token').reduce((n, i) => n + i.price, 0);
    assert.ok(
      tutto / giornataPiena >= 90,
      `tutto il catalogo costa ${Math.round(tutto / giornataPiena)} giornate piene`
    );
  });

  await t.test('abbattere il boss non vale meno di una missione', () => {
    // E' il gesto che chiude la giornata: pagarlo meno di un obiettivo
    // qualsiasi direbbe che conta meno, e non e' vero.
    assert.ok(COINS_PER_BOSS >= COINS_PER_MISSION);
  });
});
