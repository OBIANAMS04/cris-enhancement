// A walk through the Milestone 2 workspace pages in a real browser, from an empty store, as each role would use them.
// It is a Playwright function: run it with a Playwright page while `node scripts/serve.mjs` serves the repo.
// It returns { failures: [...] }; an empty list means every check passed. Screenshots go to framework/screens/m2-*.
async (page) => {
  const BASE = 'http://localhost:4321/workspace/';
  const SHOTS = 'C:/Users/obiki/Documents/AINWINTRVWSTFFS!!/CRIS-Enhancement/framework/screens/';
  const failures = [];
  const check = (ok, what) => {
    if (!ok) failures.push(what);
  };
  const errors = [];
  const onConsole = (m) => m.type() === 'error' && errors.push(m.text());
  const onPageError = (e) => errors.push(String(e));
  page.on('console', onConsole);
  page.on('pageerror', onPageError);
  const go = async (hash) => {
    await page.goto(`${BASE}#/${hash}`);
    await page.waitForSelector('main h1');
    await page.waitForTimeout(250);
  };
  const as = async (label) => {
    await page.locator('#actor').selectOption({ label });
    await page.waitForTimeout(150);
  };
  const notice = async () => (await page.locator('main .notice[role=status], main .notice[role=alert]').first().innerText().catch(() => '')).replace(/\s+/g, ' ');
  const settle = () => page.waitForTimeout(400);
  const shot = (name, fullPage = true) => page.screenshot({ path: SHOTS + name, fullPage });
  const answerAll = async (correct) => {
    const sets = await page.locator('main fieldset.field').count();
    // The right answers live in content/training-materials.json; the walk reads them from there.
    const mats = await page.evaluate(() => fetch('../content/training-materials.json').then((r) => r.json()));
    const title = await page.locator('main h1').innerText();
    const course = mats.courses.find((c) => title.includes(c.title));
    for (let i = 0; i < sets; i++) {
      const pick = correct ? course.questions[i].answer : (course.questions[i].answer + 1) % course.questions[i].options.length;
      await page.locator('main fieldset.field').nth(i).locator('input[type=radio]').nth(pick).check();
    }
  };

  await page.goto(BASE);
  await page.evaluate(async () => {
    localStorage.removeItem('cris-workspace-v1');
    localStorage.removeItem('cris-workspace-actor');
    await new Promise((r) => { const q = indexedDB.deleteDatabase('cris-workspace-documents'); q.onsuccess = q.onerror = q.onblocked = () => r(); });
  });
  const later = (days, hm) => new Date(Date.now() + days * 86400000).toISOString().slice(0, 10) + `T${hm}`;

  // STORY-005: Sam schedules and holds a session; Jordan passes live; Avery fails, then passes from the recording.
  await go('training');
  await as('Sam Demo (support staff)');
  await page.getByLabel('Course').selectOption('COURSE-HELPDESK');
  await page.getByLabel('When (your local time)').fill(later(0, '23:30'));
  await page.getByRole('button', { name: 'Schedule' }).click();
  await settle();
  check(/TS-0001 scheduled/.test(await notice()), 'STORY-005: session scheduled');
  await go('training/TS-0001');
  await page.getByRole('button', { name: 'Mark held' }).click();
  await settle();
  check(/recording/.test(await notice()), 'STORY-005: holding without a recording is refused');
  await page.getByLabel('Where the recording is kept').fill('recordings/2026-11-11-help-desk.mp4');
  await page.getByRole('button', { name: 'Mark held' }).click();
  await settle();
  await as('Jordan Demo (TxDOT manager)');
  await answerAll(true);
  await page.getByRole('button', { name: 'Submit answers' }).click();
  await settle();
  check(/Passed with 100%/.test(await notice()), 'STORY-005: understanding shown by passing the check');
  await as('Avery Demo (TxDOT user)');
  await page.getByLabel('How did you take part?').selectOption('recording');
  await answerAll(false);
  await page.getByRole('button', { name: 'Submit answers' }).click();
  await settle();
  check(/not passed yet/.test(await notice()), 'STORY-005: a failed check is not a completion');
  await page.getByLabel('How did you take part?').selectOption('recording');
  await answerAll(true);
  await page.getByRole('button', { name: 'Submit answers' }).click();
  await settle();
  const progress = await page.locator('main table').last().innerText();
  check(/recording/.test(progress), 'STORY-005: completion from the recording is logged');
  await shot('m2-01-training-session.png');

  // STORY-006: Taylor generates reports to specification; the cost report is refused and logged; errors get addressed.
  await go('monitoring');
  await page.getByRole('button', { name: 'Run a check now' }).click();
  await settle();
  await go('reporting-engine');
  await as('Taylor Demo (contract manager)');
  for (const spec of ['System performance report', 'Training and cyber security completion']) {
    await page.getByLabel('Specification').selectOption({ label: spec });
    await page.getByRole('button', { name: 'Generate' }).click();
    await settle();
    check(/generated to SPEC-/.test(await notice()), `STORY-006: ${spec} generated`);
  }
  await page.getByLabel('Specification').selectOption({ label: 'Contract cost summary' });
  await page.getByRole('button', { name: 'Generate' }).click();
  await settle();
  check(/cannot meet its specification/.test(await notice()), 'STORY-006: the cost report is refused');
  check(/TxDOT financial system/.test(await page.locator('main').innerText()), 'STORY-006: the error names the missing system');
  await shot('m2-02-reporting-engine-error.png');
  await page.getByLabel('Cause and action taken').fill('Read access to the TxDOT financial system requested from TxDOT IT.');
  await page.getByRole('button', { name: 'Mark addressed' }).click();
  await settle();
  check(/addressed/.test(await notice()), 'STORY-006: the error is addressed');
  await page.locator('main a', { hasText: 'RPT-0002' }).click();
  await page.waitForTimeout(500);
  check(/Matches its archived hash/.test(await page.locator('main').innerText()), 'STORY-006: archived report verifies');
  await shot('m2-03-report-to-spec.png');

  // STORY-013: Morgan uploads; Avery is refused; Quinn opens within 2 s; a replacement supersedes.
  await go('documents');
  await as('Morgan Demo (compliance officer)');
  const upload = async (name, text, category, replaces) => {
    await page.locator('input[type=file]').setInputFiles({ name, mimeType: 'text/plain', buffer: Buffer.from(text) });
    await page.getByLabel('Category').selectOption(category);
    if (replaces) await page.getByLabel('Replaces').selectOption({ index: 1 });
    await page.getByRole('button', { name: 'Upload' }).click();
    await settle();
    return notice();
  };
  check(/DOC-0001 stored/.test(await upload('technical-proposal.txt', 'CRIS technical proposal, draft 1', 'Technical proposal')), 'STORY-013: document stored');
  check(/DOC-0002 stored .*version 2/.test(await upload('technical-proposal.txt', 'CRIS technical proposal, draft 2', 'Technical proposal', true)), 'STORY-013: replacement stored as version 2');
  check(/not accepted/.test(await upload('virus.exe', 'x', 'Other')), 'STORY-013: a wrong file type is refused');
  await shot('m2-04-documents-library.png');
  await as('Avery Demo (TxDOT user)');
  await go('documents/DOC-0002');
  await page.getByRole('button', { name: 'Open the document' }).click();
  await page.waitForTimeout(500);
  check(/Access refused/.test(await page.locator('#open-result').innerText()), 'STORY-013: unauthorized access refused');
  await as('Quinn Demo (procurement officer)');
  await go('documents/DOC-0002');
  await page.getByRole('button', { name: 'Open the document' }).click();
  await page.waitForTimeout(600);
  const opened = await page.locator('#open-result').innerText();
  const ms = Number((opened.match(/Retrieved in (\d+) ms/) || [])[1]);
  check(Number.isFinite(ms) && ms < 2000, `STORY-013: retrieved within 2 s (got ${ms} ms)`);
  check(/draft 2/.test(opened) && /matches its fingerprint/.test(opened), 'STORY-013: the right content, intact');
  const log = await page.locator('main table').last().innerText();
  check(/document access refused/.test(log) && /document opened/.test(log), 'STORY-013: refusal and opening both logged');
  await shot('m2-05-document-opened.png');

  // STORY-007: Morgan runs the checks (no violations), applies a legal update (violation), fixes it with training.
  await as('Morgan Demo (compliance officer)');
  await go('compliance');
  await page.waitForTimeout(800);
  await page.getByRole('button', { name: 'Run every compliance check' }).click();
  await page.waitForTimeout(800);
  check(/no violations found/.test(await notice()), 'STORY-007: a compliance check finds no violations');
  await shot('m2-06-compliance-clean.png');
  await page.getByLabel('Rule').selectOption('CR-08');
  await page.getByLabel('What changed').fill('Vendor cyber security training must now be renewed every 30 days (drill).');
  await page.getByLabel('New values').fill('valid_days=30');
  await page.getByRole('button', { name: 'Apply and re-check' }).click();
  await page.waitForTimeout(800);
  check(/version 2 and was re-checked: fail/.test(await notice()), 'STORY-007: the legal update is applied and re-checked');
  await shot('m2-07-compliance-legal-update.png');
  await go('training');
  await as('Riley Demo (system administrator)');
  await page.getByLabel('Course').selectOption('COURSE-CYBER');
  await page.getByLabel('When (your local time)').fill(later(1, '23:30'));
  await page.getByRole('button', { name: 'Schedule' }).click();
  await settle();
  await go('training/TS-0002');
  await page.getByLabel('Where the recording is kept').fill('recordings/cyber-refresher.mp4');
  await page.getByRole('button', { name: 'Mark held' }).click();
  await settle();
  for (const who of ['Riley Demo (system administrator)', 'Casey Demo (developer)']) {
    await as(who);
    await answerAll(true);
    await page.getByRole('button', { name: 'Submit answers' }).click();
    await settle();
  }
  await as('Morgan Demo (compliance officer)');
  await go('compliance');
  await page.getByRole('button', { name: 'Run every compliance check' }).click();
  await page.waitForTimeout(800);
  check(/no violations found/.test(await notice()), 'STORY-007: after the refresher, no violations');

  await go('audit');
  await page.waitForTimeout(800);
  check(/The chain is intact/.test(await page.locator('main .notice').first().innerText()), 'Trust: audit chain intact after M2');
  await go('tables');
  check((await page.locator('tbody tr').count()) === 20, 'all 20 tables listed');

  await page.setViewportSize({ width: 390, height: 844 });
  for (const p of ['training', 'reporting-engine', 'documents', 'compliance']) {
    await go(p);
    check(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), `${p}: no sideways scroll at phone width`);
  }
  await shot('m2-08-compliance-phone.png', false);
  await page.setViewportSize({ width: 1280, height: 900 });

  page.off('console', onConsole);
  page.off('pageerror', onPageError);
  if (errors.length) failures.push(`console errors: ${errors.join(' | ')}`);
  return { failures, checks: 'done' };
}
