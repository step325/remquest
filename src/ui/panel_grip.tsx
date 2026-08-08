import { type PointerEvent as ReactPointerEvent, useRef } from 'react';
import { usePlugin } from '@remnote/plugin-sdk';
import { sayMove } from '../lib/panel_link';
import type { Translate } from '../lib/i18n/index';

/**
 * La striscia da cui si trascina il pannello.
 *
 * Il riquadro non si sposta da solo: la posizione la tiene chi lo ha aperto
 * (src/lib/floating_panel.ts), e da qui parte solo di quanto si e' mosso il
 * mouse.
 *
 * Le coordinate sono quelle dello schermo e non quelle della pagina. Dentro
 * l'iframe `clientX` e' relativo al riquadro, e il riquadro insegue il mouse:
 * a movimento avvenuto la differenza tornerebbe quasi zero e il pannello non
 * partirebbe mai. `screenX` misura il movimento vero.
 *
 * Ed e' proprio perche' il riquadro insegue il mouse che il trascinamento
 * funziona da dentro un iframe: il puntatore resta sopra questa striscia per
 * tutto il tempo, quindi gli eventi continuano ad arrivare qui.
 */
export function PanelGrip({ t }: { t: Translate }) {
  const plugin = usePlugin();
  /** Ultima posizione nota del mouse, o null se non si sta trascinando */
  const last = useRef<{ x: number; y: number } | null>(null);
  /** Spostamento accumulato fra un fotogramma e il successivo */
  const pending = useRef({ dx: 0, dy: 0 });
  const frame = useRef<number | null>(null);

  /**
   * Manda lo spostamento accumulato, una volta per fotogramma.
   *
   * Il mouse produce decine di eventi al secondo e ognuno sarebbe un messaggio
   * fra iframe piu' una chiamata all'app: accorparli per fotogramma e' quanto
   * basta perche' il movimento resti fluido senza inondare il canale.
   */
  const flush = () => {
    frame.current = null;
    const { dx, dy } = pending.current;
    pending.current = { dx: 0, dy: 0 };
    if (dx !== 0 || dy !== 0) void plugin.messaging.broadcast(sayMove(dx, dy));
  };

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    // Senza cattura, un attimo di ritardo del riquadro fa scivolare il
    // puntatore fuori dalla striscia e il trascinamento si interrompe da solo.
    event.currentTarget.setPointerCapture(event.pointerId);
    // Trascinare non deve selezionare il testo che c'e' sotto.
    event.preventDefault();
    last.current = { x: event.screenX, y: event.screenY };
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const prima = last.current;
    if (!prima) return;
    pending.current.dx += event.screenX - prima.x;
    pending.current.dy += event.screenY - prima.y;
    last.current = { x: event.screenX, y: event.screenY };
    if (frame.current === null) frame.current = requestAnimationFrame(flush);
  };

  const onPointerUp = () => {
    last.current = null;
    // L'ultimo pezzo di movimento non deve restare nel cassetto: senza questo
    // il pannello si ferma qualche pixel prima di dove lo si e' lasciato.
    if (frame.current !== null) {
      cancelAnimationFrame(frame.current);
      flush();
    }
  };

  return (
    <div
      className={'rq-grip'}
      title={t('panel.drag')}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      // Il puntatore puo' uscire dal riquadro se il movimento e' piu' veloce di
      // quanto RemNote lo sposti: la cattura si perde e il trascinamento va
      // chiuso qui, altrimenti resterebbe attaccato al mouse.
      onLostPointerCapture={onPointerUp}
    />
  );
}
