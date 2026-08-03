import test from 'node:test';
import assert from 'node:assert/strict';
import { AUTO_LANG, langFromLocale, resolveLang } from '../../src/lib/i18n/index';

test('langFromLocale', async (t) => {
  await t.test('italiano per chi ha l\'app in italiano', () => {
    for (const codice of ['it', 'it-IT', 'it-CH', 'IT']) {
      assert.equal(langFromLocale(codice), 'it');
    }
  });

  await t.test('inglese per tutti gli altri', () => {
    // Le lingue tradotte sono due: chi ha l'app in tedesco o in giapponese sta
    // meglio con l'inglese che con l'italiano.
    for (const codice of ['en', 'en-GB', 'de', 'fr-CA', 'ja', 'pt-BR']) {
      assert.equal(langFromLocale(codice), 'en');
    }
  });

  await t.test('senza codice si resta in italiano', () => {
    // E' la lingua in cui il gioco e' scritto: se non si sa niente, meglio
    // quella che una scelta a caso.
    for (const niente of [undefined, '', '   ']) {
      assert.equal(langFromLocale(niente), 'it');
    }
  });
});

test('resolveLang', async (t) => {
  await t.test('la scelta dell\'utente vince sempre', () => {
    assert.equal(resolveLang('en', 'it-IT'), 'en');
    assert.equal(resolveLang('it', 'en-US'), 'it');
  });

  await t.test('senza scelta si segue l\'app', () => {
    assert.equal(resolveLang(AUTO_LANG, 'en-US'), 'en');
    assert.equal(resolveLang(AUTO_LANG, 'it-IT'), 'it');
  });

  await t.test('un valore vecchio o storto non blocca il rilevamento', () => {
    // Nello storage puo' esserci rimasto un codice di una versione passata:
    // meglio tornare a seguire l'app che mostrare una lingua a caso.
    for (const roba of [undefined, null, '', 'de', 42]) {
      assert.equal(resolveLang(roba, 'en-GB'), 'en');
    }
  });
});
