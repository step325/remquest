/**
 * Dove sta il riquadro del pannello — regole pure.
 *
 * `openFloatingWidget` vuole una posizione e `setFloatingWidgetPosition` la
 * cambia: il trascinamento e' tutto qui, sommare gli spostamenti del mouse e
 * non lasciare che il riquadro finisca dove non si riprende piu'.
 *
 * `right` e' la distanza dal bordo destro, non dal sinistro: e' cosi' che la
 * vuole l'SDK, e per questo muovendosi verso destra il numero cala.
 */

export interface Position {
  /** Distanza dal bordo alto */
  top: number;
  /** Distanza dal bordo destro */
  right: number;
}

export interface Size {
  width: number;
  height: number;
}

const finite = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n);

/**
 * Tiene il riquadro **tutto** dentro l'area disponibile.
 *
 * Non basta lasciarne fuori sporgere solo un pezzo: trascinandolo verso un
 * angolo si prende dalla striscia in alto, e il resto del riquadro — che e'
 * lungo — finisce oltre il bordo. Restava una striscia da riafferrare, ma il
 * pannello non si leggeva piu' ed era di fatto buttato via.
 *
 * Se l'area e' piu' piccola del riquadro il massimo verrebbe negativo e
 * scavalcherebbe il minimo: l'angolo in alto a destra e' il ripiego giusto.
 */
export function clampPosition(pos: Position, area: Size, panel: Size): Position {
  const maxTop = Math.max(0, area.height - panel.height);
  const maxRight = Math.max(0, area.width - panel.width);
  return {
    top: Math.round(Math.min(maxTop, Math.max(0, pos.top))),
    right: Math.round(Math.min(maxRight, Math.max(0, pos.right))),
  };
}

/**
 * La posizione dopo uno spostamento del mouse.
 *
 * `dx`/`dy` arrivano da un messaggio di un altro iframe: se non sono numeri
 * veri la posizione resta dov'e', invece di diventare NaN e portarsi via il
 * riquadro.
 */
export function movedBy(
  pos: Position,
  dx: unknown,
  dy: unknown,
  area: Size,
  panel: Size
): Position {
  if (!finite(dx) || !finite(dy)) return pos;
  return clampPosition({ top: pos.top + dy, right: pos.right - dx }, area, panel);
}

/** La posizione salvata, se e' ancora una posizione */
export function normalizePosition(value: unknown): Position | null {
  if (!value || typeof value !== 'object') return null;
  const p = value as Record<string, unknown>;
  if (!finite(p.top) || !finite(p.right)) return null;
  return { top: p.top, right: p.right };
}
