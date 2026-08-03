/**
 * Il pannello che resta aperto cambiando pagina.
 *
 * `openWidgetInRightSidebar` mette il Remquest nella barra di destra, ma
 * qualunque navigazione — aprire un rem, andare sulla pagina dei plugin — ci
 * mette dentro qualcos'altro e il pannello sparisce. Chi lo ha aperto se lo
 * ritrova chiuso senza averlo chiuso.
 *
 * Qui c'e' solo la regola di quando riaprirlo; chi la applica sta in
 * src/widgets/index.tsx, che e' l'unico posto vivo quanto il plugin.
 */

/**
 * Pausa fra due riaperture.
 *
 * Una navigazione fa scattare piu' eventi ravvicinati (url, rem aperto,
 * albero delle finestre): senza pausa il pannello verrebbe riaperto tre volte
 * di fila, e ogni riapertura ruba il posto a quello che c'e' nella barra.
 */
export const REOPEN_GAP_MS = 400;

export interface StickyState {
  /** L'utente ha aperto il pannello e non lo ha piu' chiuso */
  sticky: boolean;
  /** Quando e' stato riaperto l'ultima volta */
  lastOpenAt: number;
}

/** Se il pannello va rimesso nella barra adesso */
export function shouldReopen(state: StickyState, now: number): boolean {
  if (!state.sticky) return false;
  // Il tempo viene dal dispositivo: se l'ora salta all'indietro la differenza
  // e' negativa, e va trattata come "e' passato abbastanza" invece di
  // bloccare le riaperture fino a recuperare il salto.
  const passato = now - state.lastOpenAt;
  return passato < 0 || passato >= REOPEN_GAP_MS;
}
