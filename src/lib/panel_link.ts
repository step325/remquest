/**
 * Il filo fra il pannello e il motore.
 *
 * Vivono in due iframe diversi e non possono chiamarsi: l'unico canale e'
 * `plugin.messaging.broadcast`, che consegna a chiunque, dentro il plugin,
 * stia ascoltando `AppEvents.MessageBroadcast`. Qui c'e' solo cosa ci passa
 * dentro, cosi' le due sponde non possono sbagliarsi il nome del messaggio.
 */

/** Il pannello chiede di essere chiuso: l'identificativo del riquadro ce l'ha il motore */
export const PANEL_CLOSE = 'rq.panel-close';
/** Il pannello e' stato trascinato di tanto: solo lo spostamento, non la posizione */
export const PANEL_MOVE = 'rq.panel-move';
export type LinkMessage = typeof PANEL_CLOSE | typeof PANEL_MOVE;

const KINDS: readonly LinkMessage[] = [PANEL_CLOSE, PANEL_MOVE];

/** Il messaggio pronto da spedire */
export const say = (kind: LinkMessage) => ({ rq: kind });

/**
 * Il trascinamento, come spostamento e non come posizione.
 *
 * La posizione la tiene chi ha aperto il riquadro: il pannello non sa dove si
 * trova — dentro il suo iframe le coordinate ripartono da zero — e sa soltanto
 * di quanto si e' mosso il mouse.
 */
export const sayMove = (dx: number, dy: number) => ({ rq: PANEL_MOVE, dx, dy });

/**
 * Il corpo del messaggio, se e' uno dei nostri.
 *
 * La forma del payload dell'evento non e' documentata e puo' arrivare avvolto:
 * si guarda sia il livello esterno sia `message`. Tutto il resto e' roba
 * d'altri e va lasciata passare senza farci niente.
 */
function bodyOf(payload: unknown): Record<string, unknown> | null {
  const diretto = withKind(payload);
  if (diretto) return diretto;
  if (payload && typeof payload === 'object') {
    return withKind((payload as Record<string, unknown>).message);
  }
  return null;
}

function withKind(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object') return null;
  const body = value as Record<string, unknown>;
  return KINDS.some((k) => k === body.rq) ? body : null;
}

/** Che messaggio e' arrivato, se e' uno dei nostri */
export function heard(payload: unknown): LinkMessage | null {
  return (bodyOf(payload)?.rq as LinkMessage | undefined) ?? null;
}

/**
 * Lo spostamento dentro un messaggio di trascinamento.
 *
 * Restituisce i valori grezzi: e' `movedBy` in panel_position.ts a decidere
 * cosa e' un numero accettabile, e quella regola sta in un posto solo.
 */
export function moveOf(payload: unknown): { dx: unknown; dy: unknown } | null {
  const body = bodyOf(payload);
  if (!body || body.rq !== PANEL_MOVE) return null;
  return { dx: body.dx, dy: body.dy };
}
