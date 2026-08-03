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
