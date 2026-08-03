<p align="center"><img src="public/logo.png" width="96" alt="Remquest"></p>

# Remquest

Turn RemNote flashcard reviews into a 16-bit RPG: today's due cards are a
monster with hit points, every card you know takes it down a notch, and the day
is over when it falls.

Nothing in here makes reviewing lighter. It makes it **clearer how far along you
are** — and gives you a reason to come back tomorrow.

## Features

- 🐉 **Boss of the day** — your due-card load, drawn as one of 26 hand-made
  monsters. Its HP is the work ahead; the damage you deal depends on *how well*
  you answered, not how fast
- ⚔️ **Battle HUD in the queue** — HP and XP bars, damage numbers rising off the
  monster, combo counter, day streak. Optional chiptune sounds
- 🐣 **Companions** — eight of them, each with three poses. Yours stands in front
  of the monster and lunges at every card you complete
- 🎯 **Daily quests** — three drawn every day from a deck of eighteen, so the
  goals change instead of becoming wallpaper
- 🏆 **Deeds & bestiary** — permanent milestones and a 26-monster collection:
  dark silhouette until you meet it, full colour once you take it down
- 📅 **Exam countdown** — decks with an exam date show days left and how many
  cards a day it takes to get there
- 🎨 **Shop** — coins buy four screen themes (Game Boy DMG, Crypt, Forge,
  Parchment), companions and streak tokens. **Never** stat boosts
- 🌍 **Italian and English**, following RemNote's language unless you pick one

## How it works

1. Open the review queue as usual — a game strip appears above the cards
2. The monster's HP is set from what's due today; each answer deals damage
   (5–10 XP and 3–7 damage depending on the button, doubled on a 20% critical)
3. The first time a card falls in a day it pays a bonus: **+15 XP**
4. Complete quests, take down the boss, earn coins
5. At local midnight the day resets — the streak, the deeds and the bestiary
   don't

Writing notes also pays: 10 XP per five-minute block, up to 60 a day. Both XP
sources are capped: the point is not to grind.

## The panel

Click **Remquest** in the sidebar; it opens on the right and stays there while
you move around.

| Tab | What's in it |
|---|---|
| **Journal** | level, XP today, cards done, streak, boss of the day, exams ahead, three daily quests |
| **Chronicle** | the last thirty days as a strip, plus permanent deeds |
| **Bestiary** | all 26 monsters, met and defeated |
| **Shop** | coins, next unlock, themes and companions |
| **Settings** | language, and wiping your progress |

## Three things it deliberately doesn't do

**No stat boosts for sale.** The monster *is* your review load — an XP multiplier
wouldn't weaken it, it would drain the weight out of every single card. The shop
sells looks and conveniences, never numbers. There's a test enforcing it.

**No guilt.** The companion sleeps, it never gets sick. Streak tokens absorb a
missed day. People quit when something broke in their life, not out of boredom —
whoever comes back after a week shouldn't find a scolding waiting.

**No speed rewards.** In spaced repetition the effortful recall is the one that
sticks. Answering slowly and correctly is worth exactly as much as answering at
once.

## Settings

- **Language** — Italian or English; by default it follows RemNote
- **Keep the panel open** — put it back in the right sidebar after you navigate
  away (on by default)
- **Full-screen flashcards** — widen the queue to the whole window
- **Danger zone** — wipe XP, level, coins, streak, bestiary, deeds and history.
  It asks twice and tells you exactly what you're about to lose. Your notes and
  cards are never touched

Everything lives in RemNote's synced storage. Nothing is sent anywhere: the
plugin makes no network requests.

## Install

From the RemNote marketplace, or build it yourself:

```
npm install
npm run build     # produces dist/ and PluginZip.zip
```

then RemNote → **Plugins → Build → Upload plugin** and pick `PluginZip.zip`.

## Development

Node >= 22.18 (the tests use native type stripping).

```
npm run dev        # dev server on :8080, load as a development plugin
npm test           # game-logic tests
npm run test:all   # typecheck + tests + audit + build
```

Before claiming a screen works, look at it: write a preview file in `dist/` that
imports the real components, bundle it with esbuild, open it with
`chromium --headless --screenshot`. Compiling proves nothing about something you
look at.

## Project layout

