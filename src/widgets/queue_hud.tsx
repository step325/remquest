/**
 * HUD di gioco dentro la coda.
 *
 * Non calcola niente: legge lo stato che il motore ha gia' scritto e lo
 * disegna. Gli effetti arrivano da KEY_FX, un anello di eventi numerati; qui
 * si tiene da parte l'ultimo numero disegnato e si animano solo quelli nuovi.
 */

import {
  renderWidget,
  useLocalStorageState,
  useSyncedStorageState,
} from '@remnote/plugin-sdk';
import { useEffect, useRef, useState } from 'react';
import {
  type DayState,
  type StreakState,
  bossDamagePercent,
  freshDayState,
  freshStreakState,
} from '../lib/gamification';
import {
  type FxEvent,
  type FxState,
  freshFxState,
  isPopupFx,
  lastCombatSeq,
  normalizeFxState,
  recentFx,
} from '../lib/fx';
import { levelProgress } from '../lib/levels';
import { normalizeDayState, normalizeStreakState } from '../lib/state';
import { todayKey } from '../lib/dates';
import {
  KEY_BOSS,
  KEY_DAY,
  KEY_FX,
  KEY_STREAK,
  KEY_WALLET,
  KEY_LANG,
  freshBossState,
  normalizeBossState,
} from '../lib/storage';
import { playSound, unlockAudio } from '../lib/audio';
import { freshWallet, normalizeWallet } from '../lib/wallet';
import { companionMood, moodLabel } from '../lib/mood';
import { themeClass } from '../lib/shop';
import { AUTO_LANG, appLocale, resolveLang, translator } from '../lib/i18n/index';
import { BossFigure, Companion, ComboBadge, DamageNumber, Meter, StreakBadge } from '../ui/hud';
import { PixelSprite } from '../ui/pixel_sprite';
import { SPEAKER_OFF, SPEAKER_ON } from '../ui/sprites';

/** Quanto resta a schermo un numero di danno prima di essere tolto dal DOM */
const POPUP_MS = 1_500;

/** Chiave dell'interruttore audio: locale, e' una preferenza del dispositivo */
const KEY_SOUND = 'rq_sound';

/** Tiene in vita solo gli effetti ancora in animazione */
function useDamagePopups(fx: FxState) {
  const [popups, setPopups] = useState<FxEvent[]>([]);
  // Il numero di sequenza gia' disegnato sta in un ref: se stesse nello stato,
  // aggiornarlo farebbe ripartire l'effetto che lo ha appena aggiornato.
  const seen = useRef(0);
  // normalizeFxState restituisce un oggetto nuovo a ogni render, quindi non
  // puo' stare tra le dipendenze: l'effetto girerebbe di continuo. L'unica
  // cosa che conta davvero e' che sia arrivato un evento nuovo, cioe' `seq`.
  const latest = useRef(fx);
  latest.current = fx;

  useEffect(() => {
    // Solo quelli che sono un colpo: gli altri portano numeri che non c'entrano
    // con la card appena fatta (vedi `isPopupFx`).
    const fresh = recentFx(latest.current, seen.current, Date.now()).filter((e) =>
      isPopupFx(e.kind)
    );
    seen.current = latest.current.seq;
    if (fresh.length === 0) return;

    setPopups((current) => [...current, ...fresh]);
    const lastOfBatch = fresh[fresh.length - 1].seq;
    const timer = setTimeout(() => {
      setPopups((current) => current.filter((e) => e.seq > lastOfBatch));
    }, POPUP_MS);
    return () => clearTimeout(timer);
  }, [fx.seq]);

  return popups;
}

/** Suona gli effetti nuovi, se l'audio e' acceso */
function useSounds(fx: FxState, enabled: boolean) {
  const seen = useRef(0);
  const latest = useRef(fx);
  latest.current = fx;

  useEffect(() => {
    const fresh = recentFx(latest.current, seen.current, Date.now());
    seen.current = latest.current.seq;
    if (!enabled) return;
    // Solo l'ultimo: in una raffica di card, sette note sovrapposte sono
    // rumore, non musica.
    const last = fresh[fresh.length - 1];
    if (last) playSound(last.kind);
  }, [fx.seq, enabled]);
}

