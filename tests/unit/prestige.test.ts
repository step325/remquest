import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PRESTIGE_LEVELS, prestigeFor, prestigeLabel } from '../../src/lib/prestige';
import { translator } from '../../src/lib/i18n/index';
import { levelFromXp, xpForLevel } from '../../src/lib/levels';

const it = translator('it');
const en = translator('en');

test('PRESTIGE_LEVELS', async (t) => {
  await t.test('sono in ordine crescente e senza doppioni', () => {
    // Una soglia fuori ordine farebbe scendere il grado salendo di livello.
    for (let i = 1; i < PRESTIGE_LEVELS.length; i++) {
      assert.ok(PRESTIGE_LEVELS[i] > PRESTIGE_LEVELS[i - 1], `soglia ${i} non cresce`);
    }
  });

  await t.test('la prima non e\' raggiungibile per caso', () => {
    // Un grado che arriva la prima settimana non dice niente a nessuno: la
    // soglia deve costare piu' di una giornata buona.
    assert.ok(xpForLevel(PRESTIGE_LEVELS[0]) >= 2_000);
  });
});

test('prestigeFor', async (t) => {
  await t.test('sotto la prima soglia non c\'e\' niente', () => {
    for (const level of [1, 2, 5, PRESTIGE_LEVELS[0] - 1]) {
      const p = prestigeFor(level);
      assert.equal(p.rank, 0);
      assert.equal(p.className, '');
      assert.equal(p.since, 0);
    }
  });

  await t.test('ogni soglia alza il grado di uno', () => {
    PRESTIGE_LEVELS.forEach((soglia, i) => {
      assert.equal(prestigeFor(soglia).rank, i + 1, `livello ${soglia}`);
    });
  });

  await t.test('il grado non scende mai salendo di livello', () => {
    let precedente = 0;
    for (let level = 1; level <= 60; level++) {
      const rank = prestigeFor(level).rank;
      assert.ok(rank >= precedente, `il grado e' sceso al livello ${level}`);
      precedente = rank;
    }
  });

  await t.test('oltre l\'ultima soglia resta all\'ultimo grado', () => {
    const ultimo = PRESTIGE_LEVELS.length;
    for (const level of [PRESTIGE_LEVELS.at(-1)!, 99, 500]) {
      assert.equal(prestigeFor(level).rank, ultimo);
    }
  });

  await t.test('`since` dice da che livello arriva il grado', () => {
    assert.equal(prestigeFor(PRESTIGE_LEVELS[1] + 3).since, PRESTIGE_LEVELS[1]);
    assert.equal(prestigeFor(999).since, PRESTIGE_LEVELS.at(-1));
  });

  await t.test('un livello impossibile non fa cadere niente', () => {
    // Il livello arriva da `levelFromXp` su XP letti dallo storage: se li' e'
    // rimasta roba rovinata, qui deve uscire "nessuna decorazione".
    for (const roba of [0, -7, Number.NaN, Number.POSITIVE_INFINITY, undefined as never]) {
      const p = prestigeFor(roba as number);
      assert.ok(p.rank === 0 || p.rank === PRESTIGE_LEVELS.length);
      if (p.rank === 0) assert.equal(p.className, '');
    }
  });

  await t.test('la classe e\' una sola e porta il grado', () => {
    for (let i = 0; i < PRESTIGE_LEVELS.length; i++) {
      const p = prestigeFor(PRESTIGE_LEVELS[i]);
      assert.equal(p.className, `rq-prestige-${i + 1}`);
    }
  });
});

test('prestigeLabel', async (t) => {
  await t.test('a grado zero non dice niente', () => {
    assert.equal(prestigeLabel(it, prestigeFor(1)), null);
  });

  await t.test('dice grado e livello di sblocco, in entrambe le lingue', () => {
    const p = prestigeFor(PRESTIGE_LEVELS[1]);
    for (const tr of [it, en]) {
      const testo = prestigeLabel(tr, p)!;
      assert.ok(testo.includes('2'), testo);
      assert.ok(testo.includes(String(PRESTIGE_LEVELS[1])), testo);
      assert.ok(!testo.includes('{'), `segnaposto non riempito: ${testo}`);
    }
  });
});

test('le decorazioni', async (t) => {
  const css = readFileSync('src/styles/panel_prestige.css', 'utf8');

  await t.test('ogni grado ha il suo stile nel foglio', () => {
    // Un grado senza regole CSS e' un premio che non si vede: si sblocca e non
    // cambia niente a schermo.
    for (let i = 1; i <= PRESTIGE_LEVELS.length; i++) {
      assert.ok(css.includes(`.rq-prestige-${i}`), `manca lo stile per il grado ${i}`);
    }
  });

  await t.test('non toccano nessun numero del gioco', () => {
    // Il prestigio e' solo aspetto: se un giorno qualcuno gli attaccasse un
    // moltiplicatore, il modulo dovrebbe esportarlo — e questo test cade.
    const modulo = readFileSync('src/lib/prestige.ts', 'utf8');
    for (const parola of ['xp', 'damage', 'danno', 'coin', 'monet', 'bonus', 'multip']) {
      assert.ok(
        !new RegExp(`export[^\\n]*${parola}`, 'i').test(modulo),
        `il prestigio esporta qualcosa che sa di "${parola}"`
      );
    }
  });
});

test('il ritmo dei gradi', async (t) => {
  await t.test('le soglie stanno dentro una vita di ripasso', () => {
    // Trecento card al giorno per un anno: se l'ultimo grado sta oltre, non lo
    // vedra' nessuno e tanto valeva non disegnarlo.
    const annoAlacre = 300 * 7 * 365;
    assert.ok(levelFromXp(annoAlacre) > PRESTIGE_LEVELS.at(-1)!);
  });
});
