/**
 * Le pose dei compagni: come stanno quando dormono e quando festeggiano.
 *
 * A sedici pixel una posa si legge da tre cose sole — dove stanno gli occhi,
 * quanto e' schiacciato il corpo, cosa spunta dalla sagoma. Il resto sparisce
 * dentro il contorno, quindi le varianti cambiano quelle e basta invece di
 * ridisegnare la creatura da capo.
 *
 * Chi dorme ha gli occhi chiusi e sta piu' basso; chi festeggia ha gli occhi
 * all'insu' e qualcosa di alzato.
 */

import { type Sprite, sprite } from './monsters/sprite';


/** Tomo assopito: pagine socchiuse */
export const TOME_SLEEP = sprite([
  '................',
  '................',
  '................',
  '..0000....0000..',
  '.066660..066660.',
  '.06666600666660.',
  '.06655600665560.',
  '.06666600666660.',
  '.06655600665560.',
  '.08666600666680.',
  '.08888800888880.',
  '..0888800888800.',
  '...00000000000..',
  '................',
  '................',
  '................',
]);

/** Tomo esultante: pagine spalancate e scintille */
export const TOME_HAPPY = sprite([
  '..7.........7...',
  '.....7....7.....',
  '.0000......0000.',
  '0666600000666600',
  '06666606666660..',
  '06655606666560..',
  '06666606666660..',
  '06655606666560..',
  '06666606666660..',
  '08666606666680..',
  '08888808888880..',
  '.0888800888800..',
  '..000000000000..',
  '.......7........',
  '....7......7....',
  '................',
]);

/** Gattino accucciato: occhi chiusi e muso sul cuscino */
export const CAT_SLEEP = sprite([
  '................',
  '................',
  '..00........00..',
  '.0ea0......0ae0.',
  '.0eea0....0aee0.',
  '.0eeee0000eeee0.',
  '0eeeeeeeeeeeeee0',
  '0ee00eeeeee00ee0',
  '0eeeeeeeeeeeeee0',
  '0eeeeee00eeeeee0',
  '0e9eeeeeeeeee9e0',
  '0eeeeeeeeeeeeee0',
  '0eeeeeeeeeeeee0e',
  '0ee00eeee00eee0e',
  '.0eeeeeeeeeee0e0',
  '..000000000000..',
]);

/** Gattino contento: occhi stretti e coda ritta */
export const CAT_HAPPY = sprite([
  '................',
  '..00........00..',
  '.0ea0......0ae0.',
  '.0eea0....0aee0.',
  '.0eeee0000eeee0.',
  '.0eeeeeeeeeeee0.',
  '0eeeeeeeeeeeeee0',
  '0e0e0eeeee0e0ee0',
  '0ee0eeeeeee0eee0',
  '0eeeeee00eeeeee0',
  '0e9ee0e00e0ee9e0',
  '0e9eeeeeeeeee9e0',
  '.0eeeeeeeeeee0e0',
  '.0ee00eeee00ee0e',
  '..0eeeeeeeeee0e0',
  '...00000000000..',
]);

/** Gufo assopito: palpebre abbassate */
export const OWL_SLEEP = sprite([
  '................',
  '...00......00...',
  '..0880....0880..',
  '..088888888880..',
  '.08888888888880.',
  '.08000088800008.',
  '.08888888888880.',
  '.08888888888880.',
  '.08888877888880.',
  '.08887777778880.',
  '.08888788878880.',
  '..088888888880..',
  '..0880888808800.',
  '...0888888880...',
  '....07700770....',
  '.....00..00.....',
]);

/** Gufo esultante: ali spiegate */
export const OWL_HAPPY = sprite([
  '................',
  '...00......00...',
  '.08800....008800',
  '.08888888888880.',
  '0888888888888880',
  '0806660888066680',
  '0806660888066680',
  '0888888778888880',
  '.08887777778880.',
  '.08888788878880.',
  '..088888888880..',
  '..0880888808800.',
  '...0888888880...',
  '....07700770....',
  '.....00..00.....',
  '................',
]);

/** Draghetto raggomitolato */
export const DRAGONLING_SLEEP = sprite([
  '................',
  '................',
  '....0......0....',
  '...0b0....0b0...',
  '..0bb000000bb0..',
  '.0bbbbbbbbbbbb0.',
  '.0bbbbbbbbbbbb0.',
  '.0bb00bbbb00bb0.',
  '.0bbbbbbbbbbbb0.',
  '.0bbb500005bbb0.',
  '..0b55555555b0..',
  '..0b55555555b0..',
  '..0bb555555bb0..',
  '...0bb0000bb0...',
  '....00....00....',
  '................',
]);

/** Draghetto festoso: alucce alzate */
export const DRAGONLING_HAPPY = sprite([
  '.0..........0...',
  '.0b0......0b0...',
  '.0bb0....0bb0...',
  '..0b0....0b0....',
  '..0bb000000bb0..',
  '.0bbbbbbbbbbbb0.',
  '.0bb0bbbbbb0bb0.',
  '.0bbbbbbbbbbbb0.',
  '0b0bbbbbbbbbbb0b',
  '0bb0bb5555bb0bb0',
  '0b0b55555555b0b0',
  '.0b055055055b0..',
  '..0b55555555b0..',
  '..0bb555555bb0..',
  '...0bb0000bb0...',
  '....00....00....',
]);

