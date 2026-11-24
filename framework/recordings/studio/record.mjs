// Records the CRIS rehearsal videos: node framework/recordings/studio/record.mjs [plan ...]
// Needs `node scripts/serve.mjs` running (http://localhost:4321) and a tools folder with Playwright
// (REC_TOOLS, default ../rec-tools next to this repo: `npm i playwright fix-webm-duration`). Uses the installed Edge.
// 1. Each narration line is spoken to a WAV with the Windows voices (tts.ps1): OBI = Microsoft David, Oge = Microsoft Mark.
// 2. Edge opens stage.html, which captures its own tab (picture and sound) with MediaRecorder.
// 3. The plan runs: decks change slide, the live workspace is clicked for real, each line plays and is captioned.
// 4. The recording is given its duration (so players can seek) and saved to framework/recordings/videos/<plan>.webm.
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync, appendFileSync, copyFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { plans, say as spoken } from './plans.mjs';

const here = fileURLToPath(new URL('.', import.meta.url));
const repo = resolve(here, '../../..');
const tools = process.env.REC_TOOLS || resolve(repo, '../rec-tools');
const require = createRequire(join(tools, 'package.json'));
const { chromium } = require('playwright');
const fixWebm = readFileSync(require.resolve('fix-webm-duration'), 'utf8');
const ORIGIN = 'http://localhost:4321/';
const work = join(tools, 'out');
const samples = join(repo, 'framework/recordings/02-working-system-demo/sample-files');
const videos = join(repo, 'framework/recordings/videos');
mkdirSync(work, { recursive: true });
mkdirSync(videos, { recursive: true });

// Voices. With AZURE_SPEECH_KEY and AZURE_SPEECH_REGION set (Obi's own Azure AI Speech resource; free tier F0 is
// enough), the lines are spoken by Microsoft's neural voices through the official Azure text-to-speech REST API.
// Without them, the built-in Windows voices are used. The key is read from the environment, never stored here.
const AZURE = process.env.AZURE_SPEECH_KEY && process.env.AZURE_SPEECH_REGION;
const VOICE = AZURE
  ? { OBI: { voice: 'en-US-AndrewMultilingualNeural', rate: '-4%' }, OGE: { voice: 'en-US-BrianMultilingualNeural', rate: '0%' } }
  : { OBI: { voice: 'Microsoft David', rate: 0.92 }, OGE: { voice: 'Microsoft Mark', rate: 1.0 } };
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
async function azureSpeak(lines) {
  let made = 0;
  for (const l of lines) {
    if (existsSync(l.file)) continue;
    const ssml = `<speak version="1.0" xml:lang="en-US"><voice name="${l.voice}"><prosody rate="${l.rate}">${esc(l.text)}</prosody></voice></speak>`;
    const r = await fetch(`https://${process.env.AZURE_SPEECH_REGION}.tts.speech.microsoft.com/cognitiveservices/v1`, {
      method: 'POST',
      headers: { 'Ocp-Apim-Subscription-Key': process.env.AZURE_SPEECH_KEY, 'Content-Type': 'application/ssml+xml', 'X-Microsoft-OutputFormat': 'riff-24khz-16bit-mono-pcm', 'User-Agent': 'cris-rehearsal-studio' },
      body: ssml,
    });
    if (!r.ok) throw new Error(`Azure speech ${r.status}: ${await r.text()}`);
    writeFileSync(l.file, Buffer.from(await r.arrayBuffer()));
    made++;
  }
  return `made ${made} of ${lines.length} lines (Azure neural voices)`;
}
const wavSeconds = (f) => { const b = readFileSync(f); const d = b.indexOf('data', 12); return b.readUInt32LE(d + 4) / b.readUInt32LE(28); };

