/**
 * Runs in <head> before first paint. The intro plays once per browser session, and
 * not at all for visitors who prefer reduced motion; marking <html data-intro="done">
 * keeps its cover from ever showing.
 */
export const INTRO_KEY = "sic-intro";

export function introBootScript() {
  return `(function(){var d=document.documentElement,skip=false;try{skip=sessionStorage.getItem(${JSON.stringify(INTRO_KEY)})==="1";}catch(e){}try{if(window.matchMedia("(prefers-reduced-motion: reduce)").matches)skip=true;}catch(e){}if(skip)d.dataset.intro="done";})();`;
}
