import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseRamp, rampColor } from '../../src/lib/sprite_ramp';

const DMG = ['#0f380f', '#306230', '#8bac0f', '#9bbc0f'];

test('parseRamp', async (t) => {
  await t.test('senza rampa non c\'e\' niente da applicare', () => {
    // I temi che non la dichiarano tengono gli sprite come sono disegnati.
    assert.deepEqual(parseRamp(''), []);
    assert.deepEqual(parseRamp('   '), []);
  });

  await t.test('legge una lista di colori separati da spazi', () => {
    assert.deepEqual(parseRamp(' #0f380f  #306230 #8bac0f #9bbc0f '), DMG);
  });

  await t.test('scarta quello che non e\' un colore', () => {
    // La variabile arriva dal CSS: un valore storto non deve tingere di nero
    // mezzo sprite.
    assert.deepEqual(parseRamp('#0f380f rosso #9bbc0f'), ['#0f380f', '#9bbc0f']);
  });
});

test('rampColor', async (t) => {
  await t.test('senza rampa restituisce il colore di partenza', () => {
    assert.equal(rampColor('#4fc3f7', []), '#4fc3f7');
  });

  await t.test('il nero va in fondo alla rampa e il bianco in cima', () => {
    assert.equal(rampColor('#000000', DMG), DMG[0]);
    assert.equal(rampColor('#ffffff', DMG), DMG[DMG.length - 1]);
  });

  await t.test('conserva l\'ordine di luminosita\'', () => {
    // E' l'unica cosa che tiene in piedi la sagoma: se due toni vicini si
    // invertissero, il contorno finirebbe piu' chiaro del corpo.
    const chiaro = rampColor('#e8ecf5', DMG);
    const medio = rampColor('#8794b8', DMG);
    const scuro = rampColor('#17203a', DMG);
    assert.ok(DMG.indexOf(chiaro) >= DMG.indexOf(medio), 'il chiaro non puo\' finire sotto il medio');
    assert.ok(DMG.indexOf(medio) >= DMG.indexOf(scuro), 'il medio non puo\' finire sotto lo scuro');
  });

  await t.test('due colori diversi ma di pari luce finiscono insieme', () => {
    // Quattro toni non possono distinguere un rosso da un blu: e' il punto di
    // uno schermo a quattro toni.
    assert.equal(rampColor('#d1344a', DMG), rampColor('#3a4fd1', DMG));
  });

  await t.test('un colore illeggibile non cambia niente', () => {
    assert.equal(rampColor('roba', DMG), 'roba');
  });
});

test('la rampa del Game Boy', async (t) => {
  const css = readFileSync('src/styles/themes.css', 'utf8');

  await t.test('e\' dichiarata solo dal tema che non puo\' avere colori', () => {
    // Un tema a colori mostra i mostri come sono disegnati: appiattirli
    // sarebbe una perdita secca. Il DMG invece i colori non li aveva.
    const dichiarazioni = css.match(/--px-sprite-ramp:/g) ?? [];
    assert.equal(dichiarazioni.length, 1, 'la rampa deve restare un\'eccezione');
    const blocco = css.slice(css.indexOf('.px.theme-gameboy {'));
    assert.ok(blocco.slice(0, blocco.indexOf('}')).includes('--px-sprite-ramp:'));
  });

  await t.test('sono i quattro toni veri del DMG', () => {
    const riga = css.match(/--px-sprite-ramp:([^;]+);/)![1];
    assert.deepEqual(parseRamp(riga), DMG);
  });
});
