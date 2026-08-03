/**
 * Le frasi del gioco in due lingue — regole pure.
 *
 * I dizionari sono due oggetti piatti con le stesse chiavi (un test lo
 * pretende). Chi disegna passa la lingua e la chiave, e riceve la frase con i
 * buchi gia' riempiti.
 *
 * Cosa NON si traduce: i titoli di livello e i nomi dei mostri. Sono nomi
 * propri — un gioco doppiato bene non ribattezza i personaggi.
 *
 * Nessun import dall'SDK: il modulo dev'essere caricabile dai test di Node.
 */

import { EN } from './en';
import { IT } from './it';

export type Lang = 'it' | 'en';

/** Le lingue disponibili, nell'ordine in cui si mostrano */
export const LANGS: readonly Lang[] = ['it', 'en'];

/** La lingua di casa: e' quella in cui il gioco e' stato scritto */
export const DEFAULT_LANG: Lang = 'it';

/**
 * «Segui l'applicazione»: e' cosi' che nasce il plugin, prima che qualcuno
 * scelga. Non e' una lingua, e' l'assenza di scelta — percio' e' una stringa
 * vuota e non un terzo codice.
 */
export const AUTO_LANG = '';

/**
 * La lingua da usare per un'applicazione che parla `locale`.
 *
 * Le lingue tradotte sono due: chi ha RemNote in tedesco o in giapponese sta
 * meglio con l'inglese che con l'italiano. Senza nessun codice si resta
 * all'italiano, che e' la lingua in cui il gioco e' scritto.
 */
export function langFromLocale(locale: string | undefined | null): Lang {
  const codice = (locale ?? '').trim().toLowerCase();
  if (codice === '') return DEFAULT_LANG;
  return codice.startsWith('it') ? 'it' : 'en';
}

/**
 * La lingua giusta: quella scelta, o quella dell'applicazione.
 *
 * Una scelta esplicita vince sempre e non viene piu' rimessa in discussione:
 * chi ha RemNote in inglese e vuole il gioco in italiano deve poterlo tenere.
 */
export function resolveLang(stored: unknown, locale: string | undefined | null): Lang {
  return LANGS.includes(stored as Lang) ? (stored as Lang) : langFromLocale(locale);
}

/**
 * La lingua dell'applicazione che ci ospita.
 *
 * L'SDK 0.0.46 non la espone, quindi si guarda quella del contesto in cui gira
 * il widget: nell'app da scrivania e' la lingua di sistema, nel browser quella
 * del browser. E' l'approssimazione migliore disponibile, e chi non e'
 * d'accordo sceglie a mano.
 */
export function appLocale(): string {
  if (typeof navigator === 'undefined') return '';
  return navigator.language ?? '';
}

export type StringKey = keyof typeof IT;

const DICTS: Record<Lang, Record<StringKey, string>> = { it: IT, en: EN };

/**
 * La lingua, comunque sia scritta nello storage.
 *
 * Il valore arriva dalle impostazioni: puo' essere un codice vecchio, una
 * stringa vuota o `undefined`. Meglio l'italiano che una schermata di chiavi.
 */
export function normalizeLang(value: unknown): Lang {
  return LANGS.includes(value as Lang) ? (value as Lang) : DEFAULT_LANG;
}

/**
 * La frase, con i buchi riempiti.
 *
 * Un buco senza valore resta scritto: `{n}` a schermo si vede subito e dice
 * cosa manca, mentre una frase mutilata sembra solo scritta male.
 */
export function t(lang: Lang, key: StringKey, vars?: Record<string, string | number>): string {
  const frase = DICTS[normalizeLang(lang)][key];
  if (frase === undefined) return String(key); // chiave inventata: non si cade

  if (!vars) return frase;
  return frase.replace(/\{(\w+)\}/g, (buco, nome: string) =>
    vars[nome] === undefined ? buco : String(vars[nome])
  );
}

/** La funzione gia' legata a una lingua, per chi disegna una schermata intera */
export type Translate = (key: StringKey, vars?: Record<string, string | number>) => string;

export const translator =
  (lang: Lang): Translate =>
  (key, vars) =>
    t(lang, key, vars);
