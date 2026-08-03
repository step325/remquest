import {
  renderWidget,
  useSyncedStorageState,
  useLocalStorageState,
} from '@remnote/plugin-sdk';
import {
  type DayState,
  type StreakState,
  bossDamagePercent,
  freshDayState,
  freshStreakState,
} from '../lib/gamification';
import { missionsForDay } from '../lib/missions';
import { collectionProgress, freshCollection, normalizeCollection } from '../lib/collection';
import { FEATS, freshTotals, normalizeTotals } from '../lib/feats';
import { freshHistory, normalizeHistory } from '../lib/history';
import { freshWallet, normalizeWallet } from '../lib/wallet';
import { type Item, buy, themeClass, wear } from '../lib/shop';
import { MAX_STREAK_TOKENS } from '../lib/gamification';
import { NextUnlock, ShopPanel } from '../ui/shop_panel';
import { TabBar, validTab, type TabId } from '../ui/tabs';
import { SettingsPanel } from '../ui/settings_panel';
import { HistoryStrip } from '../ui/history_strip';
import { BestiaryGrid } from '../ui/bestiary_grid';
import { freshFxState } from '../lib/fx';
import { levelProgress } from '../lib/levels';
import { prestigeFor, prestigeLabel } from '../lib/prestige';
import { companionMood, moodLabel } from '../lib/mood';
import {
  AUTO_LANG,
  type Translate,
  appLocale,
  resolveLang,
  translator,
} from '../lib/i18n/index';
import { Companion } from '../ui/hud';
import { normalizeDayState, normalizeStreakState } from '../lib/state';
import { todayKey } from '../lib/dates';
import {
  KEY_DAY,
  KEY_STREAK,
  KEY_BOSS,
  KEY_FX,
  KEY_EXAMS,
  KEY_COLLECTION,
  KEY_TOTALS,
  KEY_HISTORY,
  KEY_WALLET,
  KEY_TAB,
  KEY_LANG,
  type ExamsState,
  freshBossState,
  freshExamsState,
  normalizeBossState,
  normalizeExamsState,
} from '../lib/storage';
import { countdownLabel } from '../lib/exams';
import { Bar, Stat, MissionRow, ExamRow, Section } from '../ui/components';
import { PixelSprite } from '../ui/pixel_sprite';
import { CHEST_OPEN } from '../ui/sprites';
import { monsterSprite } from '../ui/monsters';

/** Perche' la lista e' vuota: "non ne hai" e "non sono riuscito a leggerli" sono cose diverse */
function emptyExamsMessage(t: Translate, state: ExamsState): string {
  if (state.error) return t('exams.error', { n: state.error });
  const detail = state.detail ? ` [${state.detail}]` : '';
  if (state.decksScanned === 0) return t('exams.noDecks', { n: detail });
  return t('exams.noDates', { a: state.decksScanned, b: detail });
}

