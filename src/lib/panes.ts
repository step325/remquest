/**
 * Pulizia dei pane widget rimasti nel layout — logica pura.
 *
 * RemNote non riesce a rileggere il layout quando contiene un pane di plugin:
 * basta ridimensionare per far comparire
 * `Cannot parse window string: (notes~)_(widget~...)_68`. Il Remquest percio'
 * non usa piu' `openWidgetInPane`, ma i pane aperti dalle versioni precedenti
 * restano nel layout salvato e vanno tolti.
 *
 * L'SDK 0.0.46 non espone `closePane` (la documentazione la cita, ma il metodo
 * non c'e'), quindi si riscrive l'albero con `setRemWindowTree`.
 */

export interface PaneRemLike {
  remId: string;
  paneId: string;
}

export interface MosaicLike<T> {
  direction: 'row' | 'column';
  first: MosaicLike<T> | T;
  second: MosaicLike<T> | T;
  splitPercentage?: number;
}

export type PaneTree = PaneRemLike | MosaicLike<PaneRemLike>;
export type RemIdTree = string | MosaicLike<string>;

function isSplit<T>(node: MosaicLike<T> | T): node is MosaicLike<T> {
  return typeof node === 'object' && node !== null && 'first' in node && 'second' in node;
}

/** Un pane che ospita un widget di plugin ha un remId sintetico `(widget~...)` */
export function isWidgetPane(remId: unknown): boolean {
  return typeof remId === 'string' && remId.startsWith('(widget~');
}

/** Tutti i pane dell'albero, da sinistra a destra */
export function flattenPanes(tree: PaneTree): PaneRemLike[] {
  if (!isSplit(tree)) return [tree];
  return [...flattenPanes(tree.first), ...flattenPanes(tree.second)];
}

/**
 * Riscrive l'albero tenendo solo i pane accettati da `keep`, nella forma di
 * remId richiesta da `setRemWindowTree`. Restituisce null se non resta nulla:
 * una finestra senza pane non e' rappresentabile.
 */
export function pruneTree(tree: PaneTree, keep: (pane: PaneRemLike) => boolean): RemIdTree | null {
  if (!isSplit(tree)) return keep(tree) ? tree.remId : null;

  const first = pruneTree(tree.first, keep);
  const second = pruneTree(tree.second, keep);
  if (first === null) return second;
  if (second === null) return first;
  return { direction: tree.direction, first, second, splitPercentage: tree.splitPercentage };
}

/**
 * Albero senza i pane widget, oppure null se non c'e' niente da riscrivere:
 * o perche' non ce n'erano, o perche' toglierli lascerebbe la finestra vuota.
 */
export function treeWithoutWidgetPanes(tree: PaneTree): RemIdTree | null {
  if (!flattenPanes(tree).some((pane) => isWidgetPane(pane.remId))) return null;
  return pruneTree(tree, (pane) => !isWidgetPane(pane.remId));
}
