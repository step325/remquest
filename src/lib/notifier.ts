/**
 * Avvisi a schermo per gli eventi rari: livello, missione, serie di giorni.
 *
 * Gli XP di ogni card non passano di qui — li mostra l'HUD della coda, dove
 * uno sta gia' guardando. Restano gli annunci che vale la pena non perdere.
 *
 * Non usa `plugin.app.toast`, che disegna la notifica di sistema di RemNote e
 * non si puo' stilare: apre invece il widget `toast`, che e' roba nostra e ha
 * la cornice a pixel del resto del gioco. Il widget legge da solo l'ultimo
 * evento da annunciare; qui si decide solo quando aprirlo e quando chiuderlo.
 */

import type { RNPlugin } from '@remnote/plugin-sdk';

/** Quanto resta a schermo un annuncio */
const TOAST_MS = 3_600;

/** Distanza dal bordo: sotto la barra in alto, a destra */
const POSITION = { top: 72, right: 24 };

export class Notifier {
  /** Identificativo dell'avviso aperto, per poterlo chiudere */
  private open: string | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor(private readonly plugin: RNPlugin) {}

  /**
   * Mostra l'avviso. Il testo non si passa: il widget legge l'ultimo evento
   * dallo stesso canale degli effetti, ed e' gia' stato scritto da chi chiama.
   */
  now(): void {
    void this.show();
  }

  /** Chiude l'avviso aperto, se c'e' */
  async close(): Promise<void> {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    const id = this.open;
    this.open = null;
    if (id) await this.plugin.window.closeFloatingWidget(id).catch(() => undefined);
  }

  private async show(): Promise<void> {
    // Un annuncio alla volta: se ne arriva un altro mentre il primo e' ancora
    // a schermo, il secondo prende il suo posto invece di accavallarcisi.
    await this.close();
    try {
      this.open = await this.plugin.window.openFloatingWidget('toast', POSITION);
    } catch {
      // Se il widget fluttuante non si apre, l'evento resta comunque scritto
      // nel Remquest: meglio nessun avviso che un errore in faccia.
      this.open = null;
      return;
    }
    this.timer = setTimeout(() => void this.close(), TOAST_MS);
  }
}
