/**
 * Livelli — logica pura.
 *
 * Gli XP giornalieri si azzerano a mezzanotte, il livello no: si calcola dagli
 * XP di sempre (`lifetimeXp`). La soglia cumulativa per il livello L e'
 * 50*L*(L-1), quindi ogni livello costa 100 XP in piu' del precedente:
 * L2 a 100, L3 a 300, L4 a 600, L5 a 1000.
 */

/** Costo incrementale del primo passaggio di livello */
const LEVEL_STEP = 100;

/** Titolo mostrato accanto al livello */
const TITLES = [
  'Novizio',
  'Apprendista',
  'Studioso',
  'Esperto',
  'Veterano',
  'Maestro',
  'Gran Maestro',
  'Leggenda',
];

/** XP totali necessari per raggiungere un livello */
export function xpForLevel(level: number): number {
  if (level <= 1) return 0;
  return (LEVEL_STEP / 2) * level * (level - 1);
}

/** Livello corrispondente a un totale di XP (parte da 1) */
export function levelFromXp(lifetimeXp: number): number {
  if (!Number.isFinite(lifetimeXp) || lifetimeXp <= 0) return 1;
  // Inversa di xpForLevel: L = (1 + sqrt(1 + 8*xp/LEVEL_STEP)) / 2
  return Math.floor((1 + Math.sqrt(1 + (8 * lifetimeXp) / LEVEL_STEP)) / 2);
}

export interface LevelProgress {
  level: number;
  title: string;
  /** XP accumulati dentro il livello corrente */
  xpIntoLevel: number;
  /** XP totali che servono per passare al livello successivo */
  xpForNextLevel: number;
  /** Percentuale 0-100 verso il livello successivo */
  percent: number;
}

export function levelProgress(lifetimeXp: number): LevelProgress {
  const xp = Number.isFinite(lifetimeXp) && lifetimeXp > 0 ? lifetimeXp : 0;
  const level = levelFromXp(xp);
  const floor = xpForLevel(level);
  const ceiling = xpForLevel(level + 1);
  const span = ceiling - floor;
  const xpIntoLevel = xp - floor;
  return {
    level,
    title: TITLES[Math.min(level - 1, TITLES.length - 1)],
    xpIntoLevel,
    xpForNextLevel: span,
    percent: span > 0 ? Math.min(100, Math.round((xpIntoLevel / span) * 100)) : 0,
  };
}
