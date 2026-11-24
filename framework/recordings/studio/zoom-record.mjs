// Joins a portal practice room (Zoom web client, cloud recording on), shares a player tab with its audio,
// plays one produced video to the end, then leaves. Usage: node zoom-record.mjs <meetingId> <pwd> <videoName> <logDir>
// Exit code 0 = played and left; 2 = could not join or share (it left the room first, so a retry is safe).
// The meeting ID and passcode are passed as arguments and never written anywhere.
import { chromium } from 'playwright';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const [id, pwd, video, logDir] = process.argv.slice(2);
const TITLE = 'CRIS recording';
const ctx = await chromium.launchPersistentContext(join(tmpdir(), 'zoom-profile-' + video + '-' + id), { channel: 'chrome', headless: false, viewport: null,
  args: ['--autoplay-policy=no-user-gesture-required', '--window-size=1400,900', '--window-position=' + (process.env.WIN_X || 0) + ',0',
    `--auto-select-tab-capture-source-by-title=${TITLE}`, '--disable-features=CalculateNativeWinOcclusion', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows'] });
// No --use-fake-ui-for-media-stream: that flag hands a screen share the WHOLE MONITOR. Without it, the title flag
// picks the player tab (with tab audio). Microphone and camera are never granted, so only the tab is heard.
const zoom = ctx.pages()[0] || await ctx.newPage();
const say = (m) => console.log(new Date().toISOString().slice(11, 19), video, m);
const dismiss = async () => {
  for (const n of ['OK', 'Got it', 'Close', 'Dismiss']) {
    const b = zoom.getByRole('button', { name: n, exact: true });
    for (let k = 0; k < await b.count(); k++) await b.nth(k).click({ timeout: 1200, force: true }).catch(() => {});
  }
};
const toolbar = async (i = 0) => { const [W, H] = await zoom.evaluate(() => [innerWidth, innerHeight]); await zoom.mouse.move(W / 2 + i * 37, H - 30 - (i % 2) * 20); await zoom.waitForTimeout(600); };
async function leave() {
  let left = false;
  for (let i = 0; i < 8 && !left; i++) {
    await toolbar(i);
    await zoom.getByRole('button', { name: /^Leave$/ }).first().click({ force: true, timeout: 2000 }).catch(() => {});
    await zoom.waitForTimeout(800);
    const lm = zoom.getByRole('button', { name: /Leave Meeting/i });
    if (await lm.count()) { await lm.first().click({ force: true }).catch(() => {}); await zoom.waitForTimeout(2500); }
    left = !(await zoom.getByRole('button', { name: /^Leave$/ }).count());
  }
  say(left ? 'left the room' : 'LEAVE NOT CONFIRMED (closing the browser)');
}
const isSharing = async () => (await zoom.locator('body').innerText()).match(/You are (?:screen )?sharing|Stop Share|Stop sharing/i);

// The player in its own window so both stay rendered.
const playerP = ctx.waitForEvent('page');
await zoom.evaluate(([u, x]) => window.open(u, 'player', 'popup,width=1280,height=760,left=' + x + ',top=60'), [`http://localhost:4321/framework/recordings/studio/player.html?v=${video}`, 60 + Number(process.env.WIN_X || 0)]);
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
await zoom.waitForTimeout(1500);
try {
  const nameBox = zoom.locator('#input-for-name'); await nameBox.click({ timeout: 20000 }); await nameBox.pressSequentially('Obi', { delay: 60 });
  await zoom.getByRole('button', { name: /^Join$/ }).click();
  await zoom.getByRole('button', { name: 'Leave' }).waitFor({ timeout: 60000 });
} catch (e) { await zoom.screenshot({ path: `${logDir}/zoom-${video}-nojoin.png` }).catch(() => {}); say('could not join'); await ctx.close(); process.exit(2); }
// Wait for cloud recording (the indicator reads "REC" or "Cloud recording is on"), so the take holds the whole video.
const recInd = zoom.getByText(/^REC$|recording is on/i);
await recInd.first().waitFor({ timeout: 45000 }).catch(() => {});
say(`in meeting, cloud recording ${await recInd.count() ? 'ON' : 'NOT SHOWN'}`);
await zoom.waitForTimeout(4000);
let sharing = null;
for (let round = 0; round < 4 && !sharing; round++) {
  for (let i = 0; i < 5 && !sharing; i++) {
    await dismiss(); await toolbar(i);
    const ok = await zoom.getByRole('button', { name: 'Share', exact: true }).first().click({ timeout: 3000 }).then(() => true).catch(() => false);
    if (!ok) continue;
    await zoom.waitForTimeout(2500);
    for (const n of [/^Share$/, /Share screen/i, /Screen/]) { const b = zoom.getByRole('button', { name: n }); if (await b.count() && await b.first().isVisible()) { await b.first().click().catch(() => {}); await zoom.waitForTimeout(1500); } }
    await zoom.waitForTimeout(4000);
    sharing = await isSharing();
  }
  if (!sharing) await zoom.waitForTimeout(5000);
}
if (!sharing) { await zoom.screenshot({ path: `${logDir}/zoom-${video}-noshare.png` }); say('share did not start; leaving'); await leave(); await ctx.close(); process.exit(2); }
say(`sharing: ${sharing[0]}`);
await zoom.screenshot({ path: `${logDir}/zoom-${video}-sharing.png` });
await player.bringToFront();
await player.evaluate(() => window.playIt());
say('playing');
await player.waitForFunction(() => document.getElementById('v').ended, null, { timeout: (dur + 120) * 1000, polling: 1000 });
say('video ended');
await player.waitForTimeout(3000);
await zoom.bringToFront();
await toolbar();
await zoom.getByRole('button', { name: /Stop Share/i }).first().click({ force: true, timeout: 5000 }).catch(() => {});
await zoom.waitForTimeout(1500);
// Leave properly, so the room is empty and Zoom stops recording at once (closing the browser leaves a ghost).
await leave();
await ctx.close();
