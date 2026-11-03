// Per-viewer UI preferences. Stored in localStorage (a convenience, not data that must survive),
// applied as attributes on <html> so CSS does all the work.
import type { Category } from "./types";

export type Prefs = {
  theme?: string;
  accent?: string;
  layout?: "list" | "cards";
  density?: "comfortable" | "compact";
  font?: "sans" | "mono";
  topics?: Category[];
  muteWords?: string[]; // already normalized with muteKey()
  muteSources?: string[];
};

/**
 * Normalizes text for mute matching: lowercase words separated by single spaces. Article items carry
 * data-title=" <muteKey(title)> ", so a mute rule [data-title*=" word "] matches whole words and phrases
 * ("go" won't hide "google"). The output has no quotes or backslashes, so it's safe inside a CSS string.
 */
export const muteKey = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}+#.]+/gu, " ")
    .replace(/\.(?=\s|$)/g, "")
    .trim();

export const THEMES: { id: string; label: string; swatch: [bg: string, fg: string, accent: string] }[] = [
  { id: "system", label: "System", swatch: ["#ffffff", "#0b0b0f", "#059669"] },
  { id: "light", label: "Light", swatch: ["#ffffff", "#17171c", "#059669"] },
  { id: "dark", label: "Dark", swatch: ["#0b0b0f", "#ececf1", "#34d399"] },
  { id: "midnight", label: "Midnight", swatch: ["#0a0f1f", "#e5e9f6", "#7c9cff"] },
  { id: "nord", label: "Nord", swatch: ["#2e3440", "#eceff4", "#88c0d0"] },
  { id: "dracula", label: "Dracula", swatch: ["#282a36", "#f8f8f2", "#bd93f9"] },
  { id: "solarized", label: "Solarized", swatch: ["#fdf6e3", "#073642", "#268bd2"] },
  { id: "paper", label: "Paper", swatch: ["#f7f3ea", "#2b2622", "#c2410c"] },
  { id: "terminal", label: "Terminal", swatch: ["#050a06", "#b6f5c0", "#39ff6a"] },
];

export const ACCENTS = ["#059669", "#2563eb", "#7c3aed", "#db2777", "#ea580c", "#ca8a04", "#0891b2", "#dc2626"];

export const KEY = "devpulse:prefs";
export const EVENT = "devpulse:prefs"; // same-tab change notification ("storage" only fires in *other* tabs)

/**
 * Runs inline in <head> before the page paints, so a saved theme never flashes the default first.
 * It also defines window.__devpulseApply, which the Customize panel calls — one implementation, no drift.
 */
export const PREFS_SCRIPT = `(function(){
var d=document.documentElement;
window.__devpulseApply=function(p){
["theme","layout","density","font"].forEach(function(k){p[k]?d.setAttribute("data-"+k,p[k]):d.removeAttribute("data-"+k)});
p.accent?d.style.setProperty("--accent",p.accent):d.style.removeProperty("--accent");
var c="",q=function(v){return String(v).replace(/["\\\\]/g,"")};
(p.muteSources||[]).forEach(function(s){c+='[data-source="'+q(s)+'"],'});
(p.muteWords||[]).forEach(function(w){c+='[data-title*=" '+q(w)+' "],'});
var st=document.getElementById("dp-mute");
if(!st){st=document.createElement("style");st.id="dp-mute";document.head.appendChild(st)}
st.textContent=c?c.slice(0,-1)+"{display:none!important}":"";
};
try{window.__devpulseApply(JSON.parse(localStorage.getItem("${KEY}")||"{}"))}catch(e){}
})()`;

declare global {
  interface Window {
    __devpulseApply?: (p: Prefs) => void;
  }
}
