// Copy the guided-tour engine (framework/tour-snippet.html) into every page and deck that carries it, so they never drift.
//   node framework/sync-tour.js [extra page paths...]
// Pages (data-mode="page") get the whole snippet block, from "<!-- Guided tour." to the engine's closing </script>.
// Decks keep their own deck-tour header comment and data-mode="deck"; their style (without the page-only launch rules),
// panel, pointer and engine script are replaced. Dialogue lives in each page's own markup and is never touched.
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const snip = fs.readFileSync(path.join(__dirname, 'tour-snippet.html'), 'utf8');

const between = (s, a, b, from = 0) => {
  const i = s.indexOf(a, from);
  if (i < 0) return null;
  const j = s.indexOf(b, i + a.length);
  if (j < 0) return null;
  return { i, j: j + b.length, text: s.slice(i, j + b.length) };
};
const part = (re) => { const m = snip.match(re); if (!m) throw new Error('snippet part missing: ' + re); return m[0]; };
const STYLE = part(/<style>[\s\S]*?<\/style>/);
const PANEL = part(/<aside class="tour-panel"[\s\S]*?<\/aside>/);
const CURSOR = part(/<div class="tour-cursor"[\s\S]*?<\/div>/);
const SCRIPT = part(/<script>\n\(\(\) => \{\n  'use strict';\n  const panel = document\.getElementById\('tour-panel'\);[\s\S]*?\n\}\)\(\);\n<\/script>/);
const DECK_STYLE = STYLE.replace(/\/\* tour-launch: page only \(start\) \*\/[\s\S]*?\/\* tour-launch: page only \(end\) \*\/\n/, '');

function syncPage(h) {
  const start = h.indexOf('<!-- Guided tour. Standing rules');
  if (start < 0) throw new Error('no snippet block');
  const end = h.indexOf('\n})();\n</script>', start);
  if (end < 0) throw new Error('no engine end');
  return h.slice(0, start) + snip.trim() + h.slice(end + '\n})();\n</script>'.length);
}
function syncDeck(h) {
  const blk = between(h, '<!-- deck-tour start -->', '<!-- deck-tour end -->');
  if (!blk) throw new Error('no deck-tour block');
  let b = blk.text;
  const rep = (re, to, what) => { if (!re.test(b)) throw new Error('deck part missing: ' + what); b = b.replace(re, () => to); };
  rep(/<style>[\s\S]*?<\/style>/, DECK_STYLE, 'style');
  rep(/<aside class="tour-panel"[\s\S]*?<\/aside>/, PANEL.replace('data-mode="page"', 'data-mode="deck"'), 'panel');
  rep(/<div class="tour-cursor"[\s\S]*?<\/div>/, CURSOR, 'cursor');
  rep(/<script>\n\(\(\) => \{\n  'use strict';\n  const panel = document\.getElementById\('tour-panel'\);[\s\S]*?\n\}\)\(\);\n<\/script>/, SCRIPT, 'script');
  return h.slice(0, blk.i) + b + h.slice(blk.j);
}

const sss = path.resolve(root, '..', 'SSS-Proposal-Library-Standard-Context', 'docs');
const files = [
  path.join(root, 'framework', 'PROJECT-FRAMEWORK.html'),
  ...['m1', 'm2', 'm3', 'm4'].flatMap((m) => ['index.html', 'artifact.html'].map((f) => path.join(root, 'framework', 'presentations', m, f))),
  path.join(sss, 'PROJECT-FRAMEWORK.html'),
  path.join(sss, 'demo', 'SSS-DEMO-BRIEFING.html'),
  ...process.argv.slice(2).map((p) => path.resolve(p)),
].filter((f) => fs.existsSync(f));

for (const f of files) {
  const h = fs.readFileSync(f, 'utf8');
  const out = h.includes('<!-- deck-tour start -->') ? syncDeck(h) : syncPage(h);
  if (out !== h && !process.env.DRY) fs.writeFileSync(f, out);
  console.log((out === h ? 'same    ' : 'updated ') + path.relative(path.resolve(root, '..'), f));
}