function QueueHud() {
  const today = todayKey();
  const [rawDay] = useSyncedStorageState<DayState>(KEY_DAY, freshDayState(today));
  const [rawStreak] = useSyncedStorageState<StreakState>(KEY_STREAK, freshStreakState());
  const [rawBoss] = useLocalStorageState(KEY_BOSS, freshBossState(today));
  const [rawFx] = useLocalStorageState(KEY_FX, freshFxState());
  const [sound, setSound] = useLocalStorageState<boolean>(KEY_SOUND, false);
  // Il tema comprato vale anche qui: le due schermate devono restare la stessa
  // cosa, altrimenti comprarlo sembra averlo applicato a meta'.
  const [rawWallet] = useSyncedStorageState(KEY_WALLET, freshWallet());
  const [rawLang] = useSyncedStorageState<string>(KEY_LANG, AUTO_LANG);

  const stored = normalizeDayState(rawDay, today);
  const day = stored.dayKey === today ? stored : freshDayState(today);
  const streak = normalizeStreakState(rawStreak);
  const boss = normalizeBossState(rawBoss, today);
  const fx = normalizeFxState(rawFx);
  const level = levelProgress(streak.lifetimeXp);
  const popups = useDamagePopups(fx);
  useSounds(fx, sound);

  const remaining = boss.remaining;
  const defeated = remaining === 0 && boss.maxHp > 0;
  const damage = bossDamagePercent(boss.maxHp, remaining ?? 0);
  // Chi si affronta oggi lo ha gia' deciso il motore e sta nello stato del
  // boss: qui si disegna soltanto.
  const monster = boss.monster;
  const wallet = normalizeWallet(rawWallet);
  const t = translator(resolveLang(rawLang, appLocale()));

  return (
    <div className={`px rq-hud-host ${themeClass(wallet)}`.trim()}>
      <div className="rq-hud">
        <div className="rq-hud-boss">
          {/* Compagno e mostro stanno sullo stesso pavimento, uno di fronte
              all'altro: cosi' la striscia racconta un duello invece di avere
              una decorazione appiccicata in fondo. Quando il boss cade il
              compagno resta e saltella verso lo scrigno — il momento migliore
              della giornata e' l'ultimo in cui dovrebbe sparire. */}
          <div className="rq-hud-floor">
            {wallet.companion !== '' && (
              <Companion
                id={wallet.companion}
                hitSeq={lastCombatSeq(fx)}
                mood={companionMood(day)}
                title={moodLabel(t, companionMood(day), streak.currentStreak, day.queueCleared)}
                atChest={defeated}
              />
            )}
            <BossFigure hitSeq={lastCombatSeq(fx)} defeated={defeated} monster={monster} />
          </div>
          <div className="rq-fx">
            {popups.map((event) => (
              <DamageNumber key={event.seq} event={event} t={t} />
            ))}
          </div>
          {remaining == null ? (
            <Meter label={t('hud.bossUnknown')} value="—" percent={0} tone="hp" />
          ) : (
            <Meter
              label={defeated ? t('hud.bossDown') : t('hud.boss')}
              // Punti vita e non card: da quando il danno dipende da come
              // rispondi, i due numeri non coincidono piu'.
              value={
                defeated
                  ? t('hud.hp', { a: 0, b: boss.maxHp })
                  : t('hud.hp', { a: remaining, b: boss.maxHp })
              }
              percent={defeated ? 100 : 100 - damage}
              tone={defeated ? 'done' : 'hp'}
            />
          )}
        </div>

        <div className="rq-hud-xp">
          <Meter
            label={t('hud.level', { n: level.level })}
            value={t('hud.xp', { n: day.totalXp })}
            percent={level.percent}
            tone="xp"
          />
        </div>

        <ComboBadge combo={fx.combo} />
        <StreakBadge days={streak.currentStreak} />
      </div>

      {/* In alto a destra, fuori dalla riga: e' una preferenza che si tocca una
          volta, e in mezzo alle barre rubava spazio a quello che si guarda
          mentre si studia. */}
      {/* Il clic non accende solo i suoni: e' anche il gesto che il browser
          aspetta per lasciar suonare qualcosa in questo iframe. */}
      <button
        className={`rq-hud-sound${sound ? ' is-on' : ''}`}
        type="button"
        title={sound ? t('hud.soundOn') : t('hud.soundOff')}
        aria-label={sound ? t('hud.soundTurnOff') : t('hud.soundTurnOn')}
        aria-pressed={sound === true}
        onClick={() => {
          unlockAudio();
          setSound(!sound);
        }}
      >
        <PixelSprite sprite={sound ? SPEAKER_ON : SPEAKER_OFF} scale={2} />
      </button>
    </div>
  );
}

renderWidget(QueueHud);
