# Changelog

## 0.3.1

This page now has a link of its own on the plugin's page: the changelog was in
the repository all along, with nothing pointing at it.

## 0.3.0

Everything below was found by using the plugin for real against a knowledge
base with a PDF-based exam in it. The versions between this one and 0.1.0 never
left the workshop, so their fixes are listed here.

### The boss now reads RemNote's own numbers

It used to be counted by hand: find the decks, walk their descendants, count
what looked overdue. That was wrong at the root — cards live in documents
*referenced* by a deck rather than sitting under it, and RemNote's Daily Goal
belongs to no deck at all. On a real knowledge base it reported no cards due
while RemNote was asking for thirteen.

The boss is now sized from the queue itself, at the first card: *done today +
left in the session* is exactly what RemNote lined up. The trade is that it is
unknown until you start practising, and the panel says so rather than showing a
number nobody can trust.

Two smaller ones fixed along the way: an empty day showed the open chest and
"Boss down" to someone who had done nothing, and put a monster in the bestiary
that never turned up.

### The panel left the right sidebar

Clicking Remquest now opens a floating box that stays put while you move
around. Click again to close it, or use the × in its corner. Drag it by the
dotted strip along its top edge and it opens there next time; it cannot be
dragged off screen, and *Remquest: bring the panel back* rescues it if it ever
ends up somewhere you cannot reach.

The sidebar could not be made to work. RemNote gives a plugin one method for it
— open — and no way to close it, read it, or find out that you closed the panel
yourself. Opening Remquest and then clicking through to a document left
RemNote's own list of installed plugins sitting in the sidebar, which no plugin
can clear. *Keep the panel open* is gone with the problem it was working
around.

### The exam's "cards a day" is gone

It read 107 for an exam holding seven cards and a PDF. That figure is written
when the exam is set up and never re-reads reality. The countdown stays; it is
the part that was right.

## 0.1.0

First release.
