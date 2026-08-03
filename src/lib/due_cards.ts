/**
 * Card da ripassare oggi, contate dai deck.
 *
 * `plugin.card.getAll()` non esiste piu' e `deck.getCards()` restituisce 0: le
 * card non stanno sul deck ma sui suoi discendenti (3240 su questa knowledge
 * base, recuperati in poco piu' di 100 ms). Si scandiscono a gruppi, in
 * parallelo, contando solo le card gia' studiate e tornate in scadenza — cio'
 * che RemNote chiama "Due Reviews".
 */

import { BuiltInPowerupCodes, type RNPlugin } from '@remnote/plugin-sdk';
import type { RemObject } from '@remnote/plugin-sdk/dist/name_spaces/rem';
import { findDecks } from './decks';
import { countCards } from './cards';
import { parseDailyGoal } from './exams';

/** Quanti rem interrogare in parallelo: abbastanza da non fare 3000 giri in fila */
const BATCH_SIZE = 64;

/** Tetto di sicurezza: meglio nessun numero che bloccare il plugin per minuti */
const MAX_REMS = 8000;

export interface DueCount {
  /** Card da fare oggi: l'arretrato limitato all'obiettivo giornaliero */
  today: number;
  /** Tutte le card scadute, cioe' l'arretrato completo */
  backlog: number;
  /** Rem effettivamente interrogati, per capire se il conteggio e' completo */
  remsScanned: number;
}

/** Somma degli obiettivi giornalieri dei deck, se ne dichiarano uno */
async function dailyGoalOf(decks: RemObject[], now: Date): Promise<number | null> {
  let total = 0;
  for (const deck of decks) {
    try {
      const goal = parseDailyGoal(
        await deck.getPowerupProperty(BuiltInPowerupCodes.Deck, 'ExamConfig'),
        now
      );
      if (goal !== undefined) total += goal;
    } catch {
      continue; // deck senza configurazione d'esame
    }
  }
  return total > 0 ? total : null;
}

async function countInRems(rems: RemObject[], now: number): Promise<number> {
  let due = 0;
  const seen = new Set<string>();

  for (let i = 0; i < rems.length; i += BATCH_SIZE) {
    const batch = rems.slice(i, i + BATCH_SIZE);
    const results = await Promise.all(
      batch.map(async (rem) => {
        try {
          // I rem con le card disattivate non finiscono mai in coda: contarli
          // gonfierebbe l'arretrato con roba che non si ripassera' mai.
          if (await rem.hasPowerup(BuiltInPowerupCodes.DisableCards)) return [];
          return await rem.getCards();
        } catch {
          return [];
        }
      })
    );

    for (const cards of results) {
      // Lo stesso rem puo' comparire sotto piu' deck: le card si contano una volta
      const fresh = cards.filter((card) => !seen.has(card._id));
      for (const card of fresh) seen.add(card._id);
      due += countCards(fresh, now).due;
    }
  }

  return due;
}

export async function countDueCards(plugin: RNPlugin): Promise<DueCount | null> {
  const { decks } = await findDecks(plugin);
  if (decks.length === 0) return null;

  // I discendenti dei deck sono i rem che portano le card
  const rems = new Map<string, RemObject>();
  for (const deck of decks) {
    try {
      for (const rem of await deck.getDescendants()) rems.set(rem._id, rem);
    } catch {
      continue;
    }
    if (rems.size >= MAX_REMS) break;
  }

  if (rems.size === 0) return null;

  const now = new Date();
  const scanned = [...rems.values()].slice(0, MAX_REMS);
  const backlog = await countInRems(scanned, now.getTime());

  // RemNote non chiede tutto l'arretrato in un giorno: lo spalma fino alla data
  // d'esame. Il boss deve valere quanto la fetta di oggi, non quanto il totale.
  const goal = await dailyGoalOf(decks, now);
  return {
    today: goal === null ? backlog : Math.min(backlog, goal),
    backlog,
    remsScanned: scanned.length,
  };
}
