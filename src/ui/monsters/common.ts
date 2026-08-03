/**
 * Mostri comuni: quelli delle giornate leggere.
 *
 * Sedici per sedici, un carattere per pixel, gli indici della palette di
 * src/ui/palette.ts. A questa misura vince la sagoma: i dettagli sottili
 * spariscono dentro il contorno, quindi ogni creatura si riconosce dalla forma
 * generale prima che dai particolari.
 */

import { type Sprite, sprite } from './sprite';


/** Melma: la creatura piu' comune di tutte */
export const SLIME_GREEN = sprite([
  '................',
  '................',
  '................',
  '......0000......',
  '....00bbbb00....',
  '...0bb6bbbb0....',
  '..0bb6bbbbbb0...',
  '..0bbbbbbbbbb0..',
  '.0bb66bbbb66bb0.',
  '.0bb06bbbb06bb0.',
  '.0bb66bbbb66bb0.',
  '0bbbbbbbbbbbbb30',
  '0bbbbbbbbbbbb330',
  '0bbbbbbbbbb33330',
  '.00333333333300.',
  '................',
]);

/** Pipistrello: ali aperte e muso corto */
export const BAT = sprite([
  '................',
  '................',
  '..0..........0..',
  '.0f0........0f0.',
  '.0ff0..00..0ff0.',
  '.0fff00ff00fff0.',
  '.0ffffffffffff0.',
  '.0fff066660fff0.',
  '..00f065560f00..',
  '....0f6556f0....',
  '.....0f66f0.....',
  '......0ff0......',
  '.......00.......',
  '................',
  '................',
  '................',
]);

/** Ratto gigante: orecchie tonde e incisivi */
export const RAT = sprite([
  '................',
  '.0440......0440.',
  '.04440....04440.',
  '.044440..044440.',
  '..044444444440..',
  '.04444444444440.',
  '0444994444994440',
  '0444994444994440',
  '0444444444444440',
  '0444444004444440',
  '.04444004444440.',
  '..044444444440..',
  '...0055665500...',
  '....00000000....',
  '................',
  '................',
]);

/** Goblin: orecchie a punta e denti storti */
export const GOBLIN = sprite([
  '................',
  '..0..........0..',
  '..00........00..',
  '..0b0......0b0..',
  '..0bb000000bb0..',
  '..0bbbbbbbbbb0..',
  '.0bbbbbbbbbbbb0.',
  '.0bb077bb770bb0.',
  '.0bb070bb070bb0.',
  '.0bbbbbbbbbbbb0.',
  '.0bbbb0000bbbb0.',
  '..0bb066660bb0..',
  '..0bb055550bb0..',
  '...0bbbbbbbb0...',
  '....00000000....',
  '................',
]);

/** Fungo animato: cappella velenosa e occhi nel gambo */
export const MUSHROOM = sprite([
  '................',
  '................',
  '.....000000.....',
  '...009999900....',
  '..09966699990...',
  '.0996666669990..',
  '.0999666699990..',
  '.0999999999990..',
  '.0999966699990..',
  '..0999999990....',
  '...0005555000...',
  '....05005000....',
  '....05555550....',
  '.....000000.....',
  '................',
  '................',
]);

/** Scheletro: teschio e costole */
export const SKELETON = sprite([
  '................',
  '.....000000.....',
  '....05555550....',
  '...0555555550...',
  '...0500055000...',
  '...0500055000...',
  '...0555555550...',
  '...0505555050...',
  '....05555550....',
  '.....055550.....',
  '......0550......',
  '...0005555000...',
  '..055055550550..',
  '..050055550050..',
  '...0.055550.0...',
  '.....000000.....',
]);

/** Zombie: braccia avanti e carne marcia */
export const ZOMBIE = sprite([
  '................',
  '....00000000....',
  '...0cccccccc0...',
  '..0cccccccccc0..',
  '..0c9c0cc90cc0..',
  '..0cccccccccc0..',
  '..0ccc0000ccc0..',
  '...0cccccccc0...',
  '....00000000....',
  '0000cccccccc0000',
  '0ccc0cccccc00cc0',
  '0cc00cccccc00cc0',
  '.0000cccccc0000.',
  '....0cc00cc0....',
  '....0cc00cc0....',
  '....0000.000....',
]);

/** Ragno gigante: addome grosso e zampe piegate */
export const SPIDER = sprite([
  '................',
  '..3..........3..',
  '..33........33..',
  '...33......33...',
  '....00000000....',
  '...0333333330...',
  '..033333333330..',
  '.03393333933330.',
  '.03333333333330.',
  '.03330000003330.',
  '..033333333330..',
  '...0333333330...',
  '....00000000....',
  '...33......33...',
  '..33........33..',
  '..3..........3..',
]);

/** Diavoletto: corna, occhi gialli e ghigno */
export const IMP = sprite([
  '................',
  '...0......0.....',
  '..090....090....',
  '..0990..0990....',
  '.009900000990...',
  '.0999999999990..',
  '0099999999999900',
  '.0997709977990..',
  '.0990700907990..',
  '.0999999999990..',
  '.09990000099990.',
  '..0990777709900.',
  '..099999999990..',
  '...0999999990...',
  '....00000000....',
  '................',
]);

/** Fuoco fatuo: nucleo di luce e alone */
export const WISP = sprite([
  '................',
  '......0000......',
  '....00dddd00....',
  '...0dd6666dd0...',
  '..0dd666666dd0..',
  '..0d66666666d0..',
  '.0dd66666666dd0.',
  '.0d6666666666d0.',
  '.0d6666666666d0.',
  '.0dd66666666dd0.',
  '..0d66666666d0..',
  '..0dd666666dd0..',
  '...0dd6666dd0...',
  '....00dddd00....',
  '......0000......',
  '................',
]);

export const COMMON: readonly Sprite[] = [
  SLIME_GREEN,
  BAT,
  RAT,
  GOBLIN,
  MUSHROOM,
  SKELETON,
  ZOMBIE,
  SPIDER,
  IMP,
  WISP,
];
