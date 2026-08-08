import { declareIndexPlugin, type ReactRNPlugin, WidgetLocation } from '@remnote/plugin-sdk';
import { type Engine, startEngine } from '../lib/engine';
import { treeWithoutWidgetPanes } from '../lib/panes';
import { refreshExams } from '../lib/read_exams';
import { runDiagnostics } from '../lib/diagnostics';
import { playFxDemo } from '../lib/fx_demo';
import { applyQueueFullscreen, registerFullscreenSetting } from '../lib/queue_fullscreen';
import { KEY_BOSS, freshBossState } from '../lib/storage';
import { type FloatingPanel, PANEL_SIZE, floatingPanel } from '../lib/floating_panel';
import { sidebarIconCss } from '../lib/sidebar_icon';
import { spriteDataUrl } from '../ui/sprite_png';
import { QUEST_ICON } from '../ui/sprites';

/**
 * Il nome che RemNote mostra.
 *
 * Deve restare uguale a quello del manifest: finisce nel `data-test` del
 * bottone della barra, che e' l'aggancio con cui il CSS sostituisce l'icona
 * (src/lib/sidebar_icon.ts). Un test tiene insieme i due.
 */
const PLUGIN_NAME = 'Remquest';

const WIDGET = 'panel';
const HUD = 'queue_hud';
const TOAST = 'toast';

/**
 * Altezza della striscia di gioco nella coda.
 *
 * Ci deve stare la salita dei numeri di danno: l'iframe di un widget taglia
 * tutto quello che esce dai suoi bordi, quindi lo spazio per l'animazione va
 * chiesto qui e non si puo' recuperare dal CSS.
 *
 * RemNote la tratta come altezza desiderata, non come minimo: quando la coda
 * mostra i bottoni di risposta la comprime lo stesso. L'HUD e' fatto per
 * reggere la compressione (vedi le media query in hud.css), questo valore
 * serve a renderla rara.
 */
const HUD_HEIGHT = 148;

let engine: Engine | undefined;
let panel: FloatingPanel | undefined;

