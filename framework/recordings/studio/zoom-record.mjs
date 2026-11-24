// Usage (needs scripts/serve.mjs running): node framework/recordings/studio/zoom-record.mjs <meetingId> <pwd> <videoName> <logDir>
// The meeting id and password come from the portal (presentation-launch) and are never stored.
// Joins a portal practice room (Zoom web client, cloud recording on), shares a player tab with its audio,
// plays one produced video to the end, then leaves. Usage: node zoom-record.mjs <meetingId> <pwd> <videoName> <logDir>
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const repo = resolve(fileURLToPath(new URL('.', import.meta.url)), '../../..');
const require = createRequire(join(process.env.REC_TOOLS || resolve(repo, '../rec-tools'), 'package.json'));
const { chromium } = require('playwright');
const [id, pwd, video, logDir] = process.argv.slice(2);
const TITLE = 'CRIS recording';
const ctx = await chromium.launchPersistentContext(join(tmpdir(), 'zoom-profile-' + video), { channel: 'chrome', headless: false, viewport: null,
  args: ['--autoplay-policy=no-user-gesture-required', '--window-size=1400,900', '--window-position=0,0',
    `--auto-select-tab-capture-source-by-title=${TITLE}`, '--disable-features=CalculateNativeWinOcclusion', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows'] });
// No --use-fake-ui-for-media-stream: that flag hands a screen share the WHOLE MONITOR. Without it, the title flag
// picks the player tab (with tab audio). Microphone and camera are never granted, so only the tab is heard.
const zoom = ctx.pages()[0] || await ctx.newPage();
const say = (m) => console.log(new Date().toISOString().slice(11, 19), m);
// The player in its own window so both stay rendered.
const playerP = ctx.waitForEvent('page');
await zoom.evaluate((u) => window.open(u, 'player', 'popup,width=1280,height=760,left=60,top=60'), `http://localhost:4321/framework/recordings/studio/player.html?v=${video}`);
const player = await playerP; await player.waitForLoadState();
await player.waitForFunction(() => document.getElementById('v').readyState >= 3, null, { timeout: 60000 });
const dur = await player.evaluate(() => document.getElementById('v').duration);
say(`player ready, ${Math.round(dur)} s`);
await zoom.bringToFront();
await zoom.goto(`https://app.zoom.us/wc/join/${id}?pwd=${pwd}`, { waitUntil: 'domcontentloaded' });
await zoom.waitForTimeout(8000);
// Zoom asks for camera and microphone first; decline both, so only the shared tab is heard.
for (let i = 0; i < 4 && await zoom.locator('.pepc-permission-dialog').count(); i++) {
  const b = zoom.locator('.pepc-permission-dialog__footer-button');
  await b.click({ force: true }).catch(() => {}); await zoom.waitForTimeout(800);
  if (await zoom.locator('.pepc-permission-dialog').count()) { await b.focus().catch(() => {}); await zoom.keyboard.press('Enter'); await zoom.waitForTimeout(800); }
}
console.log('permission dialog closed:', !(await zoom.locator('.pepc-permission-dialog').count()));
await zoom.waitForTimeout(1500);
const nameBox = zoom.locator('#input-for-name'); await nameBox.click(); await nameBox.pressSequentially('Obi', { delay: 60 });
await zoom.getByRole('button', { name: /^Join$/ }).click();
await zoom.getByRole('button', { name: 'Leave' }).waitFor({ timeout: 60000 }).catch(async (e) => { await zoom.screenshot({ path: `${logDir}/zoom-${video}-nojoin.png` }); console.log('JOIN PAGE:', (await zoom.locator('body').innerText()).replace(/s+/g, ' ').slice(0, 400)); throw e; });
for (const n of ['OK', 'Got it']) await zoom.getByRole('button', { name: n, exact: true }).click({ timeout: 4000 }).catch(() => {});
// In a fresh room the toolbar is not ready until cloud recording has started: wait for it (up to 45 s).
await zoom.getByRole('button', { name: /recording is on/i }).first().waitFor({ timeout: 45000 }).catch(() => {});
const rec = await zoom.getByRole('button', { name: /recording is on/i }).count();
say(`in meeting, cloud recording ${rec ? 'ON' : 'NOT SHOWN'}`);
// The toolbar hides until the mouse moves; notices can sit on top. Try a few times.
await zoom.waitForTimeout(5000);
for (let i = 0; i < 6; i++) {
  for (const n of ['OK', 'Got it']) await zoom.getByRole('button', { name: n, exact: true }).click({ timeout: 1500 }).catch(() => {});
  const [W, Hh] = await zoom.evaluate(() => [innerWidth, innerHeight]);
  await zoom.mouse.move(W / 2 + i * 40, Hh - 30 - (i % 2) * 20); await zoom.waitForTimeout(700);
  const ok = await zoom.getByRole('button', { name: 'Share', exact: true }).first().click({ timeout: 4000 }).then(() => true).catch(() => false);
  if (ok) break;
}
await zoom.waitForTimeout(3000);
// Zoom may show its own share panel first; take the screen/tab option if it does.
for (const n of [/^Share$/, /Share screen/i, /Screen/]) { const b = zoom.getByRole('button', { name: n }); if (await b.count() && await b.first().isVisible()) { await b.first().click().catch(() => {}); await zoom.waitForTimeout(2000); } }
await zoom.waitForTimeout(5000);
const sharing = (await zoom.locator('body').innerText()).match(/You are (?:screen )?sharing|Stop Share|Stop sharing/i);
if (!sharing) { await zoom.screenshot({ path: `${logDir}/zoom-${video}-noshare.png` }); throw new Error('share did not start'); }
say(`sharing: ${sharing ? sharing[0] : 'NOT CONFIRMED'}`);
await zoom.screenshot({ path: `${logDir}/zoom-${video}-sharing.png` });
await player.bringToFront();
await player.evaluate(() => window.playIt());
say('playing');
await player.waitForFunction(() => document.getElementById('v').ended, null, { timeout: (dur + 120) * 1000, polling: 1000 });
say('video ended');
await player.waitForTimeout(3000);
await zoom.bringToFront();
await zoom.getByRole('button', { name: /Stop Share/i }).first().click({ force: true, timeout: 5000 }).catch(() => {});
await zoom.waitForTimeout(1500);
// Leave properly, so the room is empty and Zoom stops recording at once (closing the browser leaves a ghost
// participant for minutes). The toolbar hides until the mouse moves.
let left = false;
for (let i = 0; i < 8 && !left; i++) {
  const [W2, H2] = await zoom.evaluate(() => [innerWidth, innerHeight]);
  await zoom.mouse.move(W2 / 2 + i * 37, H2 - 30 - (i % 2) * 20);
  await zoom.waitForTimeout(500);
  await zoom.getByRole('button', { name: /^Leave$/ }).first().click({ force: true, timeout: 2000 }).catch(() => {});
  await zoom.waitForTimeout(800);
  const lm = zoom.getByRole('button', { name: /Leave Meeting/i });
  if (await lm.count()) { await lm.first().click({ force: true }).catch(() => {}); await zoom.waitForTimeout(2500); }
  left = !(await zoom.getByRole('button', { name: /^Leave$/ }).count());
}
say(left ? 'left the room' : 'LEAVE NOT CONFIRMED (closing the browser)');
await ctx.close();
