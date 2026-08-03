/**
 * Dall'identificativo di un tema alla sua classe CSS — regola pura.
 *
 * Sta qui e non in shop.ts perche' quel file parla di prezzi e portafogli,
 * mentre questa e' una traduzione di nomi: `theme:gameboy` diventa
 * `theme-gameboy`, la classe che pannello e HUD mettono accanto a `px`.
 *
 * Nessun import: il modulo dev'essere caricabile dai test di Node.
 */

const PREFIX = 'theme:';

/**
 * La classe del tema, dal suo identificativo.
 *
 * Un identificativo che non e' un tema non produce nessuna classe: meglio
 * mostrare il tema di serie che appiccicare al pannello una classe inventata.
 */
export function themeClassById(id: string): string {
  if (!id.startsWith(PREFIX)) return '';
  return `theme-${id.slice(PREFIX.length)}`;
}
