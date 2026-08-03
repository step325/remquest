/**
 * Sprite disegnati a mano, tenuti come dati e non come immagini.
 *
 * Una riga per riga di pixel, un carattere per pixel: '.' e' trasparente, il
 * resto e' un indice della palette a 16 colori (src/ui/palette.ts). Cosi' gli
 * sprite stanno nel controllo di versione come il codice, si leggono in diff e
 * non serve nessuna pipeline di build per le immagini.
 *
 * Il boss ha due fotogrammi che si alternano: uno steso e uno schiacciato. E'
 * il minimo perche' sembri vivo mentre aspetta il colpo successivo.
 */

export interface Sprite {
  readonly width: number;
  readonly height: number;
  readonly rows: readonly string[];
}

function sprite(rows: readonly string[]): Sprite {
  return { width: rows[0].length, height: rows.length, rows };
}

/** Boss, fotogramma disteso */
const SLIME_A = sprite([
  '................',
  '................',
  '................',
  '......0000......',
  '....00ffff00....',
  '...0ff6fffff0...',
  '..0ff6ffffffff0.',
  '..0ffffffffffff0',
  '.0ff66ffff66ff0.',
  '.0ff06ffff06ff0.',
  '.0ff66ffff66ff0.',
  '0fffffffffffff30',
  '0ffffffffffff330',
  '0ffffffffff33330',
  '.00333333333300.',
  '................',
]);

/** Boss, fotogramma schiacciato: due pixel piu' basso e largo fino al bordo */
const SLIME_B = sprite([
  '................',
  '................',
  '................',
  '................',
  '................',
  '......0000......',
  '....00ffff00....',
  '..00ff6fffff00..',
  '.0ffffffffffff0.',
  '0ff66ffffff66ff0',
  '0ff06ffffff06ff0',
  '0ff66ffffff66ff0',
  '0ffffffffffffff0',
  '0fffffffffffff30',
  '0ffffffffff33330',
  '.00333333333300.',
]);

export const BOSS_SLIME: readonly Sprite[] = [SLIME_A, SLIME_B];

/** Ricompensa di fine coda, chiusa: coperchio bombato, corpo, serratura */
export const CHEST_CLOSED = sprite([
  '................',
  '................',
  '....00000000....',
  '...0888888880...',
  '..088777777880..',
  '..088888888880..',
  '..000000000000..',
  '..077777777770..',
  '..077770077770..',
  '..077770077770..',
  '..077777777770..',
  '..088888888880..',
  '..000000000000..',
  '................',
  '................',
  '................',
]);

/** Ricompensa di fine coda, aperta: il coperchio si ribalta e dentro c'e' luce */
export const CHEST_OPEN = sprite([
  '...00000000.....',
  '..08888888800...',
  '..08777777780...',
  '..00000000000...',
  '................',
  '..000000000000..',
  '..011111111110..',
  '..016666666610..',
  '..077777777770..',
  '..077777777770..',
  '..088888888880..',
  '..000000000000..',
  '................',
  '................',
  '................',
  '................',
]);

/**
 * Taglio che attraversa il boss quando lo colpisci.
 *
 * Il numero di danno da solo dice quanti XP hai preso, non che il colpo sia
 * arrivato: il taglio lega le due cose. Bianco al centro e oro ai bordi, cosi'
 * si stacca dal viola dello slime.
 */
export const SLASH = sprite([
  '.............677',
  '............677.',
  '...........677..',
  '..........677...',
  '.........677....',
  '........677.....',
  '.......677......',
  '......677.......',
  '.....677........',
  '....677.........',
  '...677..........',
  '..677...........',
  '.677............',
  '677.............',
  '77..............',
  '7...............',
]);

/** Scintilla dei colpi critici */
export const SPARK = sprite([
  '...66...',
  '...77...',
  '..7777..',
  '67777776',
  '67777776',
  '..7777..',
  '...77...',
  '...66...',
]);

/** Fiamma della serie di giorni, tre fotogrammi che si rincorrono */
export const FLAME: readonly Sprite[] = [
  sprite([
    '...ee...',
    '..e7e...',
    '.ee77e..',
    '.e7777e.',
    'e777767e',
    'e767767e',
    '.e7777e.',
    '..eeee..',
  ]),
  sprite([
    '...ee...',
    '...e7e..',
    '..e77ee.',
    '.e7777e.',
    'e767777e',
    'e767767e',
    '.e7777e.',
    '..eeee..',
  ]),
  sprite([
    '..ee....',
    '..e7e...',
    '.ee77e..',
    '.e7777e.',
    'e777677e',
    'e767767e',
    '.e7777e.',
    '..eeee..',
  ]),
];

/*
 * Altoparlante, acceso e barrato: e' l'interruttore dei suoni nella coda.
 *
 * Due disegni e non uno solo ricolorato: a dodici pixel il colore da' un
 * indizio, la sagoma da' una certezza — e chi non distingue il verde dal rosso
 * vede comunque la barra. Le due onde a destra spariscono da spento: non c'e'
 * niente che esce dal cono.
 */
export const SPEAKER_ON = sprite([
  '..............',
  '........0.....',
  '.......05.....',
  '......055...b.',
  '..0000555.b..b',
  '..0555555..b.b',
  '..0555555.b..b',
  '..0000555...b.',
  '......055.....',
  '.......05.....',
  '........0.....',
  '..............',
]);

export const SPEAKER_OFF = sprite([
  '..............',
  '........0.....',
  '.......04.....',
  '......0449....',
  '..0000449.....',
  '..0444494.....',
  '..0444944.....',
  '..0009444.....',
  '...a9.044.....',
  '.......04.....',
  '........0.....',
  '..............',
]);

/*
 * L'icona del plugin nella barra laterale.
 *
 * Sedici pixel accanto a icone monocrome di sistema: vince la sagoma, non il
 * dettaglio. Una spada di traverso si riconosce anche a quella misura, un
 * elmo o uno scudo diventano una macchia. L'elsa e' oro come la barra degli
 * XP, cosi' l'icona e' della stessa famiglia del resto del gioco.
 */
export const QUEST_ICON = sprite([
  '..............6.',
  '.............666',
  '............6556',
  '...........65556',
  '..........655560',
  '.........655560.',
  '........655560..',
  '.......655560...',
  '......655560....',
  '.....655560.....',
  '..8.65560.......',
  '.878.5600.......',
  '.887760.........',
  '..87780.........',
  '.....880........',
  '......80........',
]);