| Path | Role |
|---|---|
| `src/widgets/index.tsx` | starts the engine, registers widgets, commands, sidebar entry |
| `src/widgets/panel.tsx` | the tabbed panel |
| `src/widgets/queue_hud.tsx` | the game strip inside the queue |
| `src/widgets/toast.tsx` | pixel notice for level, quest, boss, streak |
| `src/lib/engine.ts` | listens to events, awards XP and coins, emits effects |
| `src/lib/gamification.ts` | the pure rules: XP, combo, streak, day state |
| `src/lib/boss.ts` · `bestiary.ts` | today's hit points · who you're facing |
| `src/lib/missions.ts` · `feats.ts` | quest deck · permanent deeds |
| `src/lib/shop.ts` · `wallet.ts` | catalogue and purchase rules · coins |
| `src/lib/collection.ts` · `history.ts` | bestiary collected · last thirty days |
| `src/lib/levels.ts` · `mood.ts` | levels and titles · companion mood |
| `src/lib/exams.ts` · `read_exams.ts` | countdown · reading decks with a date |
| `src/lib/i18n/` | the two dictionaries and the lookup |
| `src/lib/storage.ts` · `state.ts` | typed read/write · normalisation |
| `src/lib/fx.ts` · `notifier.ts` · `audio.ts` | effect ring · pixel notice · sounds |
| `src/lib/sidebar_icon.ts` · `sticky_panel.ts` | sidebar icon · panel that stays open |
| `src/lib/sprite_ramp.ts` · `themes.ts` | sprites following a theme · theme classes |
| `src/ui/monsters/` · `companions.ts` · `sprites.ts` | 26 monsters · 8 companions · the rest |
| `src/ui/` | HUD pieces, bars, shop, settings, canvas sprite renderer |
| `src/App.css` · `src/styles/` | the only stylesheet the SDK loads · the real rules |
| `docs/remnote-sdk/` | local copy of the SDK docs |

Sprites are **data, not images**: rows of characters plus a sixteen-colour
palette, drawn onto a canvas at runtime. A theme can declare a colour ramp and
every sprite goes through it — that's how the monsters turn green under the Game
Boy theme.

## Known SDK constraints

Everything below was learned the expensive way, on SDK 0.0.46.

- **A new widget needs `npm run dev` restarted.** Webpack entries are computed
  once at startup from a glob over `src/widgets/` (`webpack.config.js`). Existing
  files hot-reload, and so do CSS and `public/`, but a widget added afterwards
  has no entry: RemNote reserves the space and shows an empty iframe — a white
  strip. Telltale sign: `index.js` answers 200 while `<new_widget>.js` 404s.
- **Never set a background on `html`/`body` in `App.css`.** That sheet is shared
  by every widget: overriding the background RemNote's theme gives the iframe
  turns the sidebar panel white-on-white. Put the background on the widget's own
  container (see `.rq-hud-host`), which needs `min-height: 100vh` because the
  iframe underneath is white.
- **React stays at 17**: the SDK's `renderWidget` uses `ReactDOM.render` and
  `unmountComponentAtNode`, both removed in React 19.
- **`WidgetLocation.Pane` is unusable**: RemNote cannot re-read a layout that
  contains a plugin pane, and merely resizing the window produces
  `Cannot parse window string: (notes~)_(widget~...)_68`. Hence the right
  sidebar. The command *Remquest: close leftover panes* strips stale
  panes out of the layout.
- **`plugin.window.closePane` does not exist** in 0.0.46 although the docs cite
  it: to close a pane you rewrite the tree with `setRemWindowTree`.
- **`registerSidebarButton` drops the `icon` field.** The SDK accepts it and
  sends only `{id, name}` to the app, so a custom icon has to go through
  `plugin.app.registerCSS`, hooking the button's
  `data-test="Extension Sidebar Link <plugin name>"` (see
  `src/lib/sidebar_icon.ts`).
- **The right sidebar has no read API.** Any navigation replaces its content and
  the panel silently disappears; you cannot ask what is currently in there, only
  put yours back (`src/lib/sticky_panel.ts`).
- **The knowledge base cannot be enumerated.** `plugin.card.getAll()` and
  `plugin.rem.getAll()` are gone ("Use plugin.rem.findMany", which wants ids you
  do not have). `taggedRem()` on the built-in powerups (Deck, Document,
  Collection, SavedDocuments) always returns 0, and their "children" are the
  slots, not the rem using them. The only way in is `plugin.search.search()`,
  which is fast (tens of ms): filter for `hasPowerup(Deck)` and add their
  siblings.
- **`getPowerupSlotByCode` is no longer supported**: read values with
  `getPowerupProperty`.
- **`getNumRemainingCards()`** returns `undefined` with the queue closed, and
  with it open counts every practisable card rather than the due ones. Fallback
  only.
- **No XP for cards created**: that would need two full scans of the knowledge
  base to compare, which is not possible.
- **Exam dates arrive as UTC timestamps** (`2026-08-31T22:00:00.000Z`) and are
  converted to local time — otherwise an exam saved at 22:00 UTC lands on the
  previous day.
- **The app's language is not exposed.** `navigator.language` inside the widget
  is the closest thing available.

## Support

Remquest is free and stays free. If it made a wall of due cards easier to climb:

<a href="https://www.buymeacoffee.com/step325" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-violet.png" alt="Buy Me a Coffee" height="48"></a>

## Privacy

The plugin makes no network requests and sends nothing anywhere. All state lives
in RemNote's own synced storage, under keys prefixed `rq_`.
