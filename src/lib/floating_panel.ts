/**
 * Il pannello come riquadro sovrapposto, e dove sta.
 *
 * Prima stava nella barra di destra, e li' non si poteva fare niente: l'SDK
 * 0.0.46 espone solo `openWidgetInRightSidebar` — nessun modo di chiuderla,
 * di leggerne il contenuto, di sapere che l'utente ha tolto il pannello. Ogni
 * navigazione se lo portava via e al suo posto restava l'elenco dei plugin
 * installati, che nessun plugin puo' togliere.
 *
 * Il riquadro fluttuante ha le quattro cose che mancavano: si apre, si chiude,
 * si puo' chiedere se e' aperto e si puo' spostare. E non viene sfrattato da
 * una navigazione, perche' non e' dentro nessun pannello di RemNote.
 *
 * L'alternativa, un pane vero, resta impraticabile: RemNote non sa
 * riserializzare un pane di plugin e basta ridimensionare la finestra per
 * ottenere `Cannot parse window string` (vedi panes.ts).
 */

import { AppEvents, type RNPlugin } from '@remnote/plugin-sdk';
import { PANEL_CLOSE, PANEL_MOVE, heard, moveOf } from './panel_link';
import {
  type Position,
  type Size,
  clampPosition,
  movedBy,
  normalizePosition,
} from './panel_position';
import { KEY_PANEL_POS } from './storage';

/**
 * Misura del riquadro.
 *
 * Sta qui e non in index.tsx perche' serve in due punti che devono per forza
 * dire lo stesso numero: la registrazione del widget e il limite oltre cui non
 * si puo' trascinare. Se i due divergessero, il pannello si potrebbe portare
 * fuori proprio della misura sbagliata.
 *
 * Altezza fissa e non `auto`: il pannello scorre dentro di se' (`.rq` in
 * panel.css usa `height: 100vh`, che dentro un iframe e' l'altezza
 * dell'iframe), e senza un'altezza dichiarata non ci sarebbe niente da far
 * scorrere. Sotto i 700 px perche' con `top: 64` deve entrare anche in una
 * finestra da portatile.
 */
export const PANEL_SIZE: Size = { width: 380, height: 600 };

/** Dove si apre la prima volta: sotto la barra in alto, appoggiato a destra */
const HOME: Position = { top: 64, right: 20 };

/**
 * Quanto si aspetta la fine del trascinamento prima di salvare.
 *
 * Trascinando arrivano decine di spostamenti al secondo: scrivere ad ognuno
 * vorrebbe dire decine di scritture nello storage per un dato che interessa
 * solo a mouse fermo.
 */
const SAVE_AFTER_MS = 600;

/**
 * L'area entro cui il riquadro deve restare per intero.
 *
 * E' il monitor e non la finestra di RemNote: la finestra non e' leggibile da
 * qui — l'index widget vive in un iframe di un'altra origine, e `parent` non si
 * puo' interrogare. Con RemNote a tutto schermo le due coincidono; in una
 * finestra piccola il pannello puo' ancora finire oltre il bordo
 * dell'applicazione, e per quel caso c'e' il comando che lo richiama al suo
 * posto.
 */
function screenArea(): Size {
  if (typeof screen === 'undefined') return { width: 1920, height: 1080 };
  return {
    width: screen.availWidth || screen.width || 1920,
    height: screen.availHeight || screen.height || 1080,
  };
}

export interface FloatingPanel {
  /** Lo apre se e' chiuso, lo chiude se e' aperto */
  toggle: () => Promise<void>;
  /** Lo rimette dove si apre di suo, e dimentica dove era stato trascinato */
  home: () => Promise<void>;
  /** Chiude il riquadro e stacca gli ascoltatori */
  stop: () => void;
}

