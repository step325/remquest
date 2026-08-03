import test from 'node:test';
import assert from 'node:assert/strict';
import { EN } from '../../src/lib/i18n/en';
import { IT } from '../../src/lib/i18n/it';
import { LANGS, normalizeLang, t } from '../../src/lib/i18n/index';

test('i due dizionari', async (t2) => {
  await t2.test('hanno le stesse chiavi', () => {
    // Una chiave che esiste solo di qua lascia un buco: chi ha l'altra lingua
    // vedrebbe comparire il nome della chiave al posto di una frase.
    assert.deepEqual(Object.keys(IT).sort(), Object.keys(EN).sort());
  });

  await t2.test('non hanno frasi vuote', () => {
    for (const [lang, dict] of [['it', IT], ['en', EN]] as const) {
      for (const [key, value] of Object.entries(dict)) {
        assert.ok(value.trim().length > 0, `${lang}.${key} e' vuota`);
      }
    }
  });

  await t2.test('usano gli stessi segnaposto', () => {
    // Se la frase italiana dice {n} e quella inglese {count}, il numero
    // sparisce solo in una delle due lingue — ed e' il tipo di errore che si
    // scopre mesi dopo.
    const buchi = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort().join(',');
    for (const key of Object.keys(IT) as (keyof typeof IT)[]) {
      assert.equal(buchi(IT[key]), buchi(EN[key]), `${String(key)}: segnaposto diversi`);
    }
  });
});

test('t', async (t2) => {
  await t2.test('restituisce la frase della lingua chiesta', () => {
    assert.equal(t('it', 'tab.diario'), IT['tab.diario']);
    assert.equal(t('en', 'tab.diario'), EN['tab.diario']);
  });

  await t2.test('riempie i segnaposto', () => {
    assert.equal(t('it', 'panel.level', { n: 5 }), 'Livello 5');
    assert.equal(t('en', 'panel.level', { n: 5 }), 'Level 5');
  });

  await t2.test('un segnaposto senza valore resta com\'e\'', () => {
    // Meglio un `{n}` a schermo che una frase mutilata: si vede subito, e si
    // capisce cosa manca.
    assert.ok(t('it', 'panel.level').includes('{n}'));
  });

  await t2.test('una chiave sconosciuta non fa cadere niente', () => {
    assert.equal(t('it', 'chiave.che.non.esiste' as never), 'chiave.che.non.esiste');
  });
});

test('normalizeLang', async (t2) => {
  await t2.test('accetta le lingue che esistono', () => {
    for (const lang of LANGS) assert.equal(normalizeLang(lang), lang);
  });

  await t2.test('qualunque altra cosa diventa italiano', () => {
    // Il valore arriva dalle impostazioni e dallo storage: se e' rimasto un
    // vecchio codice o un `undefined`, si mostra la lingua di casa invece di
    // niente.
    for (const roba of [undefined, null, '', 'de', 42, {}]) {
      assert.equal(normalizeLang(roba), 'it');
    }
  });
});
