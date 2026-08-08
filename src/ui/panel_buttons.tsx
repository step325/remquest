import { usePlugin } from '@remnote/plugin-sdk';
import { PANEL_CLOSE, say } from '../lib/panel_link';
import type { Translate } from '../lib/i18n/index';

/**
 * I bottoni del pannello che hanno bisogno del motore.
 *
 * Il pannello gira in un iframe suo e non puo' chiudersi da solo: sa farlo solo
 * chi ha aperto il riquadro, e l'unico modo per chiederglielo e' un messaggio
 * (src/lib/panel_link.ts).
 */

/**
 * Chiude il riquadro del pannello.
 *
 * Il pannello non puo' chiudersi da solo: l'identificativo del riquadro
 * fluttuante ce l'ha chi lo ha aperto, cioe' il motore. Da qui parte solo la
 * richiesta.
 */
export function CloseButton({ t }: { t: Translate }) {
  const plugin = usePlugin();
  return (
    <button
      className="rq-close"
      type="button"
      title={t('panel.close')}
      aria-label={t('panel.close')}
      onClick={() => void plugin.messaging.broadcast(say(PANEL_CLOSE))}
    >
      ×
    </button>
  );
}
