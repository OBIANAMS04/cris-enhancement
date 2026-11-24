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
}
await browser.close();
