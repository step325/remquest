/**
 * Compagni: gli sprite che ti accompagnano nell'HUD.
 *
 * Occupano meno spazio dei mostri dentro lo stesso riquadro da sedici, perche'
 * devono leggersi come piccoli anche quando stanno accanto a un drago. E hanno
 * un'aria diversa: i mostri minacciano, questi fanno compagnia — testa grande,
 * occhi grandi, tre tinte per dare volume invece di una campitura piatta.
 *
 * Sono decorativi e basta — nessun bonus, per la stessa ragione per cui il
 * negozio non vende potenziamenti (vedi src/lib/wallet.ts).
 */

import { type Sprite, sprite } from './monsters/sprite';
import { POSES } from './companion_poses';


/** Tomo aperto: pagine spiegate, dorso dorato e scintille */
export const TOME = sprite([
  '.....7....7.....',
  '.......7........',
  '..0000....0000..',
  '.066660..066660.',
  '.06666600666660.',
  '.06655600665560.',
  '.06666600666660.',
  '.06655600665560.',
  '.06666600666660.',
  '.06655600665560.',
  '.08666600666680.',
  '.08888800888880.',
  '..0888800888800.',
  '...00000000000..',
  '......7....7....',
  '................',
]);

/** Gattino: occhi col riflesso, guance rosa e bocca a w */
export const CAT = sprite([
  '................',
  '..00........00..',
  '.0ea0......0ae0.',
  '.0eea0....0aee0.',
  '.0eeee0000eeee0.',
  '.0eeeeeeeeeeee0.',
  '0eeeeeeeeeeeeee0',
  '0ee00eeeeee00ee0',
  '0ee06eeeeee06ee0',
  '0eeeeee00eeeeee0',
  '0e9ee0e00e0ee9e0',
  '0e9eeeeeeeeee9e0',
  '.0eeeeeeeeeee0e0',
  '.0ee00eeee00ee0e',
  '..0eeeeeeeeee0e0',
  '...00000000000..',
]);

/** Gufo: piume, becco dorato e sguardo fisso */
export const OWL = sprite([
  '................',
  '...00......00...',
  '..0880....0880..',
  '..088888888880..',
  '.08888888888880.',
  '.08666088806668.',
  '.08606088806068.',
  '.08666088806668.',
  '.08888877888880.',
  '.08887777778880.',
  '.08888788878880.',
  '..088888888880..',
  '..0880888808800.',
  '...0888888880...',
  '....07700770....',
  '.....00..00.....',
]);

/** Cucciolo di drago: corna in cima, alucce ai fianchi */
export const DRAGONLING = sprite([
  '................',
  '....0......0....',
  '...0b0....0b0...',
  '...0b0....0b0...',
  '..0bb000000bb0..',
  '.0bbbbbbbbbbbb0.',
  '.0bb66bbbb66bb0.',
  '.0bb06bbbb06bb0.',
  '0b0bbbbbbbbbbb0b',
  '0bb0bb5555bb0bb0',
  '0b0b55555555b0b0',
  '.0b055055055b0..',
  '..0b55555555b0..',
  '..0bb555555bb0..',
  '...0bb0000bb0...',
  '....00....00....',
]);

/** Fantasmino: guance rosa e coda frastagliata */
export const GHOSTLING = sprite([
  '................',
  '................',
  '......0000......',
  '....0066666600..',
  '...06666666600..',
  '..0666666666660.',
  '..0660066006660.',
  '..0600060006060.',
  '..0660066006660.',
  '..0966666666960.',
  '..0966666666960.',
  '..0666666666660.',
  '..0666666666660.',
  '..0606606606060.',
  '...0.0.0.0.0.0..',
  '................',
]);

/** Golem tascabile: crepe e ciuffo di muschio */
export const GOLEM_PET = sprite([
  '................',
  '.....bb..bb.....',
  '....0bb00bb0....',
  '...0444444440...',
  '...0444444440...',
  '...04dd44dd40...',
  '...04dd44dd40...',
  '...0444444440...',
  '...0440440440...',
  '...0444444440...',
  '..004444444400..',
  '.04404444440440.',
  '.04404444440440.',
  '..000444444000..',
  '....0440.0440...',
  '....000...000...',
]);

/** Spiritello di fuoco: fiamma a punta e nucleo chiaro */
export const FIRE_SPIRIT = sprite([
  '................',
  '.......0........',
  '......0e0.......',
  '.....0ee0.......',
  '....0eee0.......',
  '...0ee7ee0......',
  '..0ee777ee0.....',
  '..0e77777e0.....',
  '.0e7766777e0....',
  '.0e7606077e0....',
  '.0e7766777e0....',
  '.0e77777777e0...',
  '.0ee7777777e0...',
  '..0eee777ee0....',
  '...00eeeee00....',
  '.....00000......',
]);

/** Melmina azzurra: riflesso in alto e occhioni */
export const SLIME_BLUE = sprite([
  '................',
  '................',
  '................',
  '.......000......',
  '......06ddd0....',
  '.....0d6dddd0...',
  '....0dd6ddddd0..',
  '....0dddddddd0..',
  '...0dd66dd66dd0.',
  '...0dd06dd06dd0.',
  '..0dd66dd66dddd0',
  '..0dddddddddddd0',
  '.0dddddddddddd30',
  '.0ddddddddddd330',
  '.00333333333300.',
  '................',
]);

/** Zeta del sonno: accompagna il compagno assopito */
export const ZZZ = sprite([
  '................',
  '..000000........',
  '..077770........',
  '.....070........',
  '....070.........',
  '...070..........',
  '..077770........',
  '..000000........',
  '........0000....',
  '........0770....',
  '.........70.....',
  '........70......',
  '........0770....',
  '........0000....',
  '................',
  '................',
]);

/** Stelline della festa: quando la giornata e' andata bene */
export const CHEER = sprite([
  '....7....7......',
  '...070..070.....',
  '..07770.7770....',
  '...070..070.....',
  '....7....7......',
  '................',
  '.......7........',
  '......070.......',
  '.....07770......',
  '......070.......',
  '.......7........',
  '................',
  '....7......7....',
  '...070....070...',
  '....7......7....',
  '................',
]);

export const COMPANIONS: readonly { id: string; sprite: Sprite }[] = [
  { id: 'pet:tome', sprite: TOME },
  { id: 'pet:cat', sprite: CAT },
  { id: 'pet:owl', sprite: OWL },
  { id: 'pet:dragonling', sprite: DRAGONLING },
  { id: 'pet:ghostling', sprite: GHOSTLING },
  { id: 'pet:golem', sprite: GOLEM_PET },
  { id: 'pet:fire', sprite: FIRE_SPIRIT },
  { id: 'pet:slime', sprite: SLIME_BLUE },
];

/**
 * Lo sprite di un compagno nella posa richiesta.
 *
 * Senza umore restituisce la posa normale: la usa il negozio, dove il
 * compagno sta in vetrina e non ha ancora una giornata alle spalle.
 */
export function companionSprite(id: string, mood: 'asleep' | 'idle' | 'happy' = 'idle'): Sprite | null {
  const base = COMPANIONS.find((c) => c.id === id)?.sprite ?? null;
  if (!base || mood === 'idle') return base;
  return POSES[id]?.[mood] ?? base;
}
