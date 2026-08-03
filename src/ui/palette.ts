/**
 * Palette a 16 colori del Remquest.
 *
 * Sedici colori sono un vincolo voluto, non una limitazione tecnica: e' cio'
 * che tiene insieme sprite disegnati a mano, barre e testo. Ogni colore ha un
 * indice esadecimale, lo stesso carattere usato nelle righe degli sprite.
 *
 * Il pannello ha un fondo scuro suo e non segue il tema chiaro/scuro di
 * RemNote: un'interfaccia di gioco che cambia colore con l'app non sembra piu'
 * un gioco. Gli stessi valori sono ripetuti come variabili CSS in
 * src/styles/pixel.css, che e' l'unico posto da cui li leggono i fogli di
 * stile.
 */

export const PALETTE = [
  '#0b0f1a', // 0 nero-blu: contorni e ombre
  '#17203a', // 1 fondo del pannello
  '#232f52', // 2 fondo rialzato
  '#3d4d7a', // 3 bordi e ombre fredde
  '#8794b8', // 4 testo spento
  '#e8ecf5', // 5 testo
  '#ffffff', // 6 luci
  '#ffcc44', // 7 oro: XP
  '#c98c1e', // 8 oro scuro
  '#d1344a', // 9 sangue: HP del boss
  '#8a1c30', // a sangue scuro
  '#4ad66d', // b foglia: fatto
  '#2a8f45', // c foglia scura
  '#4fc3f7', // d cielo: card
  '#ff8a3d', // e fiamma: streak e critici
  '#b06bff', // f mana: livello
] as const;

/** Carattere usato nelle righe di uno sprite per il pixel trasparente */
export const TRANSPARENT = '.';

/** Indici della palette nell'ordine in cui compaiono nelle righe degli sprite */
const INDEX = '0123456789abcdef';

/** Colore di un carattere di sprite, oppure null se e' trasparente */
export function colorOf(char: string): string | null {
  const i = INDEX.indexOf(char);
  return i >= 0 ? PALETTE[i] : null;
}
