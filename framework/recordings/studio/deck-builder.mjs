// Builds a narrated slide deck the recording studio can play: one <section class="slide"> per slide, each with a
// data-say-script of "OBI: ...||OGE: ..." lines (the same format as the PREP-3 deck), boxes as .tile so the studio's
// spot-zoom can ring the box a line names, and #sN navigation. Text is sized to stay inside its box at 1280x720.
// Usage: import { buildDeck } from './deck-builder.mjs'; buildDeck(spec, outFile)
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function buildDeck(spec, out) {
  const slides = spec.slides.map((s, i) => {
    const script = s.say.map(([who, text]) => `${who}: ${text}`).join('||');
    // A tile may carry an image (t.img, a path relative to the deck) with alt text t.alt; it is fitted inside the tile.
    const tiles = (s.tiles || []).map((t) => `<div class="tile${t.tone ? ' ' + t.tone : ''}${t.img ? ' pic' : ''}"><h3>${esc(t.h)}</h3>${t.img ? `<img src="${esc(t.img)}" alt="${esc(t.alt || t.h)}">` : ''}${(t.p || []).map((p) => `<p>${esc(p)}</p>`).join('')}</div>`).join('');
    const cols = Math.min(4, Math.max(1, s.cols || (s.tiles || []).length || 1));
    return `<section class="slide" id="s${i + 1}" aria-label="Slide ${i + 1}" data-say-script="${esc(script)}"${i ? ' hidden' : ''}>
<div class="kicker">${esc(spec.kicker)} · ${i + 1} / ${spec.slides.length}</div>
<h2>${esc(s.title)}</h2>${s.lede ? `<p class="lede">${esc(s.lede)}</p>` : ''}
<div class="grid" style="grid-template-columns:repeat(${cols},minmax(0,1fr))">${tiles}</div>
${s.foot ? `<p class="foot">${esc(s.foot)}</p>` : ''}
</section>`;
  }).join('\n');
  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(spec.title)}</title>
<style>
:root{--navy:#14284b;--ink:#1d2433;--soft:#5b6476;--line:#d9dee8;--teal:#0f7b6c;--amber:#b45309;--red:#b42318;--bg:#f6f7fa}
*{box-sizing:border-box}html,body{margin:0;height:100%;background:var(--bg);color:var(--ink);font:17px/1.4 "Segoe UI",system-ui,sans-serif}
.slide{position:absolute;inset:0;padding:34px 48px 30px;display:flex;flex-direction:column;overflow:hidden}
.slide[hidden]{display:none}
.kicker{font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:var(--red);font-weight:700}
h2{margin:6px 0 4px;font-size:32px;line-height:1.3;padding-bottom:2px;color:var(--navy)}
.lede{margin:2px 0 10px;color:var(--soft);font-size:18px;max-width:1100px}
.grid{display:grid;gap:14px;flex:1;min-height:0;align-content:start;margin-top:8px}
.tile{background:#fff;border:1px solid var(--line);border-top:5px solid var(--navy);border-radius:10px;padding:14px 16px;min-width:0;overflow-wrap:anywhere}
.tile.ok{border-top-color:var(--teal)}.tile.warn{border-top-color:var(--amber)}.tile.no{border-top-color:var(--red)}
.tile h3{margin:0 0 6px;font-size:19px;color:var(--navy)}
.tile p{margin:0 0 6px;font-size:15.5px;color:var(--ink)}
.tile.pic{display:flex;flex-direction:column;min-height:0}
.tile.pic img{display:block;max-width:100%;max-height:330px;object-fit:contain;object-position:left top;border:1px solid var(--line);border-radius:6px;margin:2px 0 8px}
.foot{margin:8px 0 0;font-size:13px;color:var(--soft)}
code{font-family:Consolas,monospace;font-size:.92em}
</style></head><body>
${slides}
<script>
(function(){var all=[].slice.call(document.querySelectorAll('.slide'));
function show(){var n=parseInt((location.hash.match(/s(\\d+)/)||[0,1])[1],10);all.forEach(function(s,i){s.hidden=i!==n-1;});}
window.addEventListener('hashchange',show);show();
document.addEventListener('keydown',function(e){var n=parseInt((location.hash.match(/s(\\d+)/)||[0,1])[1],10);
if(e.key==='ArrowRight'&&n<all.length)location.hash='#s'+(n+1);if(e.key==='ArrowLeft'&&n>1)location.hash='#s'+(n-1);});})();
</script></body></html>`;
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, html);
  return out;
}
