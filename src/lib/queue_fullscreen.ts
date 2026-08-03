/**
 * Flashcard a tutto schermo.
 *
 * Il riquadro della coda e' stretto e su uno schermo grande lascia ai lati piu'
 * vuoto che contenuto. Non e' una cosa che si sistema dal widget: quello vive
 * in un iframe e vede solo se stesso. `plugin.app.registerCSS` inietta invece
 * regole nell'applicazione, che e' l'unico modo di toccare un elemento di
 * RemNote dall'esterno.
 *
 * E' un interruttore e non una misura in pixel: una larghezza da scegliere a
 * mano vuol dire indovinare un numero, e un numero sbagliato stringe il
 * riquadro invece di allargarlo.
 *
 * I nomi di classe sono quelli documentati per il CSS personalizzato:
 * `.rn-queue-container` e' il riquadro esterno, `.rn-queue` quello interno.
 */

import type { RNPlugin } from '@remnote/plugin-sdk';

export const SETTING_QUEUE_FULLSCREEN = 'queue-fullscreen';

/** Identificativo del blocco CSS: riusarlo sostituisce il blocco precedente */
const CSS_ID = 'remquest-queue-fullscreen';

/** Aria ai lati: a tutto schermo il testo non deve toccare i bordi */
const SIDE_PADDING = 32;

/**
 * Spazio lasciato libero attorno alla coda, uguale sui quattro lati.
 *
 * Ai lati non e' decorazione: la X per uscire e la freccia per richiudere la
 * barra stanno *fuori* dal riquadro, e una coda larga quanto la finestra ci
 * finisce sopra — a quel punto dalle flashcard non si esce piu'. Sopra e sotto
 * la stessa misura, perche' un riquadro incorniciato allo stesso modo sui
 * quattro lati sta meglio di uno appoggiato ai bordi.
 */
const EXIT_MARGIN = 96;

/**
 * Altezza della fila dei pulsanti di risposta.
 *
 * Di suo e' `min(70%, 400px)` dell'altezza del riquadro: una percentuale, per
 * cui allargando la coda i pulsanti crescono da soli fino a diventare enormi.
 * Qui torna a essere una misura fissa, vicina a quella che hanno prima del
 * tutto schermo.
 */
const ANSWER_BUTTONS_HEIGHT = 120;

export async function registerFullscreenSetting(plugin: RNPlugin): Promise<void> {
  await plugin.settings.registerBooleanSetting({
    id: SETTING_QUEUE_FULLSCREEN,
    title: 'Full-screen flashcards',
    description: 'Widens the flashcard box to the whole window.',
    defaultValue: false,
  });
}

/** Il CSS da iniettare, o stringa vuota quando l'interruttore e' spento */
export function queueFullscreenCss(enabled: boolean): string {
  if (!enabled) return '';

  // La coda sta dentro un contenitore ridimensionabile a mano, e le sue misure
  // sono stili inline (width, min-width, max-width...) che RemNote riscrive a
  // ogni trascinamento delle maniglie. Un foglio di stile normale perderebbe
  // contro un attributo style: !important e' l'unica dichiarazione che lo
  // scavalca.
  //
  // Quel contenitore non ha una classe propria da cui partire — solo utility
  // di Tailwind, che cambiano — ma e' il genitore di `.rn-queue`, e `:has()`
  // permette di raggiungerlo per posizione invece che per nome.
  const width = `calc(100vw - ${EXIT_MARGIN * 2}px)`;
  const height = `calc(100vh - ${EXIT_MARGIN * 2}px)`;

  return `
*:has(> .rn-queue),
*:has(> * > .rn-queue) {
  width: ${width} !important;
  min-width: 0 !important;
  max-width: ${width} !important;
  height: ${height} !important;
  min-height: 0 !important;
  max-height: ${height} !important;
  margin: auto !important;
}

.rn-queue {
  width: 100% !important;
  max-width: none !important;
  height: 100% !important;
  max-height: none !important;
  padding-left: ${SIDE_PADDING}px !important;
  padding-right: ${SIDE_PADDING}px !important;
}

/*
 * I pulsanti di risposta restano della loro misura.
 *
 * La fascia che li contiene e' alta "min(70%, 400px)": una percentuale del
 * riquadro, quindi allargando la coda i pulsanti diventavano enormi da soli.
 * Qui l'altezza torna a essere una misura fissa, che non dipende da quanto e'
 * grande la finestra.
 */
.rn-queue__answer-btns {
  max-height: ${ANSWER_BUTTONS_HEIGHT}px !important;
}

.spaced-repetition__bottom {
  max-height: ${ANSWER_BUTTONS_HEIGHT + 56}px !important;
}`;
}

/** Rilegge l'impostazione e riapplica il CSS */
export async function applyQueueFullscreen(plugin: RNPlugin): Promise<void> {
  const enabled = await plugin.settings.getSetting<boolean>(SETTING_QUEUE_FULLSCREEN);
  await plugin.app.registerCSS(CSS_ID, queueFullscreenCss(enabled === true));
}