async function record(name) {
  const plan = plans[name];
  if (!plan) throw new Error(`No plan called ${name}`);
  // 1. Voices.
  const audio = join(work, 'audio');
  mkdirSync(audio, { recursive: true });
  const lines = plan.steps.filter((s) => s.say).map((s) => {
    const v = { ...VOICE[s.say], ...(!AZURE && plan.rate ? { rate: plan.rate } : {}) };
    const text = spoken(s.text);
    const id = createHash('sha1').update(`${v.voice}|${v.rate}|${text}`).digest('hex').slice(0, 16);
    s.wav = `${id}.wav`;
    return { file: join(audio, s.wav), voice: v.voice, rate: v.rate, text };
  });
  writeFileSync(join(work, `${name}.lines.json`), JSON.stringify(lines));
  console.log(AZURE ? await azureSpeak(lines) : execFileSync('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', join(here, 'tts.ps1'), join(work, `${name}.lines.json`)], { encoding: 'utf8' }).trim());
  const talk = lines.reduce((t, l) => t + wavSeconds(l.file), 0);
  console.log(`${name}: ${lines.length} lines, ${Math.round(talk)} s of speech`);

  // 2. Stage.
  // A real window (no emulated viewport) at scale 1, sized so the page area is exactly 1280 x 720: tab capture
  // records the real window, so an emulated viewport would record a blank surface.
  const browser = await chromium.launch({ channel: 'msedge', headless: false, args: ['--auto-accept-this-tab-capture', '--autoplay-policy=no-user-gesture-required', '--force-device-scale-factor=1', '--window-size=1296,860', '--window-position=0,0'] });
  const page = await browser.newPage({ viewport: null });
  await page.goto(ORIGIN + 'framework/recordings/studio/stage.html');
  const cdp = await page.context().newCDPSession(page);
  const { windowId } = await cdp.send('Browser.getWindowForTarget');
  const fit = async () => {
    for (let i = 0; i < 5; i++) {
      const [w, h] = await page.evaluate(() => [innerWidth, innerHeight]);
      if (w === 1280 && h === 720) return;
      const { bounds } = await cdp.send('Browser.getWindowBounds', { windowId });
      await cdp.send('Browser.setWindowBounds', { windowId, bounds: { width: bounds.width + 1280 - w, height: bounds.height + 720 - h } });
      await page.waitForTimeout(400);
    }
  };
  await fit();
  console.log('  page area', await page.evaluate(() => `${innerWidth}x${innerHeight} at ${devicePixelRatio}x`));
  await page.route('**/__studio_audio/*', (r) => r.fulfill({ path: join(audio, r.request().url().split('/').pop()), contentType: 'audio/wav' }));
  const out = join(work, `${name}.webm`);
  writeFileSync(out, '');
  await page.exposeFunction('studioChunk', (b64) => appendFileSync(out, Buffer.from(b64, 'base64')));
  await page.reload();
  await page.addScriptTag({ content: fixWebm });
  await page.evaluate((t) => window.studio.tag(t), plan.title);
  const voiced = (x) => (AZURE && typeof x === 'string' ? x.replace(/synthetic Windows voices?/g, 'synthetic Microsoft neural voices') : x);
  if (AZURE) await page.evaluate(() => { document.getElementById('tag-voices').textContent = 'synthetic neural voices'; });
  await page.evaluate(async () => {
    const stream = await navigator.mediaDevices.getDisplayMedia({ video: { frameRate: 24, width: 1280, height: 720 }, audio: { suppressLocalAudioPlayback: false }, preferCurrentTab: true });
    const rec = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9,opus', videoBitsPerSecond: 700000, audioBitsPerSecond: 64000 });
    window.__rec = { rec, stream, chunks: [], t0: performance.now() };
    rec.ondataavailable = (e) => e.data.size && window.__rec.chunks.push(e.data);
    rec.start(1000);
  });
  // Edge shows a "sharing this tab" bar once capture starts, which shortens the page: fit it back to 1280 x 720.
  await page.waitForTimeout(800);
  await fit();
  console.log('  page area while recording', await page.evaluate(() => `${innerWidth}x${innerHeight}`));

  // 3. The plan.
  const frame = () => page.frame({ name: 'screen' });
  let deckUrl = null;
  const hideTour = async () => frame().addStyleTag({ content: '.tour-launch,#tour-launch,.tour-panel{display:none!important}' }).catch(() => {});
  const target = (t) => {
    const f = frame();
    if (t === 'notice') return f.locator('main .notice[role=status], main .notice[role=alert]').first();
    if (t.startsWith('button:')) return f.getByRole('button', { name: t.slice(7) }).first();
    if (t.startsWith('text:')) return f.getByText(t.slice(5)).first();
    return f.locator(t).first();
  };
  const settle = (ms = 700) => page.waitForTimeout(ms);
  let drift = 0;
  for (const s of plan.steps) {
    // Keep the page area at exactly 1280 x 720 all the way through: if Edge resizes it (a bar appears, the window
    // is nudged), the capture would shrink the picture into black borders.
    const [vw, vh] = await page.evaluate(() => [innerWidth, innerHeight]);
    if (vw !== 1280 || vh !== 720) { drift++; await fit(); }
    if (s.card !== undefined) { await page.evaluate((c) => window.studio.card(c), s.card && { ...s.card, body: (s.card.body || []).map(voiced) }); if (s.hold) await settle(s.hold); }
    if (s.deck) {
      if (deckUrl !== s.deck) { await page.evaluate((u) => window.studio.load(u), ORIGIN + s.deck); deckUrl = s.deck; await hideTour(); await settle(600); }
      await frame().evaluate((n) => { location.hash = '#s' + n; }, s.slide);
      await settle(600);
    } else if (s.slide) {
      await frame().evaluate((n) => { location.hash = '#s' + n; }, s.slide);
      await settle(700);
    }
    if (s.ws) {
      deckUrl = null;
      await page.evaluate((u) => window.studio.load(u), `${ORIGIN}workspace/#/${s.ws}`);
      await frame().waitForSelector('main h1');
      await settle(900);
    }
    if (s.act) {
      const f = frame();
      if (s.act === 'actor') await f.locator('#actor').selectOption({ label: s.label });
      if (s.act === 'respondent') { const r = f.getByLabel('Respondent'); await r.scrollIntoViewIfNeeded(); await r.fill(''); await r.pressSequentially(s.name, { delay: 55 }); }
      if (s.act === 'attach') {
        const inputs = f.locator('main input[type=file]');
        for (let i = 0; i < s.count; i++) {
          const file = readdirSync(samples).find((n) => n.startsWith(`vendor-${s.vendor}-${i + 1}-`));
          await inputs.nth(i).scrollIntoViewIfNeeded();
          await inputs.nth(i).setInputFiles(join(samples, file));
          await settle(450);
        }
      }
      if (s.act === 'click') { const b = f.getByRole('button', { name: s.name }).first(); await b.scrollIntoViewIfNeeded(); await b.click(); }
      if (s.act === 'open') { await f.evaluate((h) => { location.hash = '#/' + h; }, s.hash); await f.waitForSelector('main h1'); }
      await settle(900);
    }
    if (s.ring !== undefined) {
      if (s.ring === null) await page.evaluate(() => window.studio.ring(null));
      else {
        const el = target(s.ring);
        await el.scrollIntoViewIfNeeded().catch(() => {});
        await settle(300);
        const box = await el.boundingBox().catch(() => null);
        if (!box) console.warn(`  (nothing to highlight for "${s.ring}")`);
        const clip = box && { x: Math.max(4, box.x), y: Math.max(4, box.y), width: Math.min(box.width, 1270 - Math.max(4, box.x)), height: Math.min(box.height, 626 - Math.max(4, box.y)) };
        await page.evaluate((b) => window.studio.ring(b), clip);
      }
    }
    if (s.say) {
      const ok = await page.evaluate(([w, t, src]) => window.studio.say(w, t, src), [s.say, s.text, `${ORIGIN}__studio_audio/${s.wav}`]);
      if (!ok) throw new Error(`Line did not play: ${s.text.slice(0, 50)}`);
      await settle(350);
    }
    if (s.pause) await settle(s.pause);
  }
  if (drift) console.log(`  page area corrected ${drift} time(s) during the recording`);
  await page.evaluate(() => window.studio.caption(null, ''));
  await settle(800);

  // 4. Stop, add the duration, hand the file over in pieces.
  writeFileSync(out, '');
  const secs = await page.evaluate(async () => {
    const R = window.__rec;
    const stopped = new Promise((r) => (R.rec.onstop = r));
    R.rec.stop();
    await stopped;
    R.stream.getTracks().forEach((t) => t.stop());
    const ms = performance.now() - R.t0;
    const fixed = await window.ysFixWebmDuration(new Blob(R.chunks, { type: 'video/webm' }), ms, { logger: false });
    const buf = new Uint8Array(await fixed.arrayBuffer());
    for (let i = 0; i < buf.length; i += 1 << 20) {
      const part = buf.subarray(i, i + (1 << 20));
      let bin = '';
      for (let j = 0; j < part.length; j += 0x8000) bin += String.fromCharCode(...part.subarray(j, j + 0x8000));
      await window.studioChunk(btoa(bin));
    }
    return ms / 1000;
  });
  await browser.close();
  const dest = join(videos, `${name}.webm`);
  copyFileSync(out, dest);
  console.log(`${name}: ${Math.floor(secs / 60)}:${String(Math.round(secs % 60)).padStart(2, '0')} long, ${(statSync(dest).size / 1e6).toFixed(1)} MB -> ${dest}`);
}

for (const name of process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(plans)) await record(name);
