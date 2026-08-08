import test from 'node:test';
import assert from 'node:assert/strict';
import { translator } from '../../src/lib/i18n/index';

/** Le frasi in italiano: i test guardano il testo, non la chiave */
const tr = translator('it');
import {
  parseExamDate,
  daysUntil,
  upcomingExams,
  countdownLabel,
  type Exam,
} from '../../src/lib/exams';

const exam = (name: string, daysLeft: number | null): Exam => ({
  name,
  dateText: name,
  daysLeft,
});

test('parseExamDate', async (t) => {
  await t.test('formato ISO', () => {
    assert.deepEqual(parseExamDate('2026-08-14'), new Date(2026, 7, 14));
  });

  await t.test('titolo del documento giornaliero in inglese', () => {
    assert.deepEqual(parseExamDate('August 14th, 2026'), new Date(2026, 7, 14));
    assert.deepEqual(parseExamDate('September 1st, 2026'), new Date(2026, 8, 1));
  });

  await t.test('titolo in italiano', () => {
    assert.deepEqual(parseExamDate('14 agosto 2026'), new Date(2026, 7, 14));
    assert.deepEqual(parseExamDate('1 Dicembre 2026'), new Date(2026, 11, 1));
  });

  await t.test('null se la data non si capisce, senza lanciare', () => {
    for (const bad of ['', '   ', 'prossima settimana', 'agosto', '2026']) {
      assert.equal(parseExamDate(bad), null);
    }
  });
});

test('daysUntil', async (t) => {
  const now = new Date(2026, 7, 1, 23, 30); // tarda sera

  await t.test("l'ora del giorno non sposta il conteggio", () => {
    assert.equal(daysUntil(new Date(2026, 7, 1, 0, 5), now), 0);
    assert.equal(daysUntil(new Date(2026, 7, 2, 0, 5), now), 1);
  });

  await t.test('date passate danno numeri negativi', () => {
    assert.equal(daysUntil(new Date(2026, 6, 30), now), -2);
  });

  await t.test('attraverso il cambio di mese e di anno', () => {
    assert.equal(daysUntil(new Date(2026, 8, 1), now), 31);
    assert.equal(daysUntil(new Date(2027, 0, 1), now), 153);
  });
});

test('upcomingExams', async (t) => {
  await t.test('ordina dal piu' + " vicino e scarta quelli passati", () => {
    const list = [exam('lontano', 30), exam('passato', -1), exam('vicino', 2)];
    assert.deepEqual(
      upcomingExams(list).map((e) => e.name),
      ['vicino', 'lontano']
    );
  });

  await t.test("l'esame di oggi resta in lista", () => {
    assert.equal(upcomingExams([exam('oggi', 0)]).length, 1);
  });

  await t.test('le date illeggibili si mostrano comunque, in fondo', () => {
    const list = [exam('illeggibile', null), exam('domani', 1)];
    assert.deepEqual(
      upcomingExams(list).map((e) => e.name),
      ['domani', 'illeggibile']
    );
  });
});

test('countdownLabel', async (t) => {
  await t.test('casi vicini scritti a parole', () => {
    assert.equal(countdownLabel(tr, 0), 'oggi');
    assert.equal(countdownLabel(tr, 1), 'domani');
    assert.equal(countdownLabel(tr, 9), 'tra 9 giorni');
  });

  await t.test('data non interpretata', () => {
    assert.equal(countdownLabel(tr, null), 'data da controllare');
  });
});


test('parseExamDate con timestamp UTC', async (t) => {
  await t.test('il formato che usa RemNote non slitta di un giorno', () => {
    // 22:00 UTC del 31 agosto e' gia' il 1 settembre in Italia
    const parsed = parseExamDate('2026-08-31T22:00:00.000Z');
    assert.notEqual(parsed, null);
    assert.equal(parsed!.getTime(), Date.parse('2026-08-31T22:00:00.000Z'));
  });

  await t.test('timestamp non valido non passa per buono', () => {
    assert.equal(parseExamDate('2026-13-45T99:00:00.000Z'), null);
  });
});
