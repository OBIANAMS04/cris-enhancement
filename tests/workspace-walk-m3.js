// A walk through the Milestone 3 workspace pages in a real browser, from an empty store, as each role would use them.
// It is a Playwright function: run it with a Playwright page while `node scripts/serve.mjs` serves the repo.
// It returns { failures: [...] }; an empty list means every check passed. Screenshots go to framework/screens/m3-*.
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

  // STORY-008: Quinn records two responses; one is incomplete, logged, then fixed by a full resubmission.
  await go('submissions');
  await as('Quinn Demo (procurement officer)');
  const record = async (who, count) => {
    await page.getByLabel('Respondent').fill(who);
    const inputs = page.locator('main input[type=file]');
    const n = await inputs.count();
    for (let i = 0; i < Math.min(count, n); i++) await inputs.nth(i).setInputFiles({ name: `${who.split(' ')[1].toLowerCase()}-${i}.pdf`, mimeType: 'application/pdf', buffer: Buffer.from(`${who} document ${i}`) });
    await page.getByRole('button', { name: 'Record the response' }).click();
    await page.waitForTimeout(700);
    return notice();
  };
  check(/RSP-0001 recorded for Vendor A Demo/.test(await record('Vendor A Demo', 4)), 'STORY-008: a complete response is stored');
  check(/not accepted/.test(await record('Vendor B Demo', 2)), 'STORY-008: an incomplete response is refused');
  check(/Missing required document/.test(await page.locator('main').innerText()), 'STORY-008: the error names the missing document');
  await shot('m3-01-submission-error.png');
  check(/RSP-0002 recorded for Vendor B Demo/.test(await record('Vendor B Demo', 4)), 'STORY-008: the full resubmission is stored');
  check(/Addressed: RSP-0002 submitted correctly/.test(await page.locator('main').innerText()), 'STORY-008: the error is addressed by the resubmission');
  for (const id of ['RSP-0001', 'RSP-0002']) {
    await go(`submissions/${id}`);
    await page.waitForTimeout(500);
    check(/Documents match the receipt/.test(await page.locator('main').innerText()), `STORY-008: ${id} matches its receipt`);
    await page.getByRole('button', { name: 'Move to under evaluation' }).click();
    await settle();
  }
  check(/response under evaluation/.test(await page.locator('main table').last().innerText()), 'STORY-008: the status change is tracked');
  await shot('m3-02-response-tracking.png');

  // STORY-009: Quinn and Taylor score; Taylor's typo is flagged and corrected; the ranking is archived.
  await go('evaluation');
  await page.waitForTimeout(700);
  const scoreAll = async (valueFor) => {
    const sheets = page.locator('main form.form').filter({ has: page.getByRole('button', { name: 'Record scores' }) });
    while (await sheets.count()) {
      const sheet = sheets.first();
      const who = await sheet.locator('p strong').first().innerText();
      const fields = sheet.locator('input[type=number]');
      const n = await fields.count();
      for (let i = 0; i < n; i++) await fields.nth(i).fill(String(valueFor(who, i)));
      await sheet.getByRole('button', { name: 'Record scores' }).click();
      await settle();
    }
  };
  await as('Quinn Demo (procurement officer)');
  await scoreAll((who) => (/Vendor A/.test(who) ? 8 : 7));
  await as('Taylor Demo (contract manager)');
  await scoreAll((who, i) => (/Vendor A/.test(who) ? (i === 0 ? 1 : 8) : 7));
  check(/more than 4 points/.test(await page.locator('main').innerText()), 'STORY-009: an out-of-line score is flagged');
  await page.getByRole('button', { name: 'Archive the evaluation' }).click();
  await settle();
  check(/cannot be archived yet/.test(await notice()), 'STORY-009: archiving waits for flagged scores');
  await shot('m3-03-evaluation-flagged.png');
  const fix = page.locator('main form.form--inline').filter({ has: page.getByLabel('Corrected score') }).first();
  await fix.getByLabel('Corrected score').fill('8');
  await fix.getByLabel('Why').fill('Typed 1 instead of 8.');
  await fix.getByRole('button', { name: 'Correct' }).click();
  await settle();
  check(/original stays on record/.test(await notice()), 'STORY-009: the score is corrected and the original kept');
  check(/No score stands out/.test(await page.locator('main').innerText()), 'STORY-009: nothing left to check');
  await page.getByRole('button', { name: 'Archive the evaluation' }).click();
  await settle();
  check(/archived: ranking and all \d+ scores/.test(await notice()) && /Best value: Vendor A Demo/.test(await notice()), 'STORY-009: ranking archived with every score; best value named');
  await page.waitForTimeout(500);
  check(/verified/.test(await page.locator('main table').last().innerText()), 'STORY-009: the archive verifies');
  await shot('m3-04-evaluation-ranking.png');

  // STORY-010: an outage and a risk assessment; the risk is logged for review, then mitigated.
  await go('monitoring');
  await page.getByRole('button', { name: 'Run the outage drill' }).click();
  await settle();
  await go('risk');
  await as('Rowan Demo (risk manager)');
  await page.getByRole('button', { name: 'Run a risk assessment' }).click();
  await page.waitForTimeout(700);
  check(/new risk\(s\)/.test(await notice()) && /1 logged for review/.test(await notice()), 'STORY-010: risks identified, the high one logged for review');
  check(/for review/.test(await page.locator('main table').first().innerText()), 'STORY-010: the register marks it for review');
  await shot('m3-05-risk-assessment.png');
  const mit = page.locator('main form.form--inline').first();
  await mit.getByLabel('Action taken').fill('Drill target removed from the monitor list; component confirmed up.');
  await mit.getByRole('button', { name: 'Mark mitigated' }).click();
  await settle();
  check(/mitigated/.test(await notice()), 'STORY-010: the risk is mitigated by its owner');
  await page.waitForTimeout(400);
  check(/verified/.test(await page.locator('main table').last().innerText()), 'STORY-010: the assessment archive verifies');
  await shot('m3-06-risk-mitigated.png');

  await go('audit');
  await page.waitForTimeout(900);
  check(/The chain is intact/.test(await page.locator('main .notice').first().innerText()), 'Trust: audit chain intact after M3');
  await page.setViewportSize({ width: 390, height: 844 });
  for (const p of ['submissions', 'evaluation', 'risk']) {
    await go(p);
    check(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), `${p}: no sideways scroll at phone width`);
  }
  await shot('m3-07-risk-phone.png', false);
  await page.setViewportSize({ width: 1280, height: 900 });

  page.off('console', onConsole);
  page.off('pageerror', onPageError);
  if (errors.length) failures.push(`console errors: ${errors.join(' | ')}`);
  return { failures, checks: 'done' };
}
