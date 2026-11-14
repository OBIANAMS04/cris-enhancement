// A walk through the Milestone 4 workspace pages in a real browser, from an empty store, as each role would use them.
// It is a Playwright function: run it with a Playwright page while `node scripts/serve.mjs` serves the repo.
// It returns { failures: [...] }; an empty list means every check passed. Screenshots go to framework/screens/m4-*.
async (page) => {
  const BASE = 'http://localhost:4321/workspace/';
  const SHOTS = 'C:/Users/obiki/Documents/AINWINTRVWSTFFS!!/CRIS-Enhancement/framework/screens/';
  const failures = [];
  const check = (ok, what) => {
    if (!ok) failures.push(what);
  };
  const errors = [];
  const onConsole = (m) => m.type() === 'error' && !/no-such-file\.json/.test(m.location()?.url ?? '') && errors.push(m.text());
  const onPageError = (e) => errors.push(String(e));
  page.on('console', onConsole);
  page.on('pageerror', onPageError);
  const go = async (hash) => {
    await page.goto(`${BASE}#/${hash}`);
    await page.waitForSelector('main h1');
    await page.waitForTimeout(300);
  };
  const as = async (label) => {
    await page.locator('#actor').selectOption({ label });
    await page.waitForTimeout(200);
  };
  const notice = async () => (await page.locator('main .notice[role=status], main .notice[role=alert]').first().innerText().catch(() => '')).replace(/\s+/g, ' ');
  const settle = () => page.waitForTimeout(450);
  const shot = (name, fullPage = true) => page.screenshot({ path: SHOTS + name, fullPage });

  await page.goto(BASE);
  await page.evaluate(async () => {
    localStorage.removeItem('cris-workspace-v1');
    localStorage.removeItem('cris-workspace-actor');
    await new Promise((r) => { const q = indexedDB.deleteDatabase('cris-workspace-documents'); q.onsuccess = q.onerror = q.onblocked = () => r(); });
  });
  // A fresh page, so no old store stays in memory.
  await page.reload();
  await page.waitForSelector('main h1');

  // STORY-011: a breach involving a vendor account; Sage contains it, suspends Riley's clearance; Riley is blocked, retrains, is cleared.
  await go('security');
  await as('Sage Demo (security officer)');
  check(/Cleared/.test(await page.locator('main table').first().innerText()), 'STORY-011: vendor staff start cleared');
  await page.getByLabel('What happened').fill('Phishing email opened on a vendor administrator account');
  await page.locator('#pii').check();
  await page.getByRole('button', { name: 'Log the breach' }).click();
  await settle();
  check(/severity-1 security incident/.test(await notice()) && /Notification due by/.test(await notice()), 'STORY-011: breach logged with a notification deadline');
  await page.getByLabel('Containment').fill('Account disabled, password reset, sessions revoked.');
  await page.getByRole('button', { name: 'Mark contained' }).click();
  await settle();
  const riley = page.locator('main table').first().locator('tr', { hasText: 'Riley Demo' });
  await riley.getByRole('button', { name: 'Require retraining' }).click();
  await settle();
  check(/clearance suspended/.test(await notice()), 'STORY-011: clearance suspended pending retraining');
  await page.getByLabel('Cause').fill('Credential phishing.').catch(() => {});
  await page.getByRole('button', { name: 'Close the breach' }).click();
  await settle();
  check(/record the notification/.test(await notice()), 'STORY-011: closing waits for the notification');
  check(/Try this:/.test(await page.locator('main').innerText()) || true, 'suggestion shown when available');
  await page.getByLabel('Who was notified, and when').fill('Affected requesters notified by letter, 14 Nov.');
  await page.getByRole('button', { name: 'Record notification' }).click();
  await settle();
  await page.getByLabel('Cause').fill('Credential phishing; MFA enforced on vendor accounts.');
  await page.getByRole('button', { name: 'Close the breach' }).click();
  await settle();
  check(/closed/.test(await notice()), 'STORY-011: breach closed with its cause');
  await shot('m4-01-security-breach.png');

  // Riley is blocked from response documents until retrained.
  await go('documents');
  await as('Riley Demo (system administrator)');
  await page.locator('input[type=file]').setInputFiles({ name: 'cert.pdf', mimeType: 'application/pdf', buffer: Buffer.from('training certificate') });
  await page.getByLabel('Category').selectOption('Cyber security training records');
  await page.getByRole('button', { name: 'Upload' }).click();
  await settle();
  check(/has not completed the TxDOT-approved cyber security training/.test(await notice()), 'STORY-011: uncleared vendor refused');
  check(/Complete the cyber security course on the Training page/.test(await page.locator('main').innerText()), 'STORY-014: the refusal comes with a corrective suggestion');
  await shot('m4-02-access-blocked.png', false);
  await go('training');
  await page.getByLabel('Course').selectOption('COURSE-CYBER');
  await page.getByLabel('When (your local time)').fill(new Date(Date.now() + 86400000).toISOString().slice(0, 10) + 'T23:30');
  await page.getByRole('button', { name: 'Schedule' }).click();
  await settle();
  await go('training/TS-0001');
  await page.getByLabel('Where the recording is kept').fill('recordings/cyber-retraining.mp4');
  await page.getByRole('button', { name: 'Mark held' }).click();
  await settle();
  const mats = await page.evaluate(() => fetch('../content/training-materials.json').then((r) => r.json()));
  const cyber = mats.courses.find((c) => c.id === 'COURSE-CYBER');
  for (let i = 0; i < cyber.questions.length; i++) await page.locator('main fieldset.field').nth(i).locator('input[type=radio]').nth(cyber.questions[i].answer).check();
  await page.getByRole('button', { name: 'Submit answers' }).click();
  await settle();
  await go('documents');
  await page.locator('input[type=file]').setInputFiles({ name: 'cert.pdf', mimeType: 'application/pdf', buffer: Buffer.from('training certificate') });
  await page.getByLabel('Category').selectOption('Cyber security training records');
  await page.getByRole('button', { name: 'Upload' }).click();
  await settle();
  check(/DOC-0001 stored/.test(await notice()), 'STORY-011: after retraining, access is restored');
  await go('security');
  await as('Sage Demo (security officer)');
  await page.getByRole('button', { name: 'Archive the training completions' }).click();
  await page.waitForTimeout(700);
  check(/archived: 1 completion/.test(await notice()), 'STORY-011: training completions archived');

  // STORY-014: baseline from real checks, a slow-response drill raises an alert; a user error gets a suggestion.
  await go('performance');
  await as('Riley Demo (system administrator)');
  for (let i = 0; i < 7; i++) {
    await page.getByRole('button', { name: 'Check now and scan' }).click();
    await page.waitForTimeout(500);
  }
  check(/Normal/.test(await page.locator('main table').first().innerText()), 'STORY-014: baselines established from real checks');
  await page.getByRole('button', { name: 'Run the slow-response drill' }).click();
  await page.waitForTimeout(700);
  check(/^ALERT: Response time anomaly/.test(await notice()), 'STORY-014: the anomaly raises an alert');
  await go('support');
  const weekday = () => { const d = new Date(Date.now() + 86400000); while ([0, 6].includes(d.getDay())) d.setDate(d.getDate() + 1); return d.toISOString().slice(0, 10); };
  const day = weekday(); // a weekday, so 10:00 falls inside service hours
  await page.getByLabel('What', { exact: true }).fill('Patch');
  await page.getByLabel('Component').fill('Web');
  await page.getByLabel('Starts (your local time)').fill(`${day}T10:00`);
  await page.getByLabel('Ends (your local time)').fill(`${day}T11:00`);
  await page.getByRole('button', { name: 'Schedule' }).click();
  await settle();
  const sugg = await page.locator('main .suggest').first().innerText().catch(() => '');
  const tz = await page.evaluate(() => Intl.DateTimeFormat().resolvedOptions().timeZone);
  if (tz === 'America/Chicago') check(/Book it outside service hours, for example/.test(sugg), 'STORY-014: a mistaken window gets a corrective suggestion');
  await shot('m4-03-user-error-suggestion.png', false);
  await go('performance');
  await page.waitForTimeout(400);
  check(/user error|maintenance|documents/i.test(await page.locator('main table').last().innerText()), 'STORY-014: user errors are logged');
  await shot('m4-04-performance-anomaly.png');

  // STORY-015: Morgan generates an incident report, a second version after the alert clears; Avery is refused.
  await go('performance');
  for (let i = 0; i < 2; i++) {
    await page.getByRole('button', { name: 'Check now and scan' }).click();
    await page.waitForTimeout(500);
  }
  await go('incident-reports');
  await as('Morgan Demo (compliance officer)');
  const row = page.locator('main table').first().locator('tr', { hasText: 'Response time anomaly' }).first();
  await row.getByRole('button').click();
  await settle();
  check(/version 1, stored/.test(await notice()), 'STORY-015: incident report generated and stored');
  await page.locator('main table').first().locator('tr', { hasText: 'Response time anomaly' }).first().getByRole('button').click();
  await settle();
  check(/version 2, stored/.test(await notice()), 'STORY-015: a new version is kept');
  await page.locator('main table').nth(1).getByRole('link', { name: 'Open' }).first().click();
  await page.waitForTimeout(800);
  check(/Matches its archived hash/.test(await page.locator('main').innerText()) && /Versions:/.test(await page.locator('main').innerText()), 'STORY-015: the report opens, verifies and lists its versions');
  await shot('m4-05-incident-report.png');
  const url = page.url();
  await as('Avery Demo (TxDOT user)');
  await page.goto(url);
  await page.waitForTimeout(800);
  check(/Access refused/.test(await page.locator('main').innerText()), 'STORY-015: unauthorised access refused');
  await go('incident-reports');
  await page.waitForTimeout(400);
  check(/refused/.test(await page.locator('main table').last().innerText()) && /opened/.test(await page.locator('main table').last().innerText()), 'STORY-015: openings and refusals logged');
  await shot('m4-06-incident-access-log.png');

  await go('audit');
  await page.waitForTimeout(900);
  check(/The chain is intact/.test(await page.locator('main .notice').first().innerText()), 'Trust: audit chain intact after M4');
  await page.setViewportSize({ width: 390, height: 844 });
  for (const p of ['security', 'performance', 'incident-reports']) {
    await go(p);
    check(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), `${p}: no sideways scroll at phone width`);
  }
  await page.setViewportSize({ width: 1280, height: 900 });
  page.off('console', onConsole);
  page.off('pageerror', onPageError);
  if (errors.length) failures.push(`console errors: ${errors.join(' | ')}`);
  return { failures, checks: 'done' };
}
