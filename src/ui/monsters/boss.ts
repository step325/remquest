/**
 * Boss: le giornate pesanti.
 *
 * Riempiono il riquadro fino ai bordi, mentre i comuni lasciano aria attorno:
 * la stazza si sente prima ancora di leggere gli HP.
 */

import { type Sprite, sprite } from './sprite';


/** Drago: muso di profilo, collo lungo e ali */
export const DRAGON = sprite([
  '................',
  '.........00.....',
  '........0990....',
  '.0.....09999000.',
  '00....0999999990',
  '0990..0996699990',
  '09990099999990..',
  '099990999999900.',
  '0999999999990000',
  '.09999999999990.',
  '..0999999999990.',
  '...0999999999990',
  '....0999999990..',
  '.....09999900...',
  '......00000.....',
  '................',
]);

/** Demone: corna larghe e occhi di brace */
export const DEMON = sprite([
  '0..............0',
  '.00..........00.',
  '.0a0........0a0.',
  '.0aa00000000aa0.',
  '.0aaaaaaaaaaaa0.',
  '0aaaaaaaaaaaaaa0',
  '0aae99aaaa99eaa0',
  '0aae90aaaa09eaa0',
  '0aaaaaaaaaaaaaa0',
  '0aaa00000000aaa0',
  '0aa0e7e7e7e70aa0',
  '0aaa00000000aaa0',
  '.0aaaaaaaaaaaa0.',
  '..0aaaaaaaaaa0..',
  '...0aa0000aa0...',
  '...000....000...',
]);

/** Lich: corona e teschio incandescente */
export const LICH = sprite([
  '................',
  '..0..0.00.0..0..',
  '..0770777707770.',
  '..0777777777770.',
  '...0777777770...',
  '...0555555550...',
  '..055555555550..',
  '..05500550055550',
  '..05e00ee00e5550',
  '..055555555550..',
  '..0550555505550.',
  '...0555555550...',
  '....05555550....',
  '..000ffffff000..',
  '.0ff0ffffff0ff0.',
  '.000..0000..000.',
]);

/** Minotauro: corna a mezzaluna e anello al naso */
export const MINOTAUR = sprite([
  '................',
  '.00..........00.',
  '0550........0550',
  '0550000000000550',
  '.05088888888050.',
  '..0888888888880.',
  '..0889999998880.',
  '..0889009008880.',
  '..0888888888880.',
  '..08888008888880',
  '...0887777880...',
  '...0888888880...',
  '..008888888800..',
  '.08808888888080.',
  '.08800000000080.',
  '.000........000.',
]);

/** Cavaliere nero: elmo chiuso e spallacci */
export const BLACK_KNIGHT = sprite([
  '................',
  '.......00.......',
  '......0990......',
  '.....099990.....',
  '....03333330....',
  '...0333333330...',
  '...0333333330...',
  '...0309999030...',
  '...0333333330...',
  '...0333333330...',
  '..003333333300..',
  '.03303333333030.',
  '.03303333333030.',
  '.03300333300330.',
  '.033..0330..033.',
  '.000..000...000.',
]);

/** Idra: tre teste sullo stesso corpo */
export const HYDRA = sprite([
  '................',
  '..000..000..000.',
  '.0dd0.0dd0.0dd0.',
  '.0d90.0d90.0d90.',
  '.0dd0.0dd0.0dd0.',
  '.0dd000dd000dd0.',
  '..0dddddddddd0..',
  '..0dddddddddd0..',
  '.0dddddddddddd0.',
  '.0dd00dddd00dd0.',
  '.0dddddddddddd0.',
  '.0dddddddddddd0.',
  '..0dddddddddd0..',
  '...0dddddddd0...',
  '....00000000....',
  '................',
]);

export const BOSS: readonly Sprite[] = [
  DRAGON,
  DEMON,
  LICH,
  MINOTAUR,
  BLACK_KNIGHT,
  HYDRA,
];
