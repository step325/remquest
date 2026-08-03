/**
 * Riduzione degli sprite alla rampa di un tema, regole pure.
 *
 * Gli sprite sono disegnati con la palette a sedici colori e quella non cambia
 * con il tema: un mostro azzurro resta azzurro anche sullo schermo verde di un
 * Game Boy, ed e' l'unica cosa che tradisce il travestimento.
 *
 * Un tema puo' dichiarare `--px-sprite-ramp`: una manciata di colori ordinati
 * dal piu' scuro al piu' chiaro. Ogni colore dello sprite viene sostituito con
 * quello della rampa che gli somiglia per quantita' di luce — non per tinta,
 * che a quattro toni non esiste. La sagoma regge perche' l'ordine chiaro/scuro
 * non si tocca: e' quello che si vede a 16 pixel, non il colore.
 *
 * Nessun import: il modulo dev'essere caricabile dai test di Node.
 */

const HEX = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

/** I colori dichiarati dal tema, in ordine; lista vuota se non ce n'e' */
export function parseRamp(value: string): string[] {
  return value
    .trim()
    .split(/\s+/)
    .filter((token) => HEX.test(token));
}

/** Le tre componenti di un colore esadecimale, o null se non e' leggibile */
function channels(hex: string): [number, number, number] | null {
  if (!HEX.test(hex)) return null;
  const body = hex.slice(1);
  const full =
    body.length === 3
      ? body
          .split('')
          .map((c) => c + c)
          .join('')
      : body;

  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ];
}

/**
 * Il colore della rampa che corrisponde a `hex`.
 *
 * I pesi sono quelli della luminanza percepita: l'occhio legge il verde molto
 * piu' del blu, e usare la media dei tre canali farebbe finire un blu scuro e
 * un verde scuro sullo stesso gradino quando non ci stanno.
 */
export function rampColor(hex: string, ramp: readonly string[]): string {
  if (ramp.length === 0) return hex;

  const rgb = channels(hex);
  if (!rgb) return hex; // meglio il colore di partenza che un pixel a caso

  const luce = (0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]) / 255;
  const gradino = Math.min(ramp.length - 1, Math.floor(luce * ramp.length));
  return ramp[gradino];
}
