/** Lettura degli esami: i deck con una data d'esame impostata. */

import { BuiltInPowerupCodes, type RNPlugin } from '@remnote/plugin-sdk';
import type { RemObject } from '@remnote/plugin-sdk/dist/name_spaces/rem';
import { type Exam, parseExamDate, daysUntil, upcomingExams } from './exams';
import { findDecks } from './decks';
import { KEY_EXAMS, type ExamsState } from './storage';

const EXAM_DATE_SLOT = 'ExamSchedulerDate';

/** Legge la data d'esame di un deck, se ce l'ha */
async function examOf(plugin: RNPlugin, rem: RemObject, now: Date): Promise<Exam | null> {
  let dateText = '';
  try {
    const raw = await rem.getPowerupProperty(BuiltInPowerupCodes.Deck, EXAM_DATE_SLOT);
    dateText = typeof raw === 'string' ? raw.trim() : '';
  } catch {
    return null;
  }
  if (!dateText) return null;

  const parsed = parseExamDate(dateText);
  const name = rem.text ? await plugin.richText.toString(rem.text) : '';

  return {
    name: name.trim() || 'Esame senza nome',
    // RemNote salva un timestamp UTC: all'utente si mostra la data locale
    dateText: parsed ? parsed.toLocaleDateString('it-IT') : dateText,
    daysLeft: parsed ? daysUntil(parsed, now) : null,
  };
}

export async function readExams(plugin: RNPlugin): Promise<ExamsState> {
  const { decks, remsSearched } = await findDecks(plugin);

  const now = new Date();
  const exams: Exam[] = [];
  for (const deck of decks) {
    const exam = await examOf(plugin, deck, now);
    if (exam) exams.push(exam);
  }

  return {
    exams: upcomingExams(exams),
    decksScanned: decks.length,
    detail: `${remsSearched} rem cercati`,
  };
}

/** Rilegge gli esami e li mette dove il pannello puo' vederli */
export async function refreshExams(plugin: RNPlugin): Promise<ExamsState> {
  let state: ExamsState;
  try {
    state = await readExams(plugin);
  } catch (err) {
    // Senza questo il pannello mostrerebbe "nessun esame" anche quando la
    // lettura e' fallita, che sono due cose molto diverse da capire.
    state = {
      exams: [],
      decksScanned: 0,
      error: err instanceof Error ? err.message : 'lettura non riuscita',
    };
  }
  await plugin.storage.setLocal(KEY_EXAMS, state);
  return state;
}
