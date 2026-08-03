/**
 * The English strings.
 *
 * Proper names stay as they are: level titles (Novizio, Leggenda) and monster
 * names are not translated, the way a well-dubbed game leaves them.
 *
 * The `{n}`, `{a}`, `{b}`, `{p}` holes must match the Italian ones — a test
 * checks that they do.
 */

import type { IT } from './it';

export const EN: Record<keyof typeof IT, string> = {
  // --- Tabs ---
  'tab.diario': 'Journal',
  'tab.cronache': 'Chronicle',
  'tab.bestiario': 'Bestiary',
  'tab.emporio': 'Shop',
  'tab.impostazioni': 'Settings',
  'tab.aria': 'Panel sections',

  // --- Header and stats ---
  'panel.level': 'Level {n}',
  'panel.lifetime': 'total XP',
  'panel.xpToNext': '{a} / {b} XP to level {n}',
  'panel.statXp': 'XP today',
  'panel.statCards': 'Cards done',
  'panel.statStreak': 'Day streak',
  'panel.statBest': 'Best',
  'panel.tokensOne': '1 streak token',
  'panel.tokensMany': '{n} streak tokens',
  'panel.tokensNote': 'each one absorbs a missed day',

  // --- Boss ---
  'boss.section': 'Boss of the day',
  'boss.none': 'No cards due in your decks.',
  'boss.defeated': 'Boss down — today\'s goal reached',
  'boss.left': '{n} HP left · {p}% damage',
  'boss.hp': '{a} / {b} HP',
  'boss.cards': '{n} cards',
  'boss.backlog': '{n} overdue',

  // --- Exams ---
  'exams.section': 'Exams ahead',
  'exams.error': 'Could not read the exams: {n}',
  'exams.noDecks': 'No deck found in the knowledge base.{n}',
  'exams.noDates': 'No exam date in the {a} rem checked.{b}',
  'exams.dailyGoal': '{n} cards a day',
  'exams.unknownDate': 'date to check',
  'exams.today': 'today',
  'exams.tomorrow': 'tomorrow',
  'exams.inDays': 'in {n} days',
  'exams.past': 'past',

  // --- Missions and feats ---
  'missions.section': 'Daily quests',
  'mission.cards': '{n} cards done',
  'mission.xp': '{n} XP earned',
  'mission.queueClear': 'Queue cleared',
  'mission.bossDamage': '{n} damage to the boss',
  'mission.easy': '{n} cards known at once',
  'mission.firstWins': '{n} first wins',
  'mission.combo': 'Streak of {n} hits',
  'mission.crits': '{n} critical hits',
  'mission.notes': '{n} XP from notes',
  'feats.section': 'Deeds',
  'feat.cards': '{n} cards reviewed',
  'feat.xp': '{n} XP all time',
  'feat.streak': '{n} day streak',
  'feat.combo': 'Streak of {n} hits',
  'feat.boss': '{n} bosses defeated',
  'feat.bossFirst': 'First boss defeated',
  'feat.bestiaryPart': '{n} monsters in the bestiary',
  'feat.bestiary': 'Full bestiary',

  // --- Chronicle and bestiary ---
  'history.section': 'Last 30 days',
  'history.day': '{a}: {b} cards, {n} XP',
  'history.dayWon': ', boss defeated',
  'history.legend': '{a} days out of {b} · peak of {n} cards',
  'history.empty': 'No day recorded yet.',
  'bestiary.section': 'Bestiary',
  'bestiary.count': '{a} defeated · {b} met out of {n}',
  'bestiary.defeated': 'Defeated',
  'bestiary.seen': 'Met',
  'bestiary.unseen': 'Never met',

  // --- Shop ---
  'shop.section': 'Shop',
  'shop.coins': '{n} coins',
  'shop.next': 'Next unlock',
  'shop.nextNow': 'You can take it now · {n} coins',
  'shop.nextMissing': '{a} coins short of {b}',
  'shop.wear': 'WEAR',
  'shop.worn': 'WORN',
  'shop.refuseUnknown': 'not available',
  'shop.refuseCoins': 'not enough coins',
  'shop.refuseOwned': 'already yours',
  'shop.refuseTokens': 'you already have the most',

  // --- Goods ---
  'item.theme:gameboy': 'Game Boy',
  'item.theme:gameboy.desc': 'Four greens and nothing else, like the screen of 1989',
  'item.theme:crypt': 'Crypt',
  'item.theme:crypt.desc': 'Purple and bone, for reviewing at night',
  'item.theme:forge': 'Forge',
  'item.theme:forge.desc': 'Embers and wrought iron',
  'item.theme:parchment': 'Parchment',
  'item.theme:parchment.desc': 'Light paper and ink, for studying by day',
  'item.pet:tome': 'Flying tome',
  'item.pet:tome.desc': 'A book that follows you and peeks at the answers',
  'item.pet:cat': 'Kitten',
  'item.pet:cat.desc': 'Indifferent to your progress, as tradition demands',
  'item.pet:owl': 'Owl',
  'item.pet:owl.desc': 'Awake whenever you are',
  'item.pet:dragonling': 'Dragonling',
  'item.pet:dragonling.desc': 'Small for now, but taking notes',
  'item.pet:ghostling': 'Ghostling',
  'item.pet:ghostling.desc': 'Quiet, as befits a library',
  'item.pet:golem': 'Pocket golem',
  'item.pet:golem.desc': 'Never tires. He does not understand it either',
  'item.pet:fire': 'Fire sprite',
  'item.pet:fire.desc': 'Keeps the spark going, literally',
  'item.pet:slime': 'Blue slimeling',
  'item.pet:slime.desc': 'Peaceful cousin of the most common boss',
  'item.token': 'Streak token',
  'item.token.desc': 'Absorbs one missed day. Can be bought again',

  // --- Companion ---
  'mood.asleep': 'Dozing until the first card',
  'mood.happy': 'Celebrating the day',
  'mood.idle': 'Keeping you company',
  'mood.days': ' · with you for {n} days',
  'mood.bosses': ' · has seen {n} bosses fall',

  // --- Queue HUD ---
  'hud.boss': 'Boss of the day',
  'hud.bossDown': 'Boss down',
  'hud.bossUnknown': 'Boss',
  'hud.level': 'Lv. {n}',
  'hud.xp': '{n} XP',
  'hud.hp': '{a} / {b} HP',
  'hud.soundOn': 'Sound on',
  'hud.soundOff': 'Sound off',
  'hud.soundTurnOn': 'Turn the sound on',
  'hud.soundTurnOff': 'Turn the sound off',
  'hud.crit': 'CRITICAL!',
  'hud.streakBroken': 'STREAK BROKEN',

  // --- Notices ---
  'toast.levelup': 'LEVEL',
  'toast.mission': 'QUEST',
  'toast.bossdown': 'BOSS DOWN',
  'toast.halfway': 'HALFWAY',
  'toast.streak': 'STREAK',
  'toast.feat': 'DEED',
  'toast.streakDays': '{n} day streak',
  'toast.halfwayBody': 'The boss is halfway down · +{n} coins',
  'toast.goalReached': 'Today\'s goal reached',
  'toast.milestone': 'Milestone reached',
  'toast.completed': 'Completed',
  'toast.completedXp': '{a} · +{b} XP',

  // --- Settings inside the panel ---
  'settings.section': 'Settings',
  'settings.langAuto': 'Same as RemNote ({n})',
  'settings.language': 'Language',
  'settings.danger': 'Danger zone',
  'settings.resetIntro':
    'Wipes XP, level, coins, streak, bestiary, deeds and history. What you have studied in RemNote is untouched.',
  'settings.resetStart': 'WIPE MY PROGRESS',
  'settings.resetAsk': 'Sure? You lose {a} lifetime XP, {b} coins and {n} monsters in the bestiary.',
  'settings.resetConfirm': 'YES, WIPE IT ALL',
  'settings.resetCancel': 'CANCEL',
  'settings.resetDone': 'Done: progress wiped.',
};
