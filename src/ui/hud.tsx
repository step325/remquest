/** Pezzi dell'HUD della coda. Gli stili stanno in src/styles/hud.css. */

import { useEffect, useState } from 'react';
import { PixelAnim, PixelSprite } from './pixel_sprite';
import { BOSS_SLIME, CHEST_OPEN, FLAME, SLASH, SPARK } from './sprites';
import { monsterSprite } from './monsters';
import { CHEER, ZZZ, companionSprite } from './companions';
import type { Monster } from '../lib/bestiary';
import type { Mood } from '../lib/mood';
import { comboTier, type FxEvent } from '../lib/fx';
import type { Translate } from '../lib/i18n/index';

/** Quanto dura il lampo bianco del boss colpito */
const FLASH_MS = 110;

export function Meter({
  label,
  value,
  percent,
  tone,
}: {
  label: string;
  value: string;
  percent: number;
  tone: 'hp' | 'xp' | 'done';
}) {
  const clamped = Math.min(100, Math.max(0, percent));
  return (
    <div className="rq-hud-meters">
      <div className="rq-hud-row">
        <span className="px-label">{label}</span>
        <span className="px-value">{value}</span>
      </div>
      <div
        className="px-bar"
        role="progressbar"
        aria-label={label}
        aria-valuenow={Math.round(clamped)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className={`px-bar-fill px-fill-${tone}`} style={{ width: `${clamped}%` }} />
      </div>
    </div>
  );
}

/**
 * Il boss. `hitSeq` cambia a ogni card completata: e' quello che fa scattare
 * lampo e scossone, non un timer interno.
 */
export function BossFigure({
  hitSeq,
  defeated,
  monster,
  scale = 3,
}: {
  hitSeq: number;
  defeated: boolean;
  /** Chi si affronta oggi; senza, resta la melma di sempre */
  monster?: Monster;
  /** Quanti pixel di schermo per pixel di sprite */
  scale?: number;
}) {
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    if (hitSeq === 0) return;
    setFlash(true);
    const timer = setTimeout(() => setFlash(false), FLASH_MS);
    return () => clearTimeout(timer);
  }, [hitSeq]);

  if (defeated) {
    return <PixelSprite className="rq-figure-boss" sprite={CHEST_OPEN} scale={scale} />;
  }

  return (
    // La key rimonta il nodo a ogni colpo: senza, l'animazione di scossone
    // partirebbe una volta sola e i colpi successivi resterebbero fermi.
    <span key={hitSeq} className={`rq-boss${hitSeq > 0 ? ' rq-boss-hit' : ''}`}>
      {/* Un solo fotogramma per mostro: il respiro glielo da' il CSS, cosi'
          il bestiario resta ventisei disegni invece di cinquantadue. */}
      <span className="rq-boss-idle">
        <PixelSprite
          className="rq-figure-boss"
          sprite={monster ? monsterSprite(monster) : BOSS_SLIME[0]}
          scale={scale}
          tint={flash ? '#ffffff' : undefined}
        />
      </span>
      {hitSeq > 0 && (
        <span className="rq-slash" aria-hidden="true">
          {/* Il taglio segue la taglia del boss: e' un velo che gli sta sopra */}
          <PixelSprite className="rq-figure-boss" sprite={SLASH} scale={scale} />
        </span>
      )}
    </span>
  );
}

/**
 * Il compagno che sta accanto a te.
 *
 * Non fa niente al gioco: respira e, quando colpisci, balza in avanti. Il
 * balzo riusa lo stesso `hitSeq` che fa sussultare il boss — il compagno
 * attacca, il mostro incassa — ed e' il dettaglio che lo rende vivo invece che
 * un adesivo appiccicato in un angolo.
 */
export function Companion({
  id,
  hitSeq,
  mood,
  title,
  atChest = false,
  scale = 2,
}: {
  id: string;
  hitSeq: number;
  mood: Mood;
  title?: string;
  /**
   * Il boss e' caduto e al suo posto c'e' lo scrigno.
   *
   * Prima il compagno sparise: lo scrigno era il protagonista e lui era di
   * troppo. Ma un compagno che si smaterializza nel momento migliore della
   * giornata e' il contrario di uno che ti tiene compagnia — cosi' invece ci
   * saltella incontro, e la vittoria e' di tutti e due.
   */
  atChest?: boolean;
  /** Quanti pixel di schermo per pixel di sprite */
  scale?: number;
}) {
  const sprite = companionSprite(id, mood);
  if (!sprite) return null;

  // Lo stato lo raccontano un accessorio e il modo di muoversi, non un disegno
  // diverso per ognuno: due sprite condivisi invece di ventiquattro.
  return (
    <span className={`rq-pet-wrap is-${mood}${atChest ? ' is-at-chest' : ''}`} title={title}>
      {mood === 'asleep' && (
        <span className="rq-pet-zzz" aria-hidden="true">
          <PixelSprite sprite={ZZZ} scale={1} />
        </span>
      )}
      {mood === 'happy' && (
        <span className="rq-pet-cheer" aria-hidden="true">
          <PixelSprite sprite={CHEER} scale={2} />
        </span>
      )}
      <span key={hitSeq} className={`rq-pet${hitSeq > 0 ? ' is-striking' : ''}`}>
        <PixelSprite className="rq-figure-pet" sprite={sprite} scale={scale} />
      </span>
    </span>
  );
}

/**
 * Numero di danno che sale sopra il boss e svanisce.
 *
 * In grande i punti vita tolti, sotto in piccolo gli XP presi: sono due
 * quantita' diverse e un critico raddoppia solo la prima. Mostrarne una sola
 * faceva comparire "CRITICO!" sopra un numero uguale a quello di un colpo
 * normale.
 */
export function DamageNumber({ event, t }: { event: FxEvent; t: Translate }) {
  // Una card dimenticata non toglie punti vita: mostra la serie che si spezza,
  // che e' l'unica cosa che e' successa davvero.
  if (event.kind === 'miss') {
    return <span className="rq-dmg rq-dmg-miss px-outline">{t('hud.streakBroken')}</span>;
  }

  const crit = event.kind === 'crit';
  return (
    <>
      <span className={`rq-dmg px-outline${crit ? ' rq-dmg-crit' : ''}`}>
        {crit && <span className="rq-dmg-tag">{t('hud.crit')}</span>}
        <span className="rq-dmg-hit">-{event.damage}</span>
        {event.amount > 0 && <span className="rq-dmg-xp">+{event.amount} XP</span>}
      </span>
      {crit && (
        <span className="rq-spark">
          <PixelSprite sprite={SPARK} scale={2} />
        </span>
      )}
    </>
  );
}

/** Colpi consecutivi: sotto la soglia non si mostra niente */
export function ComboBadge({ combo }: { combo: number }) {
  const tier = comboTier(combo);
  if (tier === 0) return null;
  return <span className={`rq-combo rq-combo-${tier}`}>{combo}x</span>;
}

export function StreakBadge({ days }: { days: number }) {
  if (days <= 0) return null;
  return (
    <span className="rq-hud-streak" title={`${days} giorni di fila`}>
      <PixelAnim frames={FLAME} frameMs={260} scale={2} />
      <span className="px-value">{days}</span>
    </span>
  );
}
