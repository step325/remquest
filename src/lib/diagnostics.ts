/**
 * Diagnostica delle API RemNote.
 *
 * Serve a smettere di tirare a indovinare: prova le chiamate una per una,
 * misura quanto ci mettono e riporta cosa restituiscono davvero.
 *
 * Gia' appurato su una knowledge base vera:
 * - `card.getAll` e `rem.getAll` sono deprecati e non disponibili;
 * - `taggedRem()` sui powerup restituisce sempre 0, i loro figli sono gli slot;
 * - `getPowerupSlotByCode` non e' piu' supportata;
 * - `getNumRemainingCards()` fuori dalla coda restituisce undefined;
 * - `search()` funziona, e' veloce, e da li' `hasPowerup(Deck)` e
 *   `getPowerupProperty(Deck, 'ExamSchedulerDate')` rispondono correttamente.
 *
 * Domanda aperta: da dove arriva il "123 for today" che RemNote mostra sul
 * deck. Qui si leggono tutti gli slot del deck per vedere se il numero c'e'.
 */

import { BuiltInPowerupCodes, type RNPlugin } from '@remnote/plugin-sdk';
import { KEY_DIAGNOSTICS } from './storage';

/** Tutti gli slot del powerup Deck, dal PowerupSlotCodeMap dell'SDK */
const DECK_SLOTS = [
  'Topics',
  'Status',
  'MaxNewCardsPerDay',
  'MaxTotalCardsPerDay',
  'ExamSchedulerDate',
  'RetrievabilityPeriodStartDate',
  'ConsolidationPeriodStartDate',
  'ConsolidationPeriodReIntroSectionLength',
  'ExamConfig',
  'SavedExamInfo',
  'ExamSchedulerDesiredStability',
  'ExamSchedulerMaxNewCardsPerDay',
  'ExamSchedulerMaxTotalCardsPerDay',
  'ExamSchedulerCollection',
];

async function probe(label: string, run: () => Promise<string>): Promise<string> {
  const started = Date.now();
  try {
    return `${label}: ${await run()} (${Date.now() - started}ms)`;
  } catch (err) {
    // Messaggio intero: i suggerimenti di RemNote ("use X instead") stanno in
    // fondo, ed e' esattamente la parte che serve.
    const message = err instanceof Error ? err.message : String(err);
    return `${label}: ERRORE ${message} (${Date.now() - started}ms)`;
  }
}

/** Primo deck raggiungibile via ricerca testuale */
async function findAnyDeck(plugin: RNPlugin) {
  for (const term of ['Domande', 'Fisio', 'a', 'e']) {
    const results = await plugin.search.search([term], undefined, { numResults: 50 });
    for (const rem of results) {
      if (await rem.hasPowerup(BuiltInPowerupCodes.Deck)) return rem;
    }
  }
  return undefined;
}

/** Contenuto di ogni slot del deck: si cerca dove sia il conteggio di oggi */
async function probeDeckSlots(plugin: RNPlugin): Promise<string> {
  const deck = await findAnyDeck(plugin);
  if (!deck) return 'nessun deck raggiungibile';

  const name = deck.text ? await plugin.richText.toString(deck.text) : '(senza nome)';
  const parts: string[] = [`deck "${name.slice(0, 30)}"`];

  for (const slot of DECK_SLOTS) {
    try {
      const raw = await deck.getPowerupProperty(BuiltInPowerupCodes.Deck, slot);
      const value = typeof raw === 'string' ? raw.trim() : String(raw);
      if (!value || value === 'undefined') continue;
      // ExamConfig e SavedExamInfo sono JSON e vanno letti interi: e' li' dentro
      // che dovrebbe esserci il numero di card che RemNote propone oggi.
      const isConfig = slot === 'ExamConfig' || slot === 'SavedExamInfo';
      parts.push(`${slot}=${value.slice(0, isConfig ? 900 : 60)}`);
    } catch {
      // Slot non leggibile su questo deck
    }
  }

  return parts.join(' | ');
}

/**
 * Le card non stanno sul deck ma sui suoi discendenti: qui si misura quanto
 * costa davvero interrogarli, che e' cio' che il boss fa ad ogni conteggio.
 */
async function probeDeckCards(plugin: RNPlugin): Promise<string> {
  const deck = await findAnyDeck(plugin);
  if (!deck) return 'nessun deck raggiungibile';

  const descendants = await deck.getDescendants();
  const sample = descendants.slice(0, 200);
  const started = Date.now();

  const now = Date.now();
  let cards = 0;
  let due = 0;
  for (const rem of sample) {
    for (const card of await rem.getCards()) {
      cards++;
      const next = card.nextRepetitionTime;
      if (typeof next === 'number' && next <= now) due++;
    }
  }

  const perRem = sample.length > 0 ? (Date.now() - started) / sample.length : 0;
  const estimate = Math.round((perRem * descendants.length) / 1000);
  return `${descendants.length} discendenti; su ${sample.length}: ${cards} card, ${due} scadute; stima scansione completa ~${estimate}s`;
}

export async function runDiagnostics(plugin: RNPlugin): Promise<string[]> {
  const lines = [
    await probe('slot del deck', () => probeDeckSlots(plugin)),
    await probe('card del deck', () => probeDeckCards(plugin)),
    await probe('queue.getNumRemainingCards', async () =>
      String(await plugin.queue.getNumRemainingCards())
    ),
  ];

  await plugin.storage.setLocal(KEY_DIAGNOSTICS, lines);
  return lines;
}
