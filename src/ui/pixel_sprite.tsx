/**
 * Disegna uno sprite su un canvas, un pixel per pixel.
 *
 * Il canvas ha le dimensioni vere dello sprite (16x16) e viene ingrandito dal
 * CSS con `image-rendering: pixelated`: e' il browser a moltiplicare i pixel,
 * quindi restano quadrati e nitidi a qualsiasi ingrandimento. Disegnare
 * direttamente su un canvas grande darebbe bordi sfumati.
 */

import { useEffect, useRef, useState } from 'react';
import { colorOf } from './palette';
import { parseRamp, rampColor } from '../lib/sprite_ramp';
import type { Sprite } from './sprites';

export function PixelSprite({
  sprite,
  scale = 3,
  className,
  tint,
}: {
  sprite: Sprite;
  scale?: number;
  className?: string;
  /** Colore unico al posto di quelli dello sprite, per il lampo del colpo */
  tint?: string;
}) {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    // La rampa la dichiara il tema, quindi si legge dall'elemento e non da una
    // costante: lo stesso sprite si ridisegna da solo quando il tema cambia.
    const ramp = parseRamp(getComputedStyle(canvas).getPropertyValue('--px-sprite-ramp'));

    ctx.clearRect(0, 0, sprite.width, sprite.height);
    sprite.rows.forEach((row, y) => {
      for (let x = 0; x < row.length; x++) {
        const own = colorOf(row[x]);
        // I pixel trasparenti restano vuoti anche sotto tint: il lampo cambia
        // i colori dello sprite, non la sua sagoma.
        if (own === null) continue;
        ctx.fillStyle = rampColor(tint ?? own, ramp);
        ctx.fillRect(x, y, 1, 1);
      }
    });
    // Nessun elenco di dipendenze: la rampa arriva dal CSS, e un tema provato
    // cambia i colori senza cambiare nessuna prop. Ridisegnare a ogni render
    // costa 256 pixel su un canvas 16x16 — meno di quanto costi accorgersi in
    // qualche altro modo che il tema e' cambiato.
  });

  return (
    <canvas
      ref={ref}
      className={className}
      width={sprite.width}
      height={sprite.height}
      style={{
        width: sprite.width * scale,
        height: sprite.height * scale,
        imageRendering: 'pixelated',
      }}
    />
  );
}

/**
 * Sprite animato che scorre i fotogrammi a intervallo fisso.
 *
 * `frameMs` e' alto di proposito: l'animazione a scatti fa parte dello stile,
 * un movimento fluido tradirebbe il pixel.
 */
export function PixelAnim({
  frames,
  frameMs = 420,
  ...rest
}: {
  frames: readonly Sprite[];
  frameMs?: number;
  scale?: number;
  className?: string;
  tint?: string;
}) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setIndex((i) => (i + 1) % frames.length), frameMs);
    return () => clearInterval(timer);
  }, [frames.length, frameMs]);

  return <PixelSprite sprite={frames[index % frames.length]} {...rest} />;
}
