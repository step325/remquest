# SDK notes

What building Remquest cost to find out, on SDK 0.0.46. Kept out of the
README because nobody installing a plugin needs it, kept in the repo because
finding it again would cost the same.

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
  `Cannot parse window string: (notes~)_(widget~...)_68`. Hence the floating
  widget below. The command *Remquest: close leftover panes* strips stale
  panes out of the layout.
- **`plugin.window.closePane` does not exist** in 0.0.46 although the docs cite
  it: to close a pane you rewrite the tree with `setRemWindowTree`.
- **`registerSidebarButton` drops the `icon` field.** The SDK accepts it and
  sends only `{id, name}` to the app, so a custom icon has to go through
  `plugin.app.registerCSS`, hooking the button's
  `data-test="Extension Sidebar Link <plugin name>"` (see
  `src/lib/sidebar_icon.ts`).
- **The right sidebar is a dead end; use a floating widget.** In 0.0.46
  `openWidgetInRightSidebar` is its *only* method — no close, no read, no
  toggle — and there is no event for the user closing your panel. Worse, any
  navigation drops the widget and the section falls back to RemNote's list of
  installed plugins, which then sits in the sidebar with no way for a plugin to
  clear or collapse it. Verified by turning the reopen setting off: with the
  plugin never touching the sidebar, the list still appeared. Reopening the
  panel over it only papered over the problem, and could not be told apart from
  the user dismissing it.
  `openFloatingWidget` / `closeFloatingWidget` / `isFloatingWidgetOpen` give all
  three moves, no navigation takes the box away, and it needs no window tree —
  so it also avoids the `Pane` breakage below (`src/lib/floating_panel.ts`).
  Register the widget under `WidgetLocation.FloatingWidget` with a fixed
  `dimensions.height`: inside the iframe that height is what `100vh` resolves
  to, and it is what makes the panel scroll instead of overflowing. Pass
  `closeWhenClickOutside: false` for anything meant to stay open while working,
  and give it your own close button — RemNote draws no frame around it.
- **A floating widget can be dragged, but you write the drag yourself.** RemNote
  moves it only through `setFloatingWidgetPosition`, so the widget needs its own
  grab strip (`src/ui/panel_grip.tsx`). Two things make it work from inside an
  iframe: use `screenX`/`screenY`, because `clientX` is relative to the box and
  the box is chasing the cursor — the difference would come back to nearly zero
  and it would never start; and send *deltas*, because the widget cannot know
  where on screen it is, so whoever opened it keeps the position. The pointer
  stays over the strip for the whole drag precisely because the box follows it,
  which is why the events keep arriving. `setPointerCapture` covers the moments
  the box lags behind, and batching per animation frame keeps one message per
  frame instead of one per mouse event.
- **Broadcast is the only bridge between widgets.** They live in separate
  iframes and cannot call each other; the panel's close button and its drag are
  messages to the index widget, which owns the floating box
  (`src/lib/panel_link.ts`).
- **The knowledge base cannot be enumerated.** `plugin.card.getAll()` and
  `plugin.rem.getAll()` are gone ("Use plugin.rem.findMany", which wants ids you
  do not have). `taggedRem()` on the built-in powerups (Deck, Document,
  Collection, SavedDocuments) always returns 0, and their "children" are the
  slots, not the rem using them. The only way in is `plugin.search.search()`,
  which is fast (tens of ms): filter for `hasPowerup(Deck)` and add their
  siblings.
- **`getPowerupSlotByCode` is no longer supported**: read values with
  `getPowerupProperty`.
- **`getNumRemainingCards()` is the only honest source for "what is due".**
  There is no API that answers it directly: `card.getAll()` and `rem.getAll()`
  are gone, `Query.cardInfo(IsDue, …)` builds a query that nothing will execute
  (it only configures table filters), the scheduler namespace exposes just
  `registerCustomScheduler`, and the changelog up to 0.0.46 adds nothing.
  Counting it yourself by walking decks does not work either: cards live in
  documents *referenced* by a deck rather than under it, and the Daily Goal
  belongs to no deck — on a real knowledge base the scan found 0 due while
  RemNote asked for 13. Read it inside the queue instead, on `QueueLoadCard`
  and not `QueueEnter` (at entry the queue does not know its size yet), and take
  `cards done today + remaining` — that sum holds steady through a session and
  grows with a second one. Confirmed on a real knowledge base: inside the queue
  it reports the session, not every practisable card. An earlier note here
  claimed the opposite; it was wrong.
- **`ExamConfig`'s daily goal is a snapshot, not today's plan.** It said 107
  cards a day for an exam holding seven cards and a PDF, while RemNote asked for
  three. It is written when the exam is configured and never re-reads reality;
  the exam date next to it is fine.
- **No XP for cards created**: that would need two full scans of the knowledge
  base to compare, which is not possible.
- **Exam dates arrive as UTC timestamps** (`2026-08-31T22:00:00.000Z`) and are
  converted to local time — otherwise an exam saved at 22:00 UTC lands on the
  previous day.
- **The app's language is not exposed.** `navigator.language` inside the widget
  is the closest thing available.
- **The marketplace page renders your `README.md` into rem.** The `>` in front
  of the text on the plugin page is a rem bullet, not markdown. The file is
  shipped by `npm run build` (webpack copies it into `dist/`) and served next to
  the manifest, but a README that opens with raw HTML — a `<p align="center">`
  around the logo, in our case — produced *"No plugin description available."*,
  while plugins whose README starts with `# Title` show theirs. The `description`
  field in the manifest is only the short line (<200 chars) in the listing, not
  that page. Keep the README plain markdown from the first line. What is known
  to render, from a plugin whose page shows in full (oxdev03-focus-timer):
  headings, paragraphs, bullet and numbered lists, bold, emoji, markdown
  images. Tables are untested by any working example, so the tab list here is
  bullets. **Confirmed**: with the HTML gone the page renders the whole README —
  heading, paragraphs, `## Features`, bold and emoji.
- **`changelogUrl` is accepted but not shown.** The manifest validator takes it
  and the marketplace serves it, yet the plugin page's Details column lists only
  *Get help* (`projectUrl`), *Repository* (`repoUrl`) and *Report bugs*
  (`supportUrl`) — no changelog entry, as of August 2026. Setting it costs
  nothing and may pay off later; do not spend a release on it.
- **Pushing to GitHub publishes nothing.** The marketplace serves the zip you
  upload, not the repo: proof is `changelogUrl`, pushed and still absent from
  the served manifest an hour later. The repo is what the review reads
  (`repoUrl`), so it has to match the zip *at upload time*, and every change
  needs the full round — bump the version, `npm run build`, Upload plugin. The
  version number is taken once used: the same one will not replace what is
  already there. Users, on the other hand, update by themselves; RemNote pulls
  new versions automatically and only leaves alone the plugins they disabled.
  An update to an already-approved plugin went live the same day (0.1.0 →
  0.3.0), so whatever review happens for updates did not hold it back.

## Support

Remquest is free and stays free. If it made a wall of due cards easier to climb:

[Buy me a coffee](https://www.buymeacoffee.com/step325)
