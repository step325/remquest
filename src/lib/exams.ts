import type { Translate } from './i18n/index';

/**
 * Esami programmati — lettura difensiva.
 *
 * In RemNote un esame e' un Deck (powerup `de`) con lo slot `ExamSchedulerDate`
 * valorizzato. Lo slot punta a un documento giornaliero, il cui titolo e' una
 * data scritta nella lingua dell'interfaccia: qui la si interpreta provando
 * piu' formati, e se non ci si riesce l'esame viene mostrato lo stesso, solo
 * senza conto alla rovescia.
 */

const MONTHS: Record<string, number> = {
  gennaio: 0, febbraio: 1, marzo: 2, aprile: 3, maggio: 4, giugno: 5,
  luglio: 6, agosto: 7, settembre: 8, ottobre: 9, novembre: 10, dicembre: 11,
  january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
  july: 6, august: 7, september: 8, october: 9, november: 10, december: 11,
};

export interface Exam {
  name: string;
  /** Testo originale della data, sempre mostrabile */
  dateText: string;
  /** Giorni mancanti, o null se la data non e' stata interpretata */
  daysLeft: number | null;
  /** Card al giorno che RemNote si aspetta per arrivare pronti all'esame */
  dailyGoal?: number;
}

/**
 * Obiettivo giornaliero dallo slot ExamConfig.
 *
 * Il JSON contiene due ritmi: `dailyGoalRangeMin` e' quello a regime, mentre
 * `catchUpPeriod` e' il recupero dell'arretrato e vale finche' non si arriva a
 * `untilDateString`. E' il secondo a spiegare le 123 card che RemNote propone
 * oggi a fronte di 702 scadute: l'arretrato viene spalmato, non chiesto tutto
 * insieme.
 */
export function parseDailyGoal(examConfig: unknown, now: Date = new Date()): number | undefined {
  if (typeof examConfig !== 'string') return undefined;

  let config: Record<string, unknown>;
  try {
    const parsed: unknown = JSON.parse(examConfig);
    if (!parsed || typeof parsed !== 'object') return undefined;
    config = parsed as Record<string, unknown>;
  } catch {
    return undefined; // configurazione in un formato che non conosciamo
  }

  const catchUp = config.catchUpPeriod;
  if (catchUp && typeof catchUp === 'object') {
    const { dailyGoalMin, untilDateString } = catchUp as Record<string, unknown>;
    if (typeof dailyGoalMin === 'number' && Number.isFinite(dailyGoalMin)) {
      const until = typeof untilDateString === 'string' ? new Date(untilDateString) : null;
      const stillCatchingUp =
        until !== null && !Number.isNaN(until.getTime()) && daysUntil(until, now) >= 0;
      if (stillCatchingUp) return dailyGoalMin;
    }
  }

  const min = config.dailyGoalRangeMin;
  return typeof min === 'number' && Number.isFinite(min) ? min : undefined;
}

/**
 * Interpreta "2026-08-31T22:00:00.000Z" (il formato che usa RemNote),
 * "2026-08-14", "August 14th, 2026" o "14 agosto 2026".
 */
export function parseExamDate(text: string): Date | null {
  const clean = text.trim().toLowerCase();
  if (!clean) return null;

  // Timestamp completo: va convertito nel fuso locale, altrimenti un esame
  // salvato come 22:00 UTC finisce nel giorno prima.
  if (/^\d{4}-\d{2}-\d{2}t/.test(clean)) {
    const parsed = new Date(text.trim());
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const iso = clean.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));

  const year = clean.match(/\b(\d{4})\b/);
  const day = clean.match(/\b(\d{1,2})(?:st|nd|rd|th)?\b/);
  const month = Object.keys(MONTHS).find((name) => clean.includes(name));
  if (!year || !day || month === undefined) return null;

  return new Date(Number(year[1]), MONTHS[month], Number(day[1]));
}

/** Giorni pieni da oggi alla data, negativi se gia' passata */
export function daysUntil(date: Date, now: Date): number {
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return Math.round((target - today) / 86_400_000);
}

/** Esami futuri (oggi incluso) ordinati dal piu' vicino */
export function upcomingExams(exams: readonly Exam[]): Exam[] {
  return exams
    .filter((exam) => exam.daysLeft === null || exam.daysLeft >= 0)
    .sort((a, b) => (a.daysLeft ?? Infinity) - (b.daysLeft ?? Infinity));
}

/** Etichetta del conto alla rovescia */
export function countdownLabel(t: Translate, daysLeft: number | null): string {
  if (daysLeft === null) return t('exams.unknownDate');
  if (daysLeft === 0) return t('exams.today');
  if (daysLeft === 1) return t('exams.tomorrow');
  return t('exams.inDays', { n: daysLeft });
}
