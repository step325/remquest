/**
 * Il negozio — catalogo e regole d'acquisto, logica pura.
 *
 * Sta nel pannello e non nella coda: davanti alle flashcard si sta studiando, e
 * mettere li' una vetrina significa dare un motivo per smettere.
 *
 * Niente potenziamenti: vedi la nota in src/lib/wallet.ts. Si vendono cose che
 * cambiano l'aspetto o che tolgono un fastidio, non che gonfiano i numeri.
 */

import { MAX_STREAK_TOKENS } from './gamification';
import type { StringKey } from './i18n/index';
import { themeClassById } from './themes';
import { type Wallet, freshWallet } from './wallet';

/**
 * Cosa fa un articolo quando lo compri.
 * `theme` e `companion` si possiedono e poi si indossano; `token` si consuma
 * subito e si puo' ricomprare.
 */
export type ItemKind = 'theme' | 'companion' | 'token';

export interface Item {
  id: string;
  kind: ItemKind;
  price: number;
}

/**
 * Le frasi di un articolo stanno nel dizionario, non qui: `item.<id>` per il
 * nome e `item.<id>.desc` per la riga sotto. Il catalogo tiene solo quello che
 * non cambia da una lingua all'altra — che cos'e' e quanto costa.
 */
export const itemNameKey = (id: string) => `item.${id}` as StringKey;
export const itemDescKey = (id: string) => `item.${id}.desc` as StringKey;

export const CATALOG: readonly Item[] = [
  // --- Temi: la palette e' gia' un blocco di variabili, cambiarle e' tutto ---
  {
    id: 'theme:gameboy',
    kind: 'theme',
    price: 300,
  },
  {
    id: 'theme:crypt',
    kind: 'theme',
    price: 300,
  },
  {
    id: 'theme:forge',
    kind: 'theme',
    price: 300,
  },
  {
    id: 'theme:parchment',
    kind: 'theme',
    price: 400,
  },

  // --- Compagni: stanno accanto a te nell'HUD e non fanno nient'altro ---
  {
    id: 'pet:tome',
    kind: 'companion',
    price: 250,
  },
  {
    id: 'pet:cat',
    kind: 'companion',
    price: 300,
  },
  {
    id: 'pet:owl',
    kind: 'companion',
    price: 300,
  },
  {
    id: 'pet:dragonling',
    kind: 'companion',
    price: 400,
  },
  {
    id: 'pet:ghostling',
    kind: 'companion',
    price: 250,
  },
  {
    id: 'pet:golem',
    kind: 'companion',
    price: 350,
  },
  {
    id: 'pet:fire',
    kind: 'companion',
    price: 350,
  },
  {
    id: 'pet:slime',
    kind: 'companion',
    price: 250,
  },

  // --- L'unica merce con un'utilita' vera ---
  {
    id: 'token',
    kind: 'token',
    price: 350,
  },
];

export const itemById = (id: string): Item | undefined => CATALOG.find((i) => i.id === id);

/** Perche' un articolo non si puo' comprare adesso */
export type Refusal = 'sconosciuto' | 'monete' | 'gia-posseduto' | 'gettoni-al-massimo';

export interface Purchase {
  wallet: Wallet;
  /** Gettoni da aggiungere alla serie: solo l'articolo consumabile ne produce */
  tokens: number;
}

/**
 * Compra un articolo.
 *
 * Restituisce il motivo del rifiuto invece di un semplice `null`: chi chiama
 * deve poter dire *perche'* non si puo', altrimenti il pulsante che non fa
 * niente sembra rotto.
 */
export function buy(
  wallet: Wallet,
  itemId: string,
  currentTokens: number
): Purchase | { refused: Refusal } {
  const item = itemById(itemId);
  if (!item) return { refused: 'sconosciuto' };

  const consumabile = item.kind === 'token';
  if (!consumabile && wallet.owned.includes(item.id)) return { refused: 'gia-posseduto' };
  if (consumabile && currentTokens >= MAX_STREAK_TOKENS) {
    return { refused: 'gettoni-al-massimo' };
  }
  if (wallet.coins < item.price) return { refused: 'monete' };

  const speso = { ...wallet, coins: wallet.coins - item.price };
  if (consumabile) return { wallet: speso, tokens: 1 };

  // Comprato e gia' indossato: costringere a un secondo clic per metterselo
  // sarebbe un passaggio in piu' senza nessuna decisione dentro.
  const owned = [...speso.owned, item.id];
  const worn = item.kind === 'theme' ? { theme: item.id } : { companion: item.id };

  return { wallet: { ...speso, owned, ...worn }, tokens: 0 };
}

/** Indossa qualcosa che si possiede gia'; l'identificativo vuoto torna al normale */
export function wear(wallet: Wallet, kind: ItemKind, id: string): Wallet {
  if (id !== '' && !wallet.owned.includes(id)) return wallet;
  if (kind === 'theme') return { ...wallet, theme: id };
  if (kind === 'companion') return { ...wallet, companion: id };
  return wallet;
}

export interface NextUnlock {
  item: Item;
  /** Monete che mancano; zero se ci si puo' gia' permettere l'articolo */
  missing: number;
  /** Quanto si e' vicini, da 0 a 100 */
  percent: number;
}

/**
 * Il prossimo sblocco: l'articolo comprabile piu' vicino al saldo.
 *
 * Senza, il negozio dice quanto hai ma mai quanto ti manca, e le monete
 * restano un numero che sale invece di un obiettivo. Si sceglie il piu'
 * economico fra quelli non ancora presi: e' quello che si raggiunge prima, e
 * un traguardo vicino tira piu' di uno lontano.
 */
export function nextUnlock(wallet: Wallet): NextUnlock | null {
  const disponibili = CATALOG.filter(
    (i) => i.kind === 'token' || !wallet.owned.includes(i.id)
  ).sort((a, b) => a.price - b.price);

  const item = disponibili.find((i) => i.price > wallet.coins) ?? disponibili[0];
  if (!item) return null; // comprato tutto: non c'e' piu' niente da inseguire

  const missing = Math.max(0, item.price - wallet.coins);
  return {
    item,
    missing,
    percent: Math.min(100, Math.round((wallet.coins / item.price) * 100)),
  };
}

/**
 * La classe del tema indossato, da mettere accanto a `px`.
 *
 * La traduzione da identificativo (`theme:gameboy`) a classe (`theme-gameboy`)
 * sta in themes.ts: l'anteprima della vetrina passa di li' senza portafoglio,
 * e due copie della stessa regola prima o poi divergono.
 */
export function themeClass(wallet: Wallet): string {
  return themeClassById(wallet.theme);
}


export { freshWallet };
