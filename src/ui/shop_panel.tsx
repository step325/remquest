/**
 * La vetrina del negozio.
 *
 * Ogni riga dice il prezzo e, quando non si puo' comprare, *perche'*: un
 * pulsante che non fa niente sembra rotto, e chi guarda non ha modo di sapere
 * se gli mancano monete o se ce l'ha gia'.
 */

import { CATALOG, type Item, type Refusal, itemDescKey, itemNameKey, nextUnlock } from '../lib/shop';
import type { StringKey, Translate } from '../lib/i18n/index';
import { companionSprite } from './companions';
import { Companion } from './hud';
import { itemIcon } from './item_icons';
import { PixelSprite } from './pixel_sprite';
import type { Wallet } from '../lib/wallet';

/** Il motivo del rifiuto, scritto per chi legge */
const WHY: Record<Refusal, StringKey> = {
  sconosciuto: 'shop.refuseUnknown',
  monete: 'shop.refuseCoins',
  'gia-posseduto': 'shop.refuseOwned',
  'gettoni-al-massimo': 'shop.refuseTokens',
};

function refusalFor(item: Item, wallet: Wallet, tokens: number, maxTokens: number): Refusal | null {
  if (item.kind === 'token') {
    if (tokens >= maxTokens) return 'gettoni-al-massimo';
  } else if (wallet.owned.includes(item.id)) {
    return 'gia-posseduto';
  }
  return wallet.coins < item.price ? 'monete' : null;
}

/**
 * Il prossimo sblocco.
 *
 * Va anche nel Diario, non solo nell'Emporio: se sta solo in vetrina lo vede
 * chi e' gia' andato a comprare, cioe' chi non ha bisogno di essere invogliato.
 */
export function NextUnlock({ wallet, t }: { wallet: Wallet; t: Translate }) {
  const next = nextUnlock(wallet);
  if (!next) return null;

  return (
    <div className="rq-next">
      <div className="rq-next-top">
        <span className="px-label">{t('shop.next')}</span>
        <span className="px-value">{t(itemNameKey(next.item.id))}</span>
      </div>
      <div className="px-bar">
        <div className="px-bar-fill px-fill-xp" style={{ width: `${next.percent}%` }} />
      </div>
      <div className="rq-next-note">
        {next.missing === 0
          ? t('shop.nextNow', { n: next.item.price })
          : t('shop.nextMissing', { a: next.missing, b: next.item.price })}
      </div>
    </div>
  );
}

export function ShopPanel({
  t,
  wallet,
  tokens,
  maxTokens,
  onBuy,
  onWear,
}: {
  t: Translate;
  wallet: Wallet;
  tokens: number;
  maxTokens: number;
  onBuy: (id: string) => void;
  onWear: (item: Item) => void;
}) {
  return (
    <>
      {/* Niente "prossimo sblocco" qui: in vetrina i prezzi ci sono gia' tutti,
          e ripetere quello piu' vicino sopra l'elenco che lo contiene e' una
          riga che non aggiunge niente. Nel Diario invece serve, perche' li' il
          negozio non si vede. */}
      <div className="rq-coins">{t('shop.coins', { n: wallet.coins.toLocaleString() })}</div>
      <ul className="rq-shop">
        {CATALOG.map((item) => {
          const refusal = refusalFor(item, wallet, tokens, maxTokens);
          const owned = item.kind !== 'token' && wallet.owned.includes(item.id);
          const worn =
            (item.kind === 'theme' && wallet.theme === item.id) ||
            (item.kind === 'companion' && wallet.companion === item.id);

          return (
            <li key={item.id} className={`rq-shop-item${worn ? ' is-worn' : ''}`}>
              {/* Un compagno si compra per come e' fatto: senza l'anteprima si
                  starebbe comprando una parola. */}
              {/* La gabbia c'e' sempre, anche vuota: senza, le righe con
                  sprite e quelle senza partirebbero da due punti diversi. */}
              {/* Il compagno si muove anche in vetrina: fermo sembra un
                  adesivo, e non si capisce che una volta comprato vive. */}
              {/* Ogni riga ha il suo disegno: i compagni si muovono, gli altri
                  articoli hanno un'icona. Meta' righe illustrate e meta' vuote
                  facevano sembrare l'elenco incompleto. */}
              <span className="rq-shop-preview">
                {companionSprite(item.id) ? (
                  <Companion id={item.id} hitSeq={0} mood={worn ? 'happy' : 'idle'} />
                ) : (
                  itemIcon(item.id) && <PixelSprite sprite={itemIcon(item.id)!} scale={2} />
                )}
              </span>
              <div className="rq-shop-body">
                <span className="rq-shop-name">{t(itemNameKey(item.id))}</span>
                <span className="rq-shop-desc">{t(itemDescKey(item.id))}</span>
              </div>

              {owned ? (
                // Quello che si possiede si indossa o si toglie, non si ricompra
                <button
                  className="rq-button"
                  type="button"
                  onClick={() => onWear(item)}
                  disabled={worn}
                >
                  {worn ? t('shop.worn') : t('shop.wear')}
                </button>
              ) : (
                <button
                  className="rq-button"
                  type="button"
                  onClick={() => onBuy(item.id)}
                  disabled={refusal !== null}
                  title={refusal ? t(WHY[refusal]) : undefined}
                >
                  {refusal && refusal !== 'monete'
                    ? t(WHY[refusal]).toUpperCase()
                    : `${item.price}`}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </>
  );
}