export function floatingPanel(plugin: RNPlugin, widget: string): FloatingPanel {
  /** Identificativo del riquadro aperto, l'unica cosa che serve per governarlo */
  let openId: string | null = null;
  /** Dove sta adesso: la tiene qui perche' il pannello non sa dove si trova */
  let position: Position = HOME;
  let saveTimer: ReturnType<typeof setTimeout> | undefined;

  const close = async () => {
    const id = openId;
    openId = null;
    if (id) await plugin.window.closeFloatingWidget(id).catch(() => undefined);
  };

  /**
   * Se il riquadro e' aperto adesso.
   *
   * Si chiede a RemNote invece di fidarsi dell'identificativo: il riquadro puo'
   * essere stato chiuso da qualcos'altro — un ricaricamento, un cambio di
   * finestra — e un identificativo vecchio farebbe credere aperto un pannello
   * che non c'e' piu', lasciando il pulsante a chiuderlo invece che ad aprirlo.
   */
  const isOpen = async () => {
    if (openId === null) return false;
    try {
      return await plugin.window.isFloatingWidgetOpen(openId);
    } catch {
      return false;
    }
  };

  const toggle = async () => {
    if (await isOpen()) {
      await close();
      return;
    }
    openId = null;
    // Si riapre dove l'utente l'aveva lasciato: averlo spostato una volta e
    // ritrovarlo nell'angolo al riavvio sarebbe come non averlo spostato.
    // Il limite si riapplica ad ogni apertura: uno schermo cambiato, o una
    // posizione salvata da una versione con regole piu' larghe, non deve
    // riportare il pannello fuori dai bordi.
    position = clampPosition(
      normalizePosition(await plugin.storage.getLocal(KEY_PANEL_POS)) ?? HOME,
      screenArea(),
      PANEL_SIZE
    );
    try {
      // `closeWhenClickOutside` a false: e' un pannello da tenere aperto mentre
      // si lavora, e uno che sparisce al primo clic sugli appunti non lo e'.
      openId = await plugin.window.openFloatingWidget(widget, position, undefined, false);
    } catch {
      // Il riquadro non si e' aperto: si riprova al prossimo clic, non c'e'
      // niente da riparare e niente da annunciare.
      openId = null;
    }
  };

  /**
   * Sposta il riquadro di quanto si e' mosso il mouse.
   *
   * Il pannello manda spostamenti e non posizioni: dentro il suo iframe le
   * coordinate ripartono da zero, quindi dove sia sullo schermo non lo sa.
   */
  const moveBy = (delta: { dx: unknown; dy: unknown }) => {
    if (openId === null) return;
    const next = movedBy(position, delta.dx, delta.dy, screenArea(), PANEL_SIZE);
    if (next.top === position.top && next.right === position.right) return;
    void moveTo(next);
  };

  /** Porta il riquadro in una posizione gia' controllata, e la ricorda */
  const moveTo = async (next: Position) => {
    position = next;
    if (openId !== null) {
      await plugin.window.setFloatingWidgetPosition(openId, position).catch(() => undefined);
    }
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      saveTimer = undefined;
      void plugin.storage.setLocal(KEY_PANEL_POS, position);
    }, SAVE_AFTER_MS);
  };

  /**
   * La via d'uscita.
   *
   * Il limite del trascinamento e' il monitor, non la finestra di RemNote: in
   * una finestra piccola il pannello puo' comunque finire oltre il bordo
   * dell'applicazione. Da li' non lo si riprende col mouse, e questo comando e'
   * l'unico modo di riaverlo.
   */
  const home = async () => {
    await moveTo(clampPosition(HOME, screenArea(), PANEL_SIZE));
  };

  /**
   * Le richieste del pannello: chiudersi e spostarsi non puo' farle da solo,
   * l'identificativo del riquadro ce l'ha soltanto chi lo ha aperto.
   */
  const onMessage = (payload: unknown) => {
    const kind = heard(payload);
    if (kind === PANEL_CLOSE) return void close();
    if (kind !== PANEL_MOVE) return;
    const delta = moveOf(payload);
    if (delta) moveBy(delta);
  };

  plugin.event.addListener(AppEvents.MessageBroadcast, undefined, onMessage);

  return {
    toggle,
    home,
    stop: () => {
      if (saveTimer) clearTimeout(saveTimer);
      saveTimer = undefined;
      plugin.event.removeListener(AppEvents.MessageBroadcast, undefined, onMessage);
      void close();
    },
  };
}
