/**
 * Resolve hook per i test: aggiunge l'estensione .ts agli import relativi che
 * ne sono privi.
 *
 * Il codice sorgente li scrive senza estensione (li risolve webpack via
 * resolve.extensions) e TypeScript 4.7 non permette di scriverli con `.ts`
 * (allowImportingTsExtensions esiste solo da TS 5.0). L'ESM di Node invece
 * pretende il path esatto: questo hook colma la differenza senza toccare i
 * sorgenti ne' aggiungere dipendenze.
 */

const RELATIVE = /^\.{1,2}\//;
const HAS_EXTENSION = /\.[cm]?[jt]sx?$|\.json$/;

export async function resolve(specifier, context, nextResolve) {
  if (RELATIVE.test(specifier) && !HAS_EXTENSION.test(specifier)) {
    try {
      return await nextResolve(`${specifier}.ts`, context);
    } catch {
      // non e' un modulo TS: prosegue con la risoluzione standard
    }
  }
  return nextResolve(specifier, context);
}
