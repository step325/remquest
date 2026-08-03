<p align="center">
  <img src="https://raw.githubusercontent.com/step325/remquest/main/public/logo.png" width="96" alt="Remquest">
</p>

# Remquest

Turn RemNote flashcard reviews into a 16-bit RPG. Today's due cards are a
monster with hit points, every card you know takes it down a notch, and the day
is over when it falls.

Nothing in here makes reviewing lighter. It makes it clearer how far along you
are, and gives you a reason to come back tomorrow.

## Features

🐉 **Boss of the day.** Your due-card load, drawn as one of 26 hand-made
monsters. Its HP is the work ahead, and the damage you deal depends on how well
you answered, not on how fast. Which creature turns up depends on how heavy the
day is compared to *your* usual one, so a real boss stays rare: roughly one day
in twenty, and one in seven when the pile is brutal.

⚔️ **Battle HUD in the queue.** HP and XP bars, damage numbers rising off the
monster, combo counter, day streak. Optional chiptune sounds.

🐣 **Companions.** Eight of them, three poses each. Yours stands in front of the
monster and lunges at every card you complete.

🎯 **Daily quests.** Three drawn every day from a deck of eighteen, so the goals
change instead of becoming wallpaper.

🏆 **Deeds and bestiary.** Permanent milestones, and a 26-monster collection:
dark silhouette until you meet it, full colour once you take it down.

📅 **Exam countdown.** Decks with an exam date show the days left and how many
cards a day it takes to get there.

🎨 **Shop.** Coins buy four screen themes (Game Boy DMG, Crypt, Forge,
Parchment), companions and streak tokens. Never stat boosts. It is slow on
purpose: a full day pays 35 coins and the cheapest item costs 250, so the first
one arrives after a week of studying rather than on the second evening.

🌍 **Italian and English**, following RemNote's language unless you pick one.

## How it works

1. Open the review queue as usual. A game strip appears above the cards.
2. The monster's HP comes from what is due today. Each answer deals damage: 5 to
   10 XP and 3 to 7 damage depending on the button you press, doubled on a 20%
   critical hit.
3. The first time a card falls in a day it pays a bonus of 15 XP.
4. Complete quests, take down the boss, earn coins.
5. At local midnight the day resets. The streak, the deeds and the bestiary do
   not.

Writing notes also pays: 10 XP per five-minute block, up to 60 a day. Both XP
sources are capped, because the point is not to grind.

## The panel

Click **Remquest** in the sidebar. It opens on the right and stays there while
you move around.

| Tab | What's in it |
|---|---|
| **Journal** | level, XP today, cards done, streak, boss of the day, exams ahead, three daily quests |
| **Chronicle** | the last thirty days as a strip, plus permanent deeds |
| **Bestiary** | all 26 monsters, met and defeated |
| **Shop** | coins, next unlock, themes and companions |
| **Settings** | language, and wiping your progress |

## Three things it deliberately doesn't do

**No stat boosts for sale.** The monster is your review load. An XP multiplier
would not weaken it, it would drain the weight out of every single card. The
shop sells looks and conveniences, never numbers. There is a test enforcing it.

**No guilt.** The companion sleeps, it never gets sick. Streak tokens absorb a
missed day. People quit when something broke in their life, not out of boredom,
and whoever comes back after a week should not find a scolding waiting.

**No speed rewards.** In spaced repetition the effortful recall is the one that
sticks. Answering slowly and correctly is worth exactly as much as answering at
once.

## Settings

**Language.** Italian or English. By default it follows RemNote.

**Keep the panel open.** Puts the panel back in the right sidebar after you
navigate away. On by default.

**Full-screen flashcards.** Widens the queue to the whole window.

**Danger zone.** Wipes XP, level, coins, streak, bestiary, deeds and history. It
asks twice and says exactly what you are about to lose. Your notes and cards are
never touched.

## Privacy

The plugin makes no network requests and sends nothing anywhere. All state lives
in RemNote's own synced storage, under keys prefixed `rq_`.

## Support

Remquest is free and stays free. If it made a wall of due cards easier to climb:

<a href="https://www.buymeacoffee.com/step325" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-violet.png" alt="Buy Me a Coffee" height="48"></a>
