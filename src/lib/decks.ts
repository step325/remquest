/**
 * Come si arriva ai deck.
 *
 * Verificato su una knowledge base vera: `card.getAll` e `rem.getAll` sono
 * deprecati e non piu' disponibili, `taggedRem()` sui powerup restituisce
 * sempre 0 e i loro figli sono gli slot, non i rem che li usano. L'unica via
 * rimasta e' `plugin.search.search()`, che risponde in decine di millisecondi:
 * si cercano parole molto comuni, si tiene chi ha il powerup Deck e da li' si
 * guardano anche i fratelli, cosi' i deck archiviati insieme vengono presi
 * tutti.
 */

import { BuiltInPowerupCodes, type RNPlugin } from '@remnote/plugin-sdk';
import type { RemObject } from '@remnote/plugin-sdk/dist/name_spaces/rem';

/** Parole cosi' frequenti da comparire in quasi ogni titolo */
const SEED_TERMS = ['a', 'e', 'i', 'o', 'di', 'la', 'il', 'the', 'of', 'esame', 'exam'];

const RESULTS_PER_TERM = 50;

async function collectBySearch(plugin: RNPlugin): Promise<Map<string, RemObject>> {
  const found = new Map<string, RemObject>();

  for (const term of SEED_TERMS) {
    try {
      const results = await plugin.search.search([term], undefined, {
        numResults: RESULTS_PER_TERM,
      });
      for (const rem of results) found.set(rem._id, rem);
    } catch {
      // Un termine che non da' risultati non deve fermare gli altri
    }
  }

  return found;
}

/** Aggiunge i fratelli dei deck trovati: gli esami stanno spesso vicini */
async function withSiblings(decks: RemObject[]): Promise<RemObject[]> {
  const all = new Map(decks.map((deck) => [deck._id, deck]));

  for (const deck of decks) {
    try {
      const parent = await deck.getParentRem();
      if (!parent) continue;
      for (const sibling of await parent.getChildrenRem()) {
        if (!all.has(sibling._id) && (await sibling.hasPowerup(BuiltInPowerupCodes.Deck))) {
          all.set(sibling._id, sibling);
        }
      }
    } catch {
      // Deck senza genitore accessibile: si tiene solo lui
    }
  }

  return [...all.values()];
}

export interface DeckSearch {
  decks: RemObject[];
  /** Quanti rem sono stati esaminati, per distinguere "non trovati" da "non cercati" */
  remsSearched: number;
}

export async function findDecks(plugin: RNPlugin): Promise<DeckSearch> {
  const candidates = await collectBySearch(plugin);

  const decks: RemObject[] = [];
  for (const rem of candidates.values()) {
    if (await rem.hasPowerup(BuiltInPowerupCodes.Deck)) decks.push(rem);
  }

  return { decks: await withSiblings(decks), remsSearched: candidates.size };
}
