// Build a milestone deck from the previous one: same shell, charts helper and narrated deck tour, new slides and charts.
//   node framework/presentations/build/build-deck.js m4
// Reads presentations/<prev>/index.html as the base, build/<name>-slides.html for the slides (each slide carries
// data-say and data-say-script "OBI: …||OGE: …"), and build/<name>-charts.js for the chart functions. Writes
// presentations/<name>/index.html (the public copy) and presentations/<name>/artifact.html (the artifact source,
// without the document wrapper).
const fs = require('fs');
const path = require('path');
const name = process.argv[2];
const prev = { m4: 'm3' }[name];
if (!prev) throw new Error('usage: build-deck.js m4');
const root = path.resolve(__dirname, '..');
let d = fs.readFileSync(path.join(root, prev, 'index.html'), 'utf8');
if (!d.includes('<!-- deck-tour start -->')) throw new Error('base deck has no deck-tour block');
const title = { m4: 'CRIS Milestone 4 Story' }[name];
d = d.replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`);
const t0 = d.indexOf('<template id="slides">');
const t1 = d.indexOf('</template>') + '</template>'.length;
d = d.slice(0, t0) + fs.readFileSync(path.join(__dirname, `${name}-slides.html`), 'utf8').trim() + d.slice(t1);
const c0 = d.indexOf('  function points(host) {');
const cStart = d.indexOf('  var charts = {', c0);
const c1 = d.indexOf('\n  };', cStart) + '\n  };'.length;
if (c0 < 0 || cStart < 0) throw new Error('charts block not found');
d = d.slice(0, c0) + fs.readFileSync(path.join(__dirname, `${name}-charts.js`), 'utf8').trimEnd() + d.slice(c1);
fs.mkdirSync(path.join(root, name, 'screens'), { recursive: true });
fs.writeFileSync(path.join(root, name, 'index.html'), d);
const artifact = d.replace(/^<!doctype html>\s*<html[^>]*>\s*<head>\s*<meta charset="utf-8">\s*<meta name="viewport"[^>]*>\s*/i, '').replace(/<\/head>\s*<body>\s*/i, '').replace(/\s*<\/body>\s*<\/html>\s*$/i, '\n');
fs.writeFileSync(path.join(root, name, 'artifact.html'), artifact);
console.log(`${name} built: ${(d.match(/class="slide"/g) || []).length} slides, ${(d.match(/data-say-script=/g) || []).length} dialogues`);
