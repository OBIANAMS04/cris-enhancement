// Checks each recorded video in Google Chrome: it loads, has a finite duration (seekable), carries real sound,
// and frames at set points look right (stills saved to framework/recordings/videos/stills/<name>-<sec>.png).
// node framework/recordings/studio/verify.mjs <name> [seconds ...]   (needs scripts/serve.mjs running)
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = resolve(fileURLToPath(new URL('.', import.meta.url)), '../../..');
const require = createRequire(join(process.env.REC_TOOLS || resolve(repo, '../rec-tools'), 'package.json'));
const { chromium } = require('playwright');
const [name, ...at] = process.argv.slice(2);
const stills = join(repo, 'framework/recordings/videos/stills');
mkdirSync(stills, { recursive: true });

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
await page.goto('http://localhost:4321/framework/recordings/studio/stage.html');
const info = await page.evaluate(async (src) => {
  document.body.innerHTML = `<video id="v" src="${src}" muted style="position:fixed;inset:0;width:1280px;height:720px;background:#000"></video>`;
  const v = document.getElementById('v');
  await new Promise((r, j) => { v.onloadedmetadata = r; v.onerror = () => j(new Error('video error ' + (v.error && v.error.code))); });
  const buf = await (await fetch(src)).arrayBuffer();
  const ab = await new OfflineAudioContext(1, 1, 48000).decodeAudioData(buf);
  const d = ab.getChannelData(0); let s = 0, loud = 0;
  for (let i = 0; i < d.length; i++) { s += d[i] * d[i]; if (Math.abs(d[i]) > 0.02) loud++; }
  return { duration: v.duration, width: v.videoWidth, height: v.videoHeight, audioSeconds: ab.duration, rms: Math.sqrt(s / d.length), speechShare: loud / d.length, chrome: navigator.userAgent.match(/Chrome\/[\d.]+/)[0] };
}, `/framework/recordings/videos/${name}.webm`);
console.log(name, JSON.stringify(info));
// Play it (fast, muted) the way a viewer would, and grab a still as each checkpoint passes.
await page.evaluate(() => { const v = document.getElementById('v'); v.playbackRate = 4; return v.play(); });
for (const sec of at.map(Number).sort((a, b) => a - b)) {
  await page.waitForFunction((t) => document.getElementById('v').currentTime >= t, sec, { timeout: 600000, polling: 50 });
  await page.screenshot({ path: join(stills, `${name}-${sec}.png`) });
  // Black borders mean the picture was shrunk into the frame (the page area drifted from 1280 x 720).
  const edges = await page.evaluate(() => {
    const v = document.getElementById('v');
    const c = Object.assign(document.createElement('canvas'), { width: 1280, height: 720 });
    const g = c.getContext('2d');
    g.drawImage(v, 0, 0, 1280, 720);
    const mean = (x, y, w, h) => { const d = g.getImageData(x, y, w, h).data; let s = 0; for (let i = 0; i < d.length; i += 4) s += d[i] + d[i + 1] + d[i + 2]; return s / (d.length / 4) / 3; };
    return { left: Math.round(mean(0, 100, 6, 400)), right: Math.round(mean(1274, 100, 6, 400)), bottom: Math.round(mean(100, 716, 1000, 4)) };
  });
  const boxed = edges.left < 8 && edges.right < 8;
  console.log(`  ${sec}s: ${boxed ? 'BLACK BORDERS (re-record)' : 'full frame'} ${JSON.stringify(edges)}`);
  if (boxed) process.exitCode = 1;
}
await browser.close();
