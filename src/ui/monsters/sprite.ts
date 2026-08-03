/**
 * Tipo e costruttore degli sprite del bestiario.
 *
 * Sta in un file suo perche' lo usano tutti e tre gli scaglioni di mostri, e
 * importarlo da uno di loro creerebbe una dipendenza fra pari senza motivo.
 */

export interface Sprite {
  readonly width: number;
  readonly height: number;
  readonly rows: readonly string[];
}

export function sprite(rows: readonly string[]): Sprite {
  return { width: rows[0].length, height: rows.length, rows };
}
