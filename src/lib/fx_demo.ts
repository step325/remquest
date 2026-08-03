/**
 * Sequenza finta di effetti, per guardarli senza ripassare cinquanta card.
 *
 * Scrive sullo stesso canale del motore, quindi l'HUD non sa che e' una prova:
 * quello che si vede qui e' esattamente quello che si vedra' studiando. Non
 * tocca XP, streak ne' boss — solo gli effetti a schermo.
 */

import type { RNPlugin } from '@remnote/plugin-sdk';
import { type FxKind, pushFx } from './fx';
import { readFx, writeFx } from './storage';

/** Un passo della sceneggiatura: effetto, XP, danno, attesa, testo */
type Beat = [kind: FxKind, amount: number, damage: number, waitMs: number, label?: string];

/**
 * I colpi sono fitti di proposito: servono a far salire la combo fino allo
 * scaglione piu' alto, che e' la cosa piu' difficile da vedere per caso.
 *
 * XP e danno seguono le coppie vere delle regole (5/3, 8/5, 10/7) e i critici
 * raddoppiano solo il danno: una prova che mostrasse numeri inventati non
 * direbbe niente su come si vedra' studiando.
 */
const SCRIPT: Beat[] = [
  ['hit', 5, 3, 380],
  ['hit', 8, 5, 360],
  ['crit', 25, 14, 700, 'prima vittoria'],
  ['hit', 8, 5, 340],
  ['hit', 10, 7, 340],
  ['hit', 5, 3, 320],
  ['hit', 8, 5, 320],
  ['crit', 10, 14, 800],
  ['hit', 10, 7, 300],
  ['hit', 8, 5, 300],
  ['hit', 5, 3, 300],
  ['hit', 8, 5, 300],
  ['hit', 10, 7, 600],
  // Una card dimenticata in mezzo alla serie: il contatore torna a zero
  ['miss', 0, 0, 900],
  ['hit', 8, 5, 320],
  ['hit', 10, 7, 600],
  ['halfway', 15, 308, 1100],
  ['streak', 12, 0, 900],
  ['levelup', 8, 0, 1200, 'Leggenda'],
  ['bossdown', 0, 615, 0],
];

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function playFxDemo(plugin: RNPlugin): Promise<void> {
  for (const [kind, amount, damage, waitMs, label] of SCRIPT) {
    const fx = await readFx(plugin);
    await writeFx(plugin, pushFx(fx, { kind, amount, damage, label }, Date.now()));
    if (waitMs > 0) await wait(waitMs);
  }
}
