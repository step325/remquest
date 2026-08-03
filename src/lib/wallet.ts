/**
 * Monete e roba comprata — logica pura.
 *
 * Le monete arrivano dalle *azioni*, non dagli XP: una missione portata a
 * termine, un boss abbattuto, un'impresa sbloccata. Legarle agli XP sarebbe
 * contare due volte la stessa cosa, e trasformerebbe il negozio in un modo per
 * comprare valuta con altra valuta.
 *
 * Per lo stesso motivo qui non si vendono potenziamenti: in un gioco di ruolo
 * il potenziamento serve a battere mostri piu' forti, ma il mostro qui e' il
 * carico di ripasso e quello non si alleggerisce comprando niente. Un bonus XP
 * gonfierebbe solo i numeri, togliendo peso a ogni singola card.
 */

/*
 * Il ritmo del negozio.
 *
 * Una giornata perfetta paga trentacinque monete: tre missioni, il premio del
 * gruppo, la meta' del boss e il boss abbattuto. Il pezzo piu' economico ne
 * costa 250, quindi il primo acquisto arriva dopo una settimana buona e il
 * catalogo intero dopo tre mesi e mezzo.
 *
 * E' lento di proposito. Poter comprare il secondo giorno svuoterebbe il
 * negozio prima che il ripasso diventi un'abitudine, e l'abitudine e' il
 * punto: un premio raggiunto in due sere non fa tornare nessuno la terza.
 *
 * I numeri stanno in scala fra loro e un test li tiene fermi: alzarne uno
 * accorcia tutto il gioco, e va fatto sapendolo.
 */

/** Monete per una missione giornaliera completata */
export const COINS_PER_MISSION = 5;

/** Monete per aver completato tutte le missioni del giorno */
export const COINS_ALL_MISSIONS = 10;

/** Monete per aver portato il boss a meta' punti vita */
export const COINS_HALFWAY = 5;

/** Monete per un boss abbattuto */
export const COINS_PER_BOSS = 5;

/** Monete per un'impresa sbloccata: sono dodici in tutto, e non tornano */
export const COINS_PER_FEAT = 25;

export interface Wallet {
  /** Monete disponibili */
  coins: number;
  /** Monete guadagnate da sempre, per le statistiche */
  earned: number;
  /** Identificativi degli articoli posseduti */
  owned: string[];
  /** Tema attualmente indossato, vuoto per quello di serie */
  theme: string;
  /** Compagno che accompagna nell'HUD, vuoto per nessuno */
  companion: string;
}

export const freshWallet = (): Wallet => ({
  coins: 0,
  earned: 0,
  owned: [],
  theme: '',
  companion: '',
});

/** Aggiunge monete, tenendo aggiornato anche il totale di sempre */
export function earn(wallet: Wallet, amount: number): Wallet {
  if (!Number.isFinite(amount) || amount <= 0) return wallet;
  const coins = Math.floor(amount);
  return { ...wallet, coins: wallet.coins + coins, earned: wallet.earned + coins };
}

/** Quante monete fruttano le missioni cadute adesso */
export function missionCoins(completed: number, completedToday: number, perDay: number): number {
  if (completed <= 0) return 0;
  const base = completed * COINS_PER_MISSION;
  // Il premio del gruppo si paga una volta sola, come per gli XP.
  const tris = completedToday >= perDay && completedToday - completed < perDay;
  return base + (tris ? COINS_ALL_MISSIONS : 0);
}

function count(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
}

function text(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

export function normalizeWallet(value: unknown): Wallet {
  if (!value || typeof value !== 'object') return freshWallet();
  const p = value as Record<string, unknown>;
  const owned = Array.isArray(p.owned)
    ? [...new Set(p.owned.filter((v): v is string => typeof v === 'string'))]
    : [];
  const earned = count(p.earned);
  const coins = count(p.coins);
  return {
    coins,
    // Il guadagnato non puo' essere meno di quello che si ha in mano: uno
    // storage a meta' strada darebbe una statistica impossibile.
    earned: Math.max(earned, coins),
    owned,
    theme: text(p.theme),
    companion: text(p.companion),
  };
}