/** Fantasmino assopito */
export const GHOSTLING_SLEEP = sprite([
  '................',
  '................',
  '......0000......',
  '....0066666600..',
  '...06666666600..',
  '..0666666666660.',
  '..0600060006060.',
  '..0666666666660.',
  '..0666666666660.',
  '..0966666666960.',
  '..0966666666960.',
  '..0666666666660.',
  '..0666666666660.',
  '..0606606606060.',
  '...0.0.0.0.0.0..',
  '................',
]);

/** Fantasmino esultante: braccine alzate */
export const GHOSTLING_HAPPY = sprite([
  '................',
  '..00........00..',
  '..0600000000060.',
  '..0666666666660.',
  '..0666666666660.',
  '..0666666666660.',
  '..0606606606660.',
  '..0666666666660.',
  '..0966666666960.',
  '..0966666666960.',
  '..0666666666660.',
  '..0666666666660.',
  '..0666666666660.',
  '..0606606606060.',
  '...0.0.0.0.0.0..',
  '................',
]);

/** Golem spento: occhi chiusi */
export const GOLEM_PET_SLEEP = sprite([
  '................',
  '.....bb..bb.....',
  '....0bb00bb0....',
  '...0444444440...',
  '...0444444440...',
  '...0400440040...',
  '...0444444440...',
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

/** Golem contento: muschio in fiore */
export const GOLEM_PET_HAPPY = sprite([
  '....b....b......',
  '...bbb..bbb.....',
  '....0bb00bb0....',
  '...0444444440...',
  '...0444444440...',
  '...04dd44dd40...',
  '...04dd44dd40...',
  '...0444444440...',
  '...0446446440...',
  '...0444444440...',
  '..004444444400..',
  '.04404444440440.',
  '.04404444440440.',
  '..000444444000..',
  '....0440.0440...',
  '....000...000...',
]);

/** Fiammella bassa: quasi assopita */
export const FIRE_SPIRIT_SLEEP = sprite([
  '................',
  '................',
  '................',
  '.......0........',
  '......0e0.......',
  '.....0ee0.......',
  '....0eee0.......',
  '...0ee777ee0....',
  '..0e7700077e0...',
  '..0e77777770....',
  '..0e77777777e0..',
  '..0ee7777777e0..',
  '...0eee777ee0...',
  '....00eeeee00...',
  '......00000.....',
  '................',
]);

/** Fiammella alta: guizza in su */
export const FIRE_SPIRIT_HAPPY = sprite([
  '.......0........',
  '......0e0.......',
  '.....0ee0.......',
  '.....0ee0.......',
  '....0eee0.......',
  '...0ee7ee0......',
  '..0ee777ee0.....',
  '..0e77777e0.....',
  '.0e7606077e0....',
  '.0e7766777e0....',
  '.0e77777777e0...',
  '.0ee7777777e0...',
  '..0eee777ee0....',
  '...00eeeee00....',
  '.....00000......',
  '................',
]);

/** Melmina appisolata: bassa e larga */
export const SLIME_BLUE_SLEEP = sprite([
  '................',
  '................',
  '................',
  '................',
  '................',
  '......0dddd0....',
  '....0dddddddd0..',
  '....0dd0dd0dd0..',
  '...0dddddddddd0.',
  '...0dddddddddd0.',
  '..0dddddddddddd0',
  '..0dddddddddddd0',
  '.0dddddddddddd30',
  '.0ddddddddddd330',
  '.00333333333300.',
  '................',
]);

/** Melmina in salto: alta e stretta */
export const SLIME_BLUE_HAPPY = sprite([
  '................',
  '.......000......',
  '......06ddd0....',
  '.....0d6dddd0...',
  '.....0dd6ddd0...',
  '....0dddddddd0..',
  '....0dd66dd60...',
  '....0dd06dd00...',
  '....0dd66dd60...',
  '....0dddddddd0..',
  '...0dddddddddd0.',
  '...0dddddddddd0.',
  '..0dddddddddddd0',
  '..0ddddddddddd30',
  '..003333333330..',
  '................',
]);

/** Le due varianti di ogni compagno, per identificativo */
export const POSES: Readonly<Record<string, { asleep: Sprite; happy: Sprite }>> = {
  'pet:tome': { asleep: TOME_SLEEP, happy: TOME_HAPPY },
  'pet:cat': { asleep: CAT_SLEEP, happy: CAT_HAPPY },
  'pet:owl': { asleep: OWL_SLEEP, happy: OWL_HAPPY },
  'pet:dragonling': { asleep: DRAGONLING_SLEEP, happy: DRAGONLING_HAPPY },
  'pet:ghostling': { asleep: GHOSTLING_SLEEP, happy: GHOSTLING_HAPPY },
  'pet:golem': { asleep: GOLEM_PET_SLEEP, happy: GOLEM_PET_HAPPY },
  'pet:fire': { asleep: FIRE_SPIRIT_SLEEP, happy: FIRE_SPIRIT_HAPPY },
  'pet:slime': { asleep: SLIME_BLUE_SLEEP, happy: SLIME_BLUE_HAPPY },
};
