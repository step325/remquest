/**
 * L'icona del plugin nella barra laterale — regole pure.
 *
 * `registerSidebarButton` accetta un campo `icon`, ma l'SDK 0.0.46 non lo
 * spedisce: manda all'app solo `id` e `name` (si vede in
 * node_modules/@remnote/plugin-sdk/dist/index.js). L'unica via che resta e'
 * il CSS iniettato nell'app con `plugin.app.registerCSS`.
 *
 * Il bottone e' un `div` con le stesse classi di tutte le altre voci, quindi
 * per nome non lo si prende. RemNote pero' scrive
 * `data-test="Extension Sidebar Link <nome del plugin>"`: quello distingue il
 * nostro da quello di un altro plugin.
 *
 * L'icona di serie e' uno `<span data-icon="extension">` colorato da
 * `background-color: currentcolor` e ritagliato da una `mask-image` inline.
 * Per metterci un disegno a colori vanno spente entrambe.
 */

/** Il bottone del plugin nella barra, per nome */
export function sidebarLinkSelector(pluginName: string): string {
  // Il nome viene dal manifest: una virgoletta chiuderebbe il selettore a
  // meta' e il browser butterebbe via tutta la regola.
  const safe = pluginName.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  return `[data-test="Extension Sidebar Link ${safe}"]`;
}

/**
 * Il CSS che sostituisce il puzzle con il nostro sprite.
 *
 * Ogni dichiarazione e' `!important` perche' le proprieta' che scavalca sono
 * stili inline scritti da RemNote, e un foglio di stile normale perde contro
 * un attributo `style`.
 */
export function sidebarIconCss(pluginName: string, dataUrl: string): string {
  return `${sidebarLinkSelector(pluginName)} [data-icon="extension"] {
  mask-image: none !important;
  -webkit-mask-image: none !important;
  background-color: transparent !important;
  background-image: url("${dataUrl}") !important;
  background-repeat: no-repeat !important;
  background-position: center center !important;
  background-size: contain !important;
  image-rendering: pixelated !important;
}`;
}
