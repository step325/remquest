/** Pezzi di UI del Remquest. Gli stili stanno in src/App.css. */

import type { ReactNode } from 'react';

export type Tone = 'level' | 'boss' | 'done' | 'xp' | 'cards' | 'streak' | 'best';

/** Le barre del pannello usano le stesse primitive dell'HUD della coda */
const FILL: Partial<Record<Tone, string>> = {
  level: 'px-fill-level',
  boss: 'px-fill-hp',
  done: 'px-fill-done',
  xp: 'px-fill-xp',
};

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rq-section">
      <h2 className="rq-section-title">{title}</h2>
      {children}
    </section>
  );
}

export function Bar({
  percent,
  tone,
  caption,
}: {
  percent: number;
  tone: Tone;
  caption?: string;
}) {
  const clamped = Math.min(100, Math.max(0, percent));
  return (
    <div>
      <div
        className="px-bar"
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={`px-bar-fill ${FILL[tone] ?? 'px-fill-xp'}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
      {caption && <div className="rq-bar-caption">{caption}</div>}
    </div>
  );
}

export function Stat({ value, label, tone }: { value: number; label: string; tone: Tone }) {
  return (
    <div className={`rq-stat rq-stat-${tone}`}>
      <div className="rq-stat-value">{value}</div>
      <div className="rq-stat-label">{label}</div>
    </div>
  );
}

export function ExamRow({
  name,
  dateText,
  countdown,
  urgent,
  dailyGoal,
}: {
  name: string;
  dateText: string;
  countdown: string;
  urgent: boolean;
  dailyGoal?: number;
}) {
  const goal = dailyGoal ? ` · ${dailyGoal} card al giorno` : '';
  return (
    <li className={`rq-exam${urgent ? ' is-urgent' : ''}`}>
      <div className="rq-exam-body">
        <span className="rq-exam-name">{name}</span>
        <span className="rq-exam-date">
          {dateText}
          {goal}
        </span>
      </div>
      <span className="rq-exam-countdown">{countdown}</span>
    </li>
  );
}

export function MissionRow({
  label,
  progress,
  target,
}: {
  label: string;
  progress: number;
  target: number;
}) {
  const done = progress >= target;
  const percent = target > 0 ? Math.min(100, (progress / target) * 100) : 0;

  return (
    <li className={`rq-mission${done ? ' is-done' : ''}`}>
      <span className="rq-mission-check" aria-hidden="true">
        {done ? '✓' : ''}
      </span>
      <div className="rq-mission-body">
        <div className="rq-mission-top">
          <span>{label}</span>
          <span className="rq-mission-count">
            {Math.min(progress, target)}/{target}
          </span>
        </div>
        <div className="rq-mission-track">
          <div className="rq-mission-fill" style={{ width: `${percent}%` }} />
        </div>
      </div>
    </li>
  );
}
