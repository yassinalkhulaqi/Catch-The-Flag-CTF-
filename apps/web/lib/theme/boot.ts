/**
 * Inline, parser-blocking boot snippet.
 * The server sets data-theme / lang / dir. This only fills them when the
 * document was rendered without them (should not happen) so the first paint
 * still has a theme and direction.
 */
export const THEME_BOOT_SCRIPT = `(function(){
  var el=document.documentElement;
  if(!el.dataset.theme){
    var match=document.cookie.match(/(?:^|; )ctf_theme=(dark|light|system)/);
    el.dataset.theme=match?match[1]:"dark";
  }
  if(!el.lang){
    var loc=document.cookie.match(/(?:^|; )ctf_locale=(en|ar)/);
    var code=loc?loc[1]:"en";
    el.lang=code;
    el.dir=code==="ar"?"rtl":"ltr";
  }
})();`;

export const THEME_COOKIE = "ctf_theme";
export const LOCALE_COOKIE = "ctf_locale";

export function writeClientCookie(name: string, value: string): void {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=${value}; Path=/; Max-Age=31536000; SameSite=Lax`;
}

/** Paint the theme immediately so the switcher does not wait for a reload. */
export function applyDocumentTheme(theme: string): void {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.theme = theme;
}
