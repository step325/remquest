/**
 * Uno sprite trasformato in immagine, per chi non puo' ricevere un canvas.
 *
 * Il CSS iniettato nell'app non puo' contenere un componente React: vuole un
 * URL. Il disegno resta un dato — le solite righe di caratteri — e diventa un
 * PNG solo qui, all'ultimo momento.
 */

import { colorOf } from './palette';
import type { Sprite } from './sprites';

/**
 * Il PNG dello sprite come `data:` URL, o stringa vuota se il canvas non c'e'.
 *
 * Un pixel dello sprite resta un pixel dell'immagine: l'ingrandimento lo fa
 * chi la mostra, con `image-rendering: pixelated`. Disegnarla gia' grande
 * darebbe bordi sfumati.
 */
export function spriteDataUrl(sprite: Sprite): string {
  const canvas = document.createElement('canvas');
  canvas.width = sprite.width;
  canvas.height = sprite.height;

  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  sprite.rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const color = colorOf(row[x]);
      if (color === null) continue; // trasparente: il fondo della barra passa
      ctx.fillStyle = color;
      ctx.fillRect(x, y, 1, 1);
    }
  });

  return canvas.toDataURL('image/png');
}