async function onActivate(plugin: ReactRNPlugin) {
  // Il conteggio degli XP vive qui, non nel widget: entrando nella coda a
  // schermo intero il pannello puo' non essere aperto, e i listener che
  // vivessero dentro di lui morirebbero con lui.
  const motore = startEngine(plugin);
  engine = motore;

  // Riquadro sovrapposto, non barra laterale e non Pane. La barra destra non si
  // puo' ne' chiudere ne' leggere e ogni navigazione ci lasciava dentro
  // l'elenco dei plugin di RemNote; il Pane rompe il layout ("Cannot parse
  // window string"). Il riquadro fluttuante si apre, si chiude, risponde se e'
  // aperto, e nessuna navigazione se lo porta via.
  const pannello = floatingPanel(plugin, WIDGET);
  panel = pannello;

  await plugin.app.registerWidget(WIDGET, WidgetLocation.FloatingWidget, {
    dimensions: PANEL_SIZE,
    widgetTabTitle: PLUGIN_NAME,
  });

  // HUD di gioco dentro la coda: e' li' che si sta giocando davvero, quindi e'
  // li' che devono comparire danni, combo e caduta del boss.
  await plugin.app.registerWidget(HUD, WidgetLocation.QueueBelowTopBar, {
    dimensions: { height: HUD_HEIGHT, width: '100%' },
  });

  // Avviso a pixel per livello, missione, boss battuto e serie di giorni: lo
  // apre il motore al posto della notifica di sistema, che non e' stilabile.
  await plugin.app.registerWidget(TOAST, WidgetLocation.FloatingWidget, {
    dimensions: { height: 'auto', width: 300 },
  });

  // Lo stesso bottone apre e chiude: un pannello che si apre e basta obbliga a
  // cercare la × ogni volta, e la voce di barra e' li' sotto il pollice.
  const open = {
    id: 'remquest-open',
    name: PLUGIN_NAME,
    action: () => void pannello.toggle(),
  };
  await plugin.app.registerSidebarButton(open);
  await plugin.app.registerCommand(open);
  await applySidebarIcon(plugin);

  // La via d'uscita se il pannello e' finito dove il mouse non lo raggiunge: il
  // limite del trascinamento e' il monitor, non la finestra di RemNote.
  await plugin.app.registerCommand({
    id: 'remquest-panel-home',
    name: `${PLUGIN_NAME}: bring the panel back`,
    description: 'Puts the panel back in the top right corner',
    action: () => void pannello.home(),
  });

  await plugin.app.registerCommand({
    id: 'remquest-close-stale-panes',
    name: `${PLUGIN_NAME}: close leftover panes`,
    description: 'Strips plugin panes that break RemNote\'s window layout out of the tree',
    action: () => void closeStalePanes(plugin),
  });

  await plugin.app.registerCommand({
    id: 'remquest-refresh-exams',
    name: `${PLUGIN_NAME}: refresh exams`,
    description: 'Re-reads the decks that carry an exam date',
    action: () => void reportExams(plugin),
  });

  await plugin.app.registerCommand({
    id: 'remquest-diagnostics',
    name: `${PLUGIN_NAME}: API diagnostics`,
    description: 'Probes the RemNote APIs and stores what answered',
    action: () => void runDiagnostics(plugin).then((lines) => plugin.app.toast(lines[0])),
  });

  await plugin.app.registerCommand({
    id: 'remquest-fx-demo',
    name: `${PLUGIN_NAME}: play the effects`,
    description: 'Runs a fake sequence of hits, combo, level up and boss down',
    // Serve una scorciatoia perche' gli effetti si guardano dentro la coda a
    // schermo intero, dove la barra dei comandi non si raggiunge. Evita i tasti
    // che la coda usa gia' (1-4, spazio, R).
    keyboardShortcut: 'alt+shift+d',
    action: () => void playFxDemo(plugin),
  });

  await plugin.app.registerCommand({
    id: 'remquest-reset-boss',
    name: `${PLUGIN_NAME}: reset today\'s boss`,
    description: 'Throws away today\'s boss; the next queue measures it again',
    action: () => void plugin.storage.setLocal(KEY_BOSS, freshBossState()),
  });

  // Il tutto schermo e' CSS iniettato nell'app, non nel widget: va riapplicato
  // quando l'interruttore cambia, non solo all'avvio.
  await registerFullscreenSetting(plugin);
  plugin.track(async (rp) => {
    await applyQueueFullscreen(rp);
  });

  await closeStalePanes(plugin);
}

/**
 * Mette la spada al posto del puzzle nella barra laterale.
 *
 * L'SDK accetta un campo `icon` sul pulsante ma non lo spedisce all'app
 * (0.0.46), quindi si passa dal CSS globale. Se qualcosa non riesce — un
 * canvas che non c'e', un selettore che RemNote ha cambiato — resta il
 * puzzle: e' un dettaglio d'aspetto, non deve poter fermare l'avvio.
 */
async function applySidebarIcon(plugin: ReactRNPlugin) {
  try {
    const disegno = spriteDataUrl(QUEST_ICON);
    if (disegno === '') return;
    await plugin.app.registerCSS('remquest-sidebar-icon', sidebarIconCss(PLUGIN_NAME, disegno));
  } catch {
    // Nessun disegno: il pulsante funziona lo stesso
  }
}

/** Rilegge gli esami e dice com'e' andata */
async function reportExams(plugin: ReactRNPlugin) {
  const { exams, decksScanned, error } = await refreshExams(plugin);
  if (error) return void plugin.app.toast(`Exams: ${error}`);
  await plugin.app.toast(
    exams.length > 0
      ? `Found ${exams.length} exams across ${decksScanned} decks`
      : `No exam date in the ${decksScanned} decks checked`
  );
}

/** Rimuove i pane di plugin lasciati nel layout dalle versioni precedenti */
async function closeStalePanes(plugin: ReactRNPlugin) {
  try {
    const cleaned = treeWithoutWidgetPanes(await plugin.window.getCurrentWindowTree());
    if (cleaned !== null) await plugin.window.setRemWindowTree(cleaned);
  } catch {
    // Layout illeggibile: restano da chiudere a mano, non c'e' altro da fare
  }
}

async function onDeactivate() {
  engine?.stop();
  engine = undefined;
  panel?.stop();
  panel = undefined;
}

declareIndexPlugin(onActivate, onDeactivate);
