# Changelog

## 0.3.0

**The boss is now measured on RemNote's own numbers.** It used to be counted by
hand: find the decks, walk their descendants, count what looked overdue. That
was wrong at the root — cards live in documents *referenced* by a deck rather
than sitting under it, and RemNote's Daily Goal belongs to no deck at all. On a
real knowledge base it reported no cards due while RemNote was asking for
thirteen.

Now the boss is sized from the queue itself, at the first card: *done today +
left in the session* is exactly what RemNote lined up. The trade is that the
boss is unknown until you start practising — the panel says so instead of
showing a number nobody can trust.

Gone with it: the deck scan, the *Recount cards* button, and the exam's "cards a
day" figure, which read 107 for an exam holding seven cards. That number is
saved when the exam is set up and does not age well. The countdown stays; it is
the part that was right.

## 0.2.2

**Dragging could push the panel off screen.** Only a strip of it had to stay
within reach, so pulling it towards a corner left the grab strip visible and
everything worth reading outside the edge. The whole box now has to fit.

For the case the box still ends up out of reach — the limit is the monitor, not
RemNote's window, which cannot be measured from a plugin — there is a command:
**Remquest: bring the panel back**.

## 0.2.1

**The panel can be dragged.** Grab the dotted strip along its top edge and put
it wherever you want; it opens there next time. It cannot be dragged fully off
screen — a strip always stays within reach.

## 0.2.0

**The panel left the right sidebar.** Clicking Remquest now opens it as a
floating box that stays put while you move around; clicking again closes it, and
so does the × in its corner.

The sidebar could not be made to work. RemNote gives a plugin one method for it
— open — and no way to close it, read it, or find out that you closed the panel
yourself. Navigating away dropped the panel and left RemNote's own list of
installed plugins sitting there, which no plugin can clear. The floating box has
all three: open, close, and ask whether it is open. *Keep the panel open* is
gone with the problem it was working around.

## 0.1.2

**The plugin list showed up where the panel should be.** Opening Remquest and
then clicking through to a document left RemNote's plugin list sitting in the
right sidebar. The panel was being put back on the *first* event of a
navigation, while RemNote was still tearing the sidebar down: the request
arrived halfway, the plugin section opened and the panel never landed in it. It
now waits for the navigation to settle, and checks that the panel actually got
there — one more try if it did not.

## 0.1.1

**The panel would not stay closed.** With *Keep the panel open* on, having
opened Remquest once was enough for it to come back on every page and every
tab, with no way to dismiss it. The right sidebar has no close event, so the
panel now sends a heartbeat while it is mounted: when it stops without a
navigation the panel was closed on purpose and is left alone. Leaving the queue
still brings it back.

**The boss ignored changes to your cards.** Three separate reasons, all fixed:

- The measurement never went down, not even before the first card of the day.
  Removing cards, or an exam date moving the daily goal, changed nothing until
  the next morning. Now the boss follows the load until the battle starts; once
  you are fighting it still cannot shrink under you.
- New cards were left out entirely. When a deck declares a daily goal, RemNote
  fills the day up to it with cards you have never seen — so the boss was
  smaller than the session and fell halfway through. They now count, up to that
  goal and no further.
- Nothing recomputed on demand. **Recount cards**, under the boss in the
  Journal, measures it again straight away; there is a command for it too, and
  *reset today's boss* now measures again instead of leaving the panel empty.

**No due cards no longer read as a defeated boss.** An empty day showed the open
chest and "Boss down" to someone who had done nothing, and put a monster in the
bestiary that never turned up.
