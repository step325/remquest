/**
 * Icone degli articoli che non sono compagni.
 *
 * Servono all'uniformita' della vetrina: con solo i compagni illustrati, meta'
 * righe avevano un disegno e meta' un vuoto, e l'elenco sembrava incompleto.
 *
 * Ognuna richiama il tema con la sua tinta dominante, presa dalla palette
 * fissa: gli sprite non leggono le variabili CSS, quindi il richiamo e' nel
 * soggetto e nel colore scelto a mano.
 */

import { type Sprite, sprite } from './monsters/sprite';


/** Game Boy: la console con lo schermo verde */
export const ICON_GAMEBOY = sprite([
  '................',
  '...00000000.....',
  '...0bbbbbb0.....',
  '...0b0000b0.....',
  '...0b0cc0b0.....',
  '...0b0cc0b0.....',
  '...0b0000b0.....',
  '...0bbbbbb0.....',
  '...0b0bb0b0.....',
  '...0bb00bb0.....',
  '...0b0bb0b0.....',
  '...0bbbbbb0.....',
  '...0b0b0b0b0....',
  '...0bbbbbb0.....',
  '...00000000.....',
  '................',
]);

/** Cripta: teschio fra le ossa */
export const ICON_CRYPT = sprite([
  '................',
  '.....000000.....',
  '....0ffffff0....',
  '...0ffffffff0...',
  '...0f000ff000f0.',
  '...0f000ff000f0.',
  '...0ffffffffff0.',
  '...0fff0000fff0.',
  '....0ffffffff0..',
  '.....0ffffff0...',
  '......0f00f0....',
  '....00000000....',
  '...0ff0ff0ff0...',
  '...0ff0ff0ff0...',
  '....00000000....',
  '................',
]);

/** Fucina: incudine e brace */
export const ICON_FORGE = sprite([
  '................',
  '.......e........',
  '......e0e.......',
  '.....e070e......',
  '......e0e.......',
  '.......e........',
  '................',
  '..000000000000..',
  '..0eeeeeeeeee0..',
  '..0eeeeeeeeee0..',
  '...00eeeeee00...',
  '.....0eeee0.....',
  '.....0eeee0.....',
  '...000eeee000...',
  '...0eeeeeeee0...',
  '...00000000000..',
]);

/** Pergamena: rotolo con il sigillo */
export const ICON_PARCHMENT = sprite([
  '................',
  '................',
  '...0000000000...',
  '..055555555550..',
  '..050000000050..',
  '..055555555550..',
  '..050000000050..',
  '..055555555550..',
  '..050000000050..',
  '..055555555550..',
  '..055559955550..',
  '..055559955550..',
  '..055555555550..',
  '...0000000000...',
  '................',
  '................',
]);

/** Gettone: moneta con la stella */
export const ICON_TOKEN = sprite([
  '................',
  '.....000000.....',
  '...0088888800...',
  '..08777777780...',
  '.087777777770...',
  '.087770077770...',
  '.0877000077770..',
  '.08770eeee07770.',
  '.08770eeee07770.',
  '.0877000077770..',
  '.087770077770...',
  '.087777777770...',
  '..08777777780...',
  '...0088888800...',
  '.....000000.....',
  '................',
]);

/** L'icona di un articolo, o niente se non ne ha una */
export function itemIcon(id: string): Sprite | null {
  switch (id) {
    case 'theme:gameboy':
      return ICON_GAMEBOY;
    case 'theme:crypt':
      return ICON_CRYPT;
    case 'theme:forge':
      return ICON_FORGE;
    case 'theme:parchment':
      return ICON_PARCHMENT;
    case 'token':
      return ICON_TOKEN;
    default:
      return null;
  }
}
