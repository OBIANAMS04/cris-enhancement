// A walk through the Milestone 1 workspace in a real browser, from an empty store, as each role would use it.
// It is a Playwright function: run it with a Playwright page while `node scripts/serve.mjs` serves the repo.
// It returns { failures: [...] }; an empty list means every check passed. Screenshots go to framework/screens/m1-*.
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
  };
  const as = async (label) => {
    await page.locator('#actor').selectOption({ label });
    await page.waitForTimeout(150);
  };
  const notice = async () => (await page.locator('main .notice').first().innerText().catch(() => '')).replace(/\s+/g, ' ');
  const settle = () => page.waitForTimeout(350);
  const shot = (name, fullPage = true) => page.screenshot({ path: SHOTS + name, fullPage });

  await page.goto(BASE);
  await page.evaluate(() => {
    localStorage.removeItem('cris-workspace-v1');
    localStorage.removeItem('cris-workspace-actor');
  });
  // A fresh page, so no old store stays in memory.
  await page.reload();
  await page.waitForSelector('main h1');

  // STORY-001: report, get assistance, check status, see it resolved.
  await go('help-desk');
  check(/Demo workspace/.test(await page.locator('.demo-banner').innerText()), 'demo banner shown');
  await as('Avery Demo (TxDOT user)');
  await page.getByLabel('What is wrong?').fill('Cannot sign in, my account is locked');
  await page.getByLabel('Area').selectOption('Signing in');
  await page.getByLabel('How urgent?').selectOption('high');
  await page.getByRole('button', { name: 'Report the issue' }).click();
  await page.waitForSelector('#help-now');
  const help = await page.locator('#help-now').locator('..').innerText();
  check(/has your issue/.test(help) && /Cannot sign in/.test(help), 'STORY-001: assistance names a person and a help article');
  await shot('m1-01-helpdesk-assistance.png');
  await page.getByLabel('What is wrong?').fill('Crash report form will not submit');
  await page.getByLabel('How urgent?').selectOption('urgent');
  await page.getByRole('button', { name: 'Report the issue' }).click();
  await page.waitForSelector('#help-now');
  await go('help-desk/TKT-0001');
  await as('Sam Demo (support staff)');
  await page.getByRole('button', { name: 'Start work' }).click();
  await settle();
  await page.getByLabel('What fixed it?').fill('Account unlocked and a password reset link sent.');
  await page.getByRole('button', { name: 'Mark resolved' }).click();
  await settle();
  await as('Avery Demo (TxDOT user)');
  await go('help-desk');
  await page.getByLabel('Ticket reference').fill('tkt-0001');
  await page.getByRole('button', { name: 'Check status' }).click();
  await page.waitForSelector('.status-line');
  check(/Status: resolved/.test(await page.locator('.status-line').innerText()), 'STORY-001: status check shows resolved');
  await shot('m1-02-ticket-resolved.png');

  // STORY-012: queue against service levels, maintenance outside service hours.
  await go('support');
  await as('Riley Demo (system administrator)');
  const weekday = () => { const d = new Date(Date.now() + 86400000); while ([0, 6].includes(d.getDay())) d.setDate(d.getDate() + 1); return d.toISOString().slice(0, 10); };
  const day = weekday(); // a weekday, so 10:00 falls inside service hours
  const day2 = new Date(Date.parse(day + 'T12:00:00Z') + 86400000).toISOString().slice(0, 10);
  const schedule = async (from, to) => {
    await page.getByLabel('What', { exact: true }).fill('Apply security patches');
    await page.getByLabel('Component').fill('Web servers');
    await page.getByLabel('Starts (your local time)').fill(from);
    await page.getByLabel('Ends (your local time)').fill(to);
    await page.getByRole('button', { name: 'Schedule' }).click();
    await settle();
    return notice();
  };
  const tz = await page.evaluate(() => Intl.DateTimeFormat().resolvedOptions().timeZone);
  if (tz === 'America/Chicago') check(/overlaps service hours/.test(await schedule(`${day}T10:00`, `${day}T11:00`)), 'STORY-012: a window in service hours is refused');
  check(/MW-0001 scheduled/.test(await schedule(`${day}T23:00`, `${day2}T01:00`)), 'STORY-012: a night window is scheduled');
  const queue = await page.locator('table').first().innerText();
  check(/TKT-0002/.test(queue) && !/TKT-0001/.test(queue), 'STORY-012: the queue holds the open ticket only');
  await shot('m1-03-support-dashboard.png');

  // STORY-002: real checks, then the outage drill raises an alert.
  await go('monitoring');
  check(/No checks yet/.test(await page.locator('main').innerText()), 'STORY-002: nothing shown before anything is measured');
  await page.getByRole('button', { name: 'Run a check now' }).click();
  await settle();
  await page.getByRole('button', { name: 'Run a check now' }).click();
  await settle();
  check((await page.locator('main table').first().locator('tbody tr').count()) === 4, 'STORY-002: four components measured');
  await page.getByRole('button', { name: 'Run the outage drill' }).click();
  await settle();
  check(/^ALERT: Outage drill/.test((await page.locator('.notice--bad').first().innerText()).trim()), 'STORY-002: the outage raises an alert');
  await shot('m1-04-monitoring-alert.png');

  // STORY-003: refused without data, generated and archived with data.
  await go('reports');
  await as('Jordan Demo (TxDOT manager)');
  await page.getByLabel('From').fill('2026-10-01');
  await page.getByLabel('To').fill('2026-10-02');
  await page.getByRole('button', { name: 'Generate' }).click();
  await settle();
  check(/No monitoring samples/.test(await notice()), 'STORY-003: missing data shows an error');
  await shot('m1-05-report-missing-data.png', false);
  const today = new Date().toISOString().slice(0, 10);
  await page.getByLabel('From').fill(today);
  await page.getByLabel('To').fill(today);
  await page.getByRole('button', { name: 'Generate' }).click();
  await settle();
  check(/RPT-0001 generated and archived/.test(await notice()), 'STORY-003: report generated and archived');
  await go('reports/RPT-0001');
  await page.waitForTimeout(400);
  check(/Matches its archived hash/.test(await page.locator('main').innerText()), 'STORY-003: archived report matches its hash');
  await shot('m1-06-performance-report.png');

  // STORY-004: feasible feedback to release; infeasible feedback answered.
  await go('features');
  await as('Avery Demo (TxDOT user)');
  for (const text of ['Let me filter crash reports by county', 'Show crash data from other states']) {
    await page.getByLabel('Your feedback').fill(text);
    await page.getByRole('button', { name: 'Send feedback' }).click();
    await settle();
  }
  await as('Casey Demo (developer)');
  const fb1 = page.locator('main .form').filter({ hasText: 'FB-0001' });
  await fb1.getByLabel('Feature title').fill('County filter on crash reports');
  await fb1.getByLabel('Reason').fill('Frequent request; county is already in the data');
  await fb1.getByRole('button', { name: 'Feasible: propose it' }).click();
  await settle();
  check(/FC-0001 proposed from FB-0001/.test(await notice()), 'STORY-004: feasible feedback becomes a change');
  const fb2 = page.locator('main .form').filter({ hasText: 'FB-0002' });
  await fb2.getByLabel('Reason').fill('CRIS holds Texas crash records only.');
  await fb2.getByRole('button', { name: 'Not feasible: answer' }).click();
  await settle();
  await go('features/FC-0001');
  for (const step of ['approved', 'in build']) {
    await page.getByRole('button', { name: `Move to ${step}` }).click();
    await settle();
  }
  await page.getByRole('button', { name: 'Move to released' }).click();
  await settle();
  check(/record how this change meets/.test(await notice()), 'STORY-004: release refused without the need check');
  await page.getByLabel('How does it meet the feedback?').fill('Avery filtered by Travis County in the demo and found the reports.');
  await page.getByRole('button', { name: 'Move to released' }).click();
  await settle();
  check(/is now released/.test(await notice()), 'STORY-004: released after the need check');
  await shot('m1-07-feature-released.png');
  await go('features');
  const answers = await page.locator('table').last().innerText();
  check(/Released as FC-0001/.test(answers) && /Not feasible: CRIS holds Texas/.test(answers), 'STORY-004: both submitters got an answer');

  // Trust: the chain verifies; one changed line is caught.
  await go('audit');
  await page.waitForTimeout(600);
  check(/The chain is intact/.test(await notice()), 'Trust: audit chain intact');
  await shot('m1-08-audit-log.png', false);
  const saved = await page.evaluate(() => localStorage.getItem('cris-workspace-v1'));
  await page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem('cris-workspace-v1'));
    s.tables.AuditEntry[3].actor = 'someone else';
    localStorage.setItem('cris-workspace-v1', JSON.stringify(s));
  });
  await page.reload();
  await page.waitForTimeout(600);
  check(/line 4 was changed after it was written/.test(await notice()), 'Trust: a changed audit line is caught');
  await shot('m1-09-audit-tamper-detected.png', false);
  await page.evaluate((s) => localStorage.setItem('cris-workspace-v1', s), saved);

  await go('tables');
  check((await page.locator('tbody tr').count()) === 20, 'all 20 tables listed');

  // Phone width.
  await page.setViewportSize({ width: 390, height: 844 });
  await go('support');
  check(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), 'no sideways scroll at phone width');
  await shot('m1-10-phone.png', false);
  await page.setViewportSize({ width: 1280, height: 900 });

  page.off('console', onConsole);
  page.off('pageerror', onPageError);
  if (errors.length) failures.push(`console errors: ${errors.join(' | ')}`);
  return { failures, checks: 'done' };
}