function Panel() {
  const today = todayKey();
  const [rawDay, setDay] = useSyncedStorageState<DayState>(KEY_DAY, freshDayState(today));
  const [rawStreak, setStreak] = useSyncedStorageState<StreakState>(KEY_STREAK, freshStreakState());
  const [rawBoss, setBoss] = useLocalStorageState(KEY_BOSS, freshBossState(today));
  const [, setFx] = useLocalStorageState(KEY_FX, freshFxState());
  const [rawExams] = useLocalStorageState(KEY_EXAMS, freshExamsState());
  const [rawCollection, setCollection] = useSyncedStorageState(KEY_COLLECTION, freshCollection());
  const [rawTotals, setTotals] = useSyncedStorageState(KEY_TOTALS, freshTotals());
  const [rawHistory, setHistory] = useSyncedStorageState(KEY_HISTORY, freshHistory());
  const [rawWallet, setWallet] = useSyncedStorageState(KEY_WALLET, freshWallet());
  const [rawTab, setTab] = useLocalStorageState<TabId>(KEY_TAB, 'diario');
  const [rawLang, setLang] = useSyncedStorageState<string>(KEY_LANG, AUTO_LANG);
  const [rawStreakForTokens, setStreakForTokens] = useSyncedStorageState<StreakState>(
    KEY_STREAK,
    freshStreakState()
  );

  const stored = normalizeDayState(rawDay, today);
  // Lo stato di ieri non e' quello di oggi: l'azzeramento vero lo fa il motore
  // alla prima azione, qui basta non mostrare numeri vecchi.
  const day = stored.dayKey === today ? stored : freshDayState(today);
  const streak = normalizeStreakState(rawStreak);
  const boss = normalizeBossState(rawBoss, today);
  const examsState = normalizeExamsState(rawExams);
  const collection = normalizeCollection(rawCollection);
  const collected = collectionProgress(collection);
  const totals = normalizeTotals(rawTotals);
  const history = normalizeHistory(rawHistory);
  const wallet = normalizeWallet(rawWallet);
  const lang = resolveLang(rawLang, appLocale());

  /** Compra e, se l'articolo e' un gettone, lo consegna alla serie */
  const onBuy = (id: string) => {
    const esito = buy(wallet, id, streak.tokens);
    if ('refused' in esito) return; // il pulsante e' gia' disabilitato
    setWallet(esito.wallet);
    if (esito.tokens > 0) {
      const corrente = normalizeStreakState(rawStreakForTokens);
      setStreakForTokens({
        ...corrente,
        tokens: Math.min(MAX_STREAK_TOKENS, corrente.tokens + esito.tokens),
      });
    }
  };

  const onWear = (item: Item) => setWallet(wear(wallet, item.kind, item.id));

  /**
   * Azzera i progressi del gioco.
   *
   * Tocca solo la roba del plugin: card, deck e appunti di RemNote non sono
   * suoi e restano dove sono. Il boss del giorno si rifa' da solo alla prossima
   * coda, quindi basta rimetterlo a zero.
   */
  const onReset = () => {
    setDay(freshDayState(today));
    setStreak(freshStreakState());
    setWallet(freshWallet());
    setCollection(freshCollection());
    setTotals(freshTotals());
    setHistory(freshHistory());
    setBoss(freshBossState(today));
    // Anche il canale degli effetti: dentro ci sono la combo in corso e
    // l'ultimo evento annunciato, che senza questo sopravviverebbero
    // all'azzeramento e ricomparirebbero nell'HUD.
    setFx(freshFxState());
  };
  const t = translator(lang);
  const tab = validTab(rawTab);
  const level = levelProgress(streak.lifetimeXp);
  const prestige = prestigeFor(level.level);
  const mood = companionMood(day);

  const remaining = boss.remaining;
  const damage = bossDamagePercent(boss.maxHp, remaining ?? 0);

  return (
    // `px` porta palette, font e primitive condivise con l'HUD della coda:
    // le due schermate devono sembrare lo stesso gioco.
    <div className={`px rq ${themeClass(wallet)} ${prestige.className}`.trim()}>
      <header className="rq-head">
        {/* Il blocco del livello e' anche il posto dove si vede il prestigio:
            le decorazioni sono roba di src/styles/panel_prestige.css, qui basta
            un nome a cui attaccarle. Il suggerimento dice da dove arrivano —
            una cornice comparsa da sola sembrerebbe un difetto grafico. */}
        <div className="rq-crest" title={prestigeLabel(t, prestige) ?? undefined}>
          <div className="rq-level">{t('panel.level', { n: level.level })}</div>
          <div className="rq-title">{level.title}</div>
        </div>
        {/* Il compagno sta in mezzo ai due numeri, non in un angolo: e' l'unico
            posto dell'intestazione dove non copre niente, e da li' si vede
            subito com'e' andata la giornata. `hitSeq` resta a zero — nel
            pannello non si colpisce nessuno, il balzo e' roba della coda. */}
        {wallet.companion !== '' && (
          <div className="rq-head-pet">
            <Companion
              id={wallet.companion}
              hitSeq={0}
              mood={mood}
              title={moodLabel(t, mood, streak.currentStreak, day.queueCleared)}
              scale={3}
            />
          </div>
        )}
        <div className="rq-lifetime">
          {streak.lifetimeXp.toLocaleString(lang)} <span>{t('panel.lifetime')}</span>
        </div>
      </header>

      {/* L'involucro serve alle scintille del secondo grado: `px-bar` la usano
          anche il boss e l'HUD, e il luccichio e' del livello soltanto. */}
      <div className="rq-level-bar">
        <Bar
          percent={level.percent}
          tone="level"
          caption={t('panel.xpToNext', {
            a: level.xpIntoLevel,
            b: level.xpForNextLevel,
            n: level.level + 1,
          })}
        />
      </div>

      <TabBar active={tab} onPick={setTab} t={t} />

      {tab === 'diario' && (
        <>
      <div className="rq-stats">
        <Stat value={day.totalXp} label={t('panel.statXp')} tone="xp" />
        <Stat value={day.cardsDone} label={t('panel.statCards')} tone="cards" />
        <Stat value={streak.currentStreak} label={t('panel.statStreak')} tone="streak" />
        <Stat value={streak.bestStreak} label={t('panel.statBest')} tone="best" />
      </div>
      {streak.tokens > 0 && (
        <div className="rq-tokens">
          {streak.tokens === 1 ? t('panel.tokensOne') : t('panel.tokensMany', { n: streak.tokens })}{' '}
          · {t('panel.tokensNote')}
        </div>
      )}

      <NextUnlock wallet={wallet} t={t} />

      <Section title={t('boss.section')}>
        {remaining == null ? (
          <p className="rq-empty">{t('boss.none')}</p>
        ) : (
          <div className="rq-boss-row">
            {remaining === 0 ? (
              <PixelSprite sprite={CHEST_OPEN} scale={3} />
            ) : (
              <span className="rq-boss-idle">
                <PixelSprite sprite={monsterSprite(boss.monster)} scale={3} />
              </span>
            )}
            <div>
              <Bar
                percent={100 - damage}
                tone={remaining === 0 ? 'done' : 'boss'}
                caption={
                  remaining === 0
                    ? t('boss.defeated')
                    : t('boss.left', { n: remaining, p: damage })
                }
              />
              <div className="rq-hp">
                {t('boss.hp', { a: Math.max(0, boss.maxHp - remaining), b: boss.maxHp })}
                {boss.cardsPlanned > 0 && ` · ${t('boss.cards', { n: boss.cardsPlanned })}`}
                {boss.backlog > boss.cardsPlanned && ` · ${t('boss.backlog', { n: boss.backlog })}`}
              </div>
            </div>
          </div>
        )}
      </Section>

      <Section title={t('exams.section')}>
        {examsState.exams.length > 0 ? (
          <ul className="rq-exams">
            {examsState.exams.slice(0, 5).map((exam, i) => (
              <ExamRow
                key={`${exam.name}-${i}`}
                name={exam.name}
                dateText={exam.dateText}
                countdown={countdownLabel(t, exam.daysLeft)}
                urgent={exam.daysLeft !== null && exam.daysLeft <= 7}
                dailyGoal={exam.dailyGoal}
                t={t}
              />
            ))}
          </ul>
        ) : (
          <p className="rq-empty">{emptyExamsMessage(t, examsState)}</p>
        )}
      </Section>

      <Section title={t('missions.section')}>
        <ul className="rq-missions">
          {missionsForDay(today).map((mission) => (
            <MissionRow
              key={mission.id}
              label={t(mission.key, { n: mission.target })}
              progress={mission.progress(day)}
              target={mission.target}
            />
          ))}
        </ul>
      </Section>

        </>
      )}

      {tab === 'cronache' && (
        <>
      <Section title={t('history.section')}>
        <HistoryStrip history={history} t={t} />
      </Section>

      <Section title={t('feats.section')}>
        <ul className="rq-missions">
          {FEATS.map((feat) => (
            <MissionRow
              key={feat.id}
              label={t(feat.key, { n: feat.target })}
              progress={feat.of(totals)}
              target={feat.target}
            />
          ))}
        </ul>
      </Section>

        </>
      )}

      {tab === 'bestiario' && (
      <Section title={t('bestiary.section')}>
        <BestiaryGrid collection={collection} t={t} />
        <div className="rq-bestiary-count">
          {t('bestiary.count', {
            a: collected.defeated,
            b: collected.seen,
            n: collected.total,
          })}
        </div>
      </Section>
      )}

      {tab === 'impostazioni' && (
        <SettingsPanel
          lang={lang}
          chosen={rawLang}
          onLang={setLang}
          lifetimeXp={streak.lifetimeXp}
          coins={wallet.coins}
          monsters={collected.defeated}
          onReset={onReset}
          t={t}
        />
      )}

      {tab === 'emporio' && (
      <Section title={t('shop.section')}>
        <ShopPanel
          t={t}
          wallet={wallet}
          tokens={streak.tokens}
          maxTokens={MAX_STREAK_TOKENS}
          onBuy={onBuy}
          onWear={onWear}
        />
      </Section>
      )}

    </div>
  );
}

renderWidget(Panel);
