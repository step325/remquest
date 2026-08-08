/**
 * Le frasi in italiano.
 *
 * Restano fuori i nomi propri: i titoli di livello (Novizio, Leggenda) e i
 * nomi dei mostri non si traducono, come in un gioco doppiato bene.
 *
 * `{n}`, `{a}`, `{b}`, `{p}` sono buchi da riempire: il dizionario inglese
 * deve avere gli stessi, e un test lo verifica.
 */

export const IT = {
  // --- Schede ---
  'tab.diario': 'Diario',
  'tab.cronache': 'Cronache',
  'tab.bestiario': 'Bestiario',
  'tab.emporio': 'Emporio',
  'tab.impostazioni': 'Impostazioni',
  'tab.aria': 'Sezioni del pannello',

  // --- Intestazione e statistiche ---
  'panel.level': 'Livello {n}',
  'panel.lifetime': 'XP totali',
  'panel.close': 'Chiudi il pannello',
  'panel.drag': 'Trascina per spostare il pannello',
  'panel.xpToNext': '{a} / {b} XP al livello {n}',
  'panel.statXp': 'XP oggi',
  'panel.statCards': 'Card fatte',
  'panel.statStreak': 'Giorni di fila',
  'panel.statBest': 'Record',
  'panel.tokensOne': '1 gettone salva-serie',
  'panel.tokensMany': '{n} gettoni salva-serie',
  'panel.tokensNote': 'assorbono una giornata saltata',

  // --- Boss ---
  'boss.section': 'Boss del giorno',
  'boss.none': 'Apri le flashcard: il boss si misura sulle card che RemNote ti mette in coda.',
  'boss.defeated': 'Boss sconfitto — obiettivo di oggi raggiunto',
  'boss.left': '{n} HP rimasti · {p}% di danno',
  'boss.hp': '{a} / {b} HP',
  'boss.cards': '{n} card',

  // --- Esami ---
  'exams.section': 'Esami in arrivo',
  'exams.error': 'Lettura degli esami non riuscita: {n}',
  'exams.noDecks': 'Nessun deck trovato nella knowledge base.{n}',
  'exams.noDates': 'Nessuna data d\'esame nei {a} rem controllati.{b}',
  'exams.unknownDate': 'data da controllare',
  'exams.today': 'oggi',
  'exams.tomorrow': 'domani',
  'exams.inDays': 'tra {n} giorni',
  'exams.past': 'passato',

  // --- Missioni e imprese ---
  'missions.section': 'Missioni giornaliere',
  'mission.cards': '{n} card completate',
  'mission.xp': '{n} XP guadagnati',
  'mission.queueClear': 'Coda svuotata',
  'mission.bossDamage': '{n} danni al boss',
  'mission.easy': '{n} card sapute al volo',
  'mission.firstWins': '{n} prime vittorie',
  'mission.combo': 'Serie di {n} colpi',
  'mission.crits': '{n} colpi critici',
  'mission.notes': '{n} XP dagli appunti',
  'feats.section': 'Imprese',
  'feat.cards': '{n} card ripassate',
  'feat.xp': '{n} XP di sempre',
  'feat.streak': 'Serie di {n} giorni',
  'feat.combo': 'Serie di {n} colpi',
  'feat.boss': '{n} boss abbattuti',
  'feat.bossFirst': 'Primo boss abbattuto',
  'feat.bestiaryPart': '{n} mostri nel bestiario',
  'feat.bestiary': 'Bestiario completo',

  // --- Cronache e bestiario ---
  'history.section': 'Ultimi 30 giorni',
  'history.day': '{a}: {b} card, {n} XP',
  'history.dayWon': ', boss abbattuto',
  'history.legend': '{a} giornate su {b} · picco di {n} card',
  'history.empty': 'Ancora nessuna giornata registrata.',
  'bestiary.section': 'Bestiario',
  'bestiary.count': '{a} abbattuti · {b} incontrati su {n}',
  'bestiary.defeated': 'Abbattuto',
  'bestiary.seen': 'Incontrato',
  'bestiary.unseen': 'Mai incontrato',

  // --- Emporio ---
  'shop.section': 'Emporio',
  'shop.coins': '{n} monete',
  'shop.next': 'Prossimo sblocco',
  'shop.nextNow': 'Puoi prenderlo adesso · {n} monete',
  'shop.nextMissing': 'Ti mancano {a} monete su {b}',
  'shop.wear': 'INDOSSA',
  'shop.worn': 'INDOSSATO',
  'shop.refuseUnknown': 'non disponibile',
  'shop.refuseCoins': 'monete insufficienti',
  'shop.refuseOwned': 'già tuo',
  'shop.refuseTokens': 'ne hai già il massimo',

  // --- Articoli in vendita ---
  'item.theme:gameboy': 'Verde tascabile',
  'item.theme:gameboy.desc': 'Quattro verdi e nient\'altro, come le console a cristalli liquidi del 1989',
  'item.theme:crypt': 'Cripta',
  'item.theme:crypt.desc': 'Viola e ossa, per chi ripassa di notte',
  'item.theme:forge': 'Fucina',
  'item.theme:forge.desc': 'Brace e ferro battuto',
  'item.theme:parchment': 'Pergamena',
  'item.theme:parchment.desc': 'Fondo chiaro e inchiostro, per chi studia di giorno',
  'item.pet:tome': 'Tomo volante',
  'item.pet:tome.desc': 'Un libro che ti segue e sbircia le risposte',
  'item.pet:cat': 'Gattino',
  'item.pet:cat.desc': 'Indifferente ai tuoi progressi, come da tradizione',
  'item.pet:owl': 'Gufo',
  'item.pet:owl.desc': 'Sveglio quando lo sei tu',
  'item.pet:dragonling': 'Cucciolo di drago',
  'item.pet:dragonling.desc': 'Piccolo adesso, ma prende appunti',
  'item.pet:ghostling': 'Fantasmino',
  'item.pet:ghostling.desc': 'Silenzioso, come si conviene in biblioteca',
  'item.pet:golem': 'Golem tascabile',
  'item.pet:golem.desc': 'Non si stanca mai. Nemmeno lui capisce come',
  'item.pet:fire': 'Spiritello di fuoco',
  'item.pet:fire.desc': 'Tiene acceso l\'entusiasmo, letteralmente',
  'item.pet:slime': 'Melmina azzurra',
  'item.pet:slime.desc': 'Parente pacifico del boss piu\' comune',
  'item.token': 'Gettone salva-serie',
  'item.token.desc': 'Assorbe una giornata saltata. Si puo\' ricomprare',

  // --- Compagno ---
  'mood.asleep': 'Sonnecchia in attesa della prima card',
  'mood.happy': 'Festeggia la giornata',
  'mood.idle': 'Ti tiene compagnia',
  'mood.days': ' · ti segue da {n} giorni',
  'mood.bosses': ' · ha visto cadere {n} boss',

  // --- Prestigio ---
  'prestige.badge': 'Prestigio {n} · dal livello {a}',

  // --- HUD della coda ---
  'hud.boss': 'Boss del giorno',
  'hud.bossDown': 'Boss sconfitto',
  'hud.bossUnknown': 'Boss',
  'hud.level': 'Liv. {n}',
  'hud.xp': '{n} XP',
  'hud.hp': '{a} / {b} HP',
  'hud.soundOn': 'Suoni accesi',
  'hud.soundOff': 'Suoni spenti',
  'hud.soundTurnOn': 'Accendi i suoni',
  'hud.soundTurnOff': 'Spegni i suoni',
  'hud.crit': 'CRITICO!',
  'hud.streakBroken': 'SERIE INTERROTTA',

  // --- Avvisi ---
  'toast.levelup': 'LIVELLO',
  'toast.mission': 'MISSIONE',
  'toast.bossdown': 'BOSS SCONFITTO',
  'toast.halfway': 'META\' BATTAGLIA',
  'toast.streak': 'SERIE',
  'toast.feat': 'IMPRESA',
  'toast.streakDays': '{n} giorni di fila',
  'toast.halfwayBody': 'Il boss è a metà · +{n} monete',
  'toast.tokenSpent': 'gettone speso',
  'toast.goalReached': 'Obiettivo di oggi raggiunto',
  'toast.milestone': 'Traguardo raggiunto',
  'toast.completed': 'Completata',
  'toast.completedXp': '{a} · +{b} XP',
  'toast.recap': 'FINE SESSIONE',
  'toast.recapAlone': '{n} colpi oggi',
  'toast.recapWith': 'Tu e {a}: {b} colpi oggi',
  'toast.recapBossDown': ' · boss abbattuto',

  // --- Impostazioni dentro il pannello ---
  'settings.section': 'Impostazioni',
  'settings.langAuto': 'Come RemNote ({n})',
  'settings.language': 'Lingua',
  'settings.coffee': 'OFFRIMI UN CAFFÈ',
  'settings.coffeeNote': 'Remquest è gratis e resta gratis.',
  'settings.danger': 'Zona pericolosa',
  'settings.resetIntro':
    'Azzera XP, livello, monete, serie di giorni, bestiario, imprese e storico. Quello che hai studiato in RemNote non si tocca.',
  'settings.resetStart': 'AZZERA I PROGRESSI',
  'settings.resetAsk': 'Sicuro? Si perdono {a} XP di sempre, {b} monete e {n} mostri del bestiario.',
  'settings.resetConfirm': 'SÌ, CANCELLA TUTTO',
  'settings.resetCancel': 'ANNULLA',
  'settings.resetDone': 'Fatto: progressi azzerati.',
} as const;
