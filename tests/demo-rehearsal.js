// The full demo rehearsal: every one of the 16 stories, in the order the presenter shows them on 24 November,
// from an empty store. It is a Playwright function: run it with a Playwright page while `node scripts/serve.mjs`
// serves the repo (Claude Code runs it through its Playwright tool). It returns { failures, timings, shots }; an empty
// failures list means every step of the demo works. Screenshots (1280 wide) go to framework/screens/demo/NN-*.png.
async (page) => {
  const ROOT = 'http://localhost:4321/';
  const BASE = ROOT + 'workspace/';
  const SHOTS = 'C:/Users/obiki/Documents/AINWINTRVWSTFFS!!/CRIS-Enhancement/framework/screens/demo/';
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
  const shots = [];
  const shot = async (name, fullPage = true) => {
    shots.push(name);
    await page.screenshot({ path: SHOTS + name, fullPage });
  };
  const timings = [];
  const segment = async (label, fn) => {
    const t0 = Date.now();
    const before = failures.length;
    try {
      await fn();
    } catch (e) {
      failures.push(`${label}: walk stopped: ${String(e.message).split('\n')[0]}`);
    }
    const secs = ((Date.now() - t0) / 1000).toFixed(1);
    timings.push(`${label}: ${secs}s${failures.length > before ? ' (FAILED)' : ''}`);
  };
  const later = (days, hm) => new Date(Date.now() + days * 86400000).toISOString().slice(0, 10) + `T${hm}`;
  const weekday = () => { const d = new Date(Date.now() + 86400000); while ([0, 6].includes(d.getDay())) d.setDate(d.getDate() + 1); return d.toISOString().slice(0, 10); };
  const answerAll = async (correct) => {
    const sets = await page.locator('main fieldset.field').count();
    const mats = await page.evaluate(() => fetch('../content/training-materials.json').then((r) => r.json()));
    const title = await page.locator('main h1').innerText();
    const course = mats.courses.find((c) => title.includes(c.title));
    for (let i = 0; i < sets; i++) {
      const pick = correct ? course.questions[i].answer : (course.questions[i].answer + 1) % course.questions[i].options.length;
      await page.locator('main fieldset.field').nth(i).locator('input[type=radio]').nth(pick).check();
    }
  };
  const tz = await page.evaluate(() => Intl.DateTimeFormat().resolvedOptions().timeZone);

  await page.setViewportSize({ width: 1280, height: 900 });
  // Clean start: no store, no actor, no stored documents.
  await page.goto(BASE);
  await page.evaluate(async () => {
    localStorage.removeItem('cris-workspace-v1');
    localStorage.removeItem('cris-workspace-actor');
    localStorage.removeItem('command-center-mode');
    await new Promise((r) => { const q = indexedDB.deleteDatabase('cris-workspace-documents'); q.onsuccess = q.onerror = q.onblocked = () => r(); });
  });
  await page.reload();
  await page.waitForSelector('main h1');

  // STORY-000: Command Center.
  await segment('STORY-000 Command Center', async () => {
    await page.goto(`${ROOT}?rehearsal=${Date.now()}#/overview`);
    await page.waitForSelector('main h1');
    await page.waitForTimeout(500);
    const tabs = await page.locator('nav.tabs a').count();
    check(tabs === 9, `STORY-000: expected 9 tabs, found ${tabs}`);
    check((await page.locator('.stamp').innerText()).includes('as of'), 'STORY-000: no "Data as of" stamp');
    check(!/\b(null|undefined|NaN)\b/.test(await page.locator('#app').innerText()), 'STORY-000: a null, undefined or NaN is printed');
    await shot('00-command-center.png');
  });

  // STORY-001: report, get assistance, resolve, check status.
  await segment('STORY-001 Help desk', async () => {
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
    await shot('01-help-desk-assistance.png');
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
    await shot('02-help-desk-resolved.png');
  });

  // STORY-012: support queue and maintenance outside service hours.
  await segment('STORY-012 Support', async () => {
    await go('support');
    await as('Riley Demo (system administrator)');
    const day = weekday();
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
    if (tz === 'America/Chicago') check(/overlaps service hours/.test(await schedule(`${day}T10:00`, `${day}T11:00`)), 'STORY-012: a window in service hours is refused');
    check(/MW-0001 scheduled/.test(await schedule(`${day}T23:00`, `${day2}T01:00`)), 'STORY-012: a night window is scheduled');
    const queue = await page.locator('table').first().innerText();
    check(/TKT-0002/.test(queue) && !/TKT-0001/.test(queue), 'STORY-012: the queue holds the open ticket only');
    await shot('03-support-queue.png');
  });

  // STORY-002: monitoring and the outage drill.
  await segment('STORY-002 Monitoring', async () => {
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
    await shot('04-monitoring-alert.png');
  });

  // STORY-003: performance report.
  await segment('STORY-003 Reports', async () => {
    await go('reports');
    await as('Jordan Demo (TxDOT manager)');
    await page.getByLabel('From').fill('2026-10-01');
    await page.getByLabel('To').fill('2026-10-02');
    await page.getByRole('button', { name: 'Generate' }).click();
    await settle();
    check(/No monitoring samples/.test(await notice()), 'STORY-003: missing data shows an error');
    const today = new Date().toISOString().slice(0, 10);
    await page.getByLabel('From').fill(today);
    await page.getByLabel('To').fill(today);
    await page.getByRole('button', { name: 'Generate' }).click();
    await settle();
    check(/RPT-0001 generated and archived/.test(await notice()), 'STORY-003: report generated and archived');
    await go('reports/RPT-0001');
    await page.waitForTimeout(400);
    check(/Matches its archived hash/.test(await page.locator('main').innerText()), 'STORY-003: archived report matches its hash');
    await shot('05-performance-report.png');
  });

  // STORY-004: features.
  await segment('STORY-004 Features', async () => {
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
    await go('features');
    const answers = await page.locator('table').last().innerText();
    check(/Released as FC-0001/.test(answers) && /Not feasible: CRIS holds Texas/.test(answers), 'STORY-004: both submitters got an answer');
    await go('features/FC-0001');
    await shot('06-feature-released.png');
  });

  // STORY-005: training.
  await segment('STORY-005 Training', async () => {
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
    check(/recording/.test(await page.locator('main table').last().innerText()), 'STORY-005: completion from the recording is logged');
    await shot('07-training-session.png');
  });

  // STORY-006: reporting engine.
  await segment('STORY-006 Reporting engine', async () => {
    await go('monitoring');
    await page.getByRole('button', { name: 'Run a check now' }).click();
    await page.waitForSelector('main .notice[role=status]');
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
    await shot('08-reporting-engine-error.png');
    await page.getByLabel('Cause and action taken').fill('Read access to the TxDOT financial system requested from TxDOT IT.');
    await page.getByRole('button', { name: 'Mark addressed' }).click();
    await settle();
    check(/addressed/.test(await notice()), 'STORY-006: the error is addressed');
    await page.locator('main a', { hasText: 'RPT-0002' }).click();
    await page.waitForTimeout(500);
    check(/Matches its archived hash/.test(await page.locator('main').innerText()), 'STORY-006: archived report verifies');
  });

  // STORY-013: documents.
  await segment('STORY-013 Documents', async () => {
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
    await shot('09-documents-opened.png');
  });

  // STORY-007: compliance.
  await segment('STORY-007 Compliance', async () => {
    await as('Morgan Demo (compliance officer)');
    await go('compliance');
    await page.waitForTimeout(800);
    await page.getByRole('button', { name: 'Run every compliance check' }).click();
    await page.waitForTimeout(800);
    check(/no violations found/.test(await notice()), 'STORY-007: a compliance check finds no violations');
    await page.getByLabel('Rule').selectOption('CR-08');
    await page.getByLabel('What changed').fill('Vendor cyber security training must now be renewed every 30 days (drill).');
    await page.getByLabel('New values').fill('valid_days=30');
    await page.getByRole('button', { name: 'Apply and re-check' }).click();
    await page.waitForTimeout(800);
    check(/version 2 and was re-checked: fail/.test(await notice()), 'STORY-007: the legal update is applied and re-checked');
    await shot('10-compliance-legal-update.png');
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
    await shot('11-compliance-clean.png');
  });

  // STORY-008: submissions.
  await segment('STORY-008 Submissions', async () => {
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
    // RSP-0001 is the draft response file the Documents story opened, so the vendors' numbers are read, not assumed.
    const idA = ((await record('Vendor A Demo', 4)).match(/(RSP-\d+) recorded for Vendor A Demo/) || [])[1];
    check(!!idA, 'STORY-008: a complete response is stored');
    check(/not accepted/.test(await record('Vendor B Demo', 2)), 'STORY-008: an incomplete response is refused');
    check(/Missing required document/.test(await page.locator('main').innerText()), 'STORY-008: the error names the missing document');
    await shot('12-submission-error.png');
    const idB = ((await record('Vendor B Demo', 4)).match(/(RSP-\d+) recorded for Vendor B Demo/) || [])[1];
    check(!!idB, 'STORY-008: the full resubmission is stored');
    check(new RegExp(`Addressed: ${idB} submitted correctly`).test(await page.locator('main').innerText()), 'STORY-008: the error is addressed by the resubmission');
    for (const id of [idA, idB]) {
      await go(`submissions/${id}`);
      await page.waitForTimeout(500);
      check(/Documents match the receipt/.test(await page.locator('main').innerText()), `STORY-008: ${id} matches its receipt`);
      await page.getByRole('button', { name: 'Move to under evaluation' }).click();
      await settle();
    }
    check(/response under evaluation/.test(await page.locator('main table').last().innerText()), 'STORY-008: the status change is tracked');
    await shot('13-response-tracking.png');
  });

  // STORY-009: evaluation.
  await segment('STORY-009 Evaluation', async () => {
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
    await shot('14-evaluation-flagged.png');
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
    await shot('15-evaluation-ranking.png');
  });

  // STORY-010: risk.
  await segment('STORY-010 Risk', async () => {
    await go('monitoring');
    await page.getByRole('button', { name: 'Run the outage drill' }).click();
    await settle();
    await go('risk');
    await as('Rowan Demo (risk manager)');
    await page.getByRole('button', { name: 'Run a risk assessment' }).click();
    await page.waitForTimeout(700);
    check(/new risk\(s\)/.test(await notice()) && /logged for review/.test(await notice()), 'STORY-010: risks identified, the high one logged for review');
    check(/for review/.test(await page.locator('main table').first().innerText()), 'STORY-010: the register marks it for review');
    await shot('16-risk-assessment.png');
    const mit = page.locator('main form.form--inline').first();
    await mit.getByLabel('Action taken').fill('Drill target removed from the monitor list; component confirmed up.');
    await mit.getByRole('button', { name: 'Mark mitigated' }).click();
    await settle();
    check(/mitigated/.test(await notice()), 'STORY-010: the risk is mitigated by its owner');
    await page.waitForTimeout(400);
    check(/verified/.test(await page.locator('main table').last().innerText()), 'STORY-010: the assessment archive verifies');
  });

  // STORY-011: security and cyber.
  await segment('STORY-011 Security', async () => {
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
    await page.getByLabel('Who was notified, and when').fill('Affected requesters notified by letter, 14 Nov.');
    await page.getByRole('button', { name: 'Record notification' }).click();
    await settle();
    await page.getByLabel('Cause').fill('Credential phishing; MFA enforced on vendor accounts.');
    await page.getByRole('button', { name: 'Close the breach' }).click();
    await settle();
    check(/closed/.test(await notice()), 'STORY-011: breach closed with its cause');
    await shot('17-security-breach.png');
    await go('documents');
    await as('Riley Demo (system administrator)');
    await page.locator('input[type=file]').setInputFiles({ name: 'cert.pdf', mimeType: 'application/pdf', buffer: Buffer.from('training certificate') });
    await page.getByLabel('Category').selectOption('Cyber security training records');
    await page.getByRole('button', { name: 'Upload' }).click();
    await settle();
    check(/has not completed the TxDOT-approved cyber security training/.test(await notice()), 'STORY-011: uncleared vendor refused');
    check(/Complete the cyber security course on the Training page/.test(await page.locator('main').innerText()), 'STORY-014: the refusal comes with a corrective suggestion');
    await shot('18-access-blocked.png', false);
    await go('training');
    await page.getByLabel('Course').selectOption('COURSE-CYBER');
    await page.getByLabel('When (your local time)').fill(later(1, '23:30'));
    await page.getByRole('button', { name: 'Schedule' }).click();
    await settle();
    await go('training/TS-0003');
    await page.getByLabel('Where the recording is kept').fill('recordings/cyber-retraining.mp4');
    await page.getByRole('button', { name: 'Mark held' }).click();
    await settle();
    await answerAll(true);
    await page.getByRole('button', { name: 'Submit answers' }).click();
    await settle();
    await go('documents');
    await page.locator('input[type=file]').setInputFiles({ name: 'cert.pdf', mimeType: 'application/pdf', buffer: Buffer.from('training certificate') });
    await page.getByLabel('Category').selectOption('Cyber security training records');
    await page.getByRole('button', { name: 'Upload' }).click();
    await settle();
    check(/DOC-\d+ stored/.test(await notice()), 'STORY-011: after retraining, access is restored');
    await go('security');
    await as('Sage Demo (security officer)');
    await page.getByRole('button', { name: 'Archive the training completions' }).click();
    await page.waitForTimeout(700);
    check(/archived: \d+ completion/.test(await notice()), 'STORY-011: training completions archived');
  });

  // STORY-014: performance anomalies and user-error suggestions.
  await segment('STORY-014 Performance anomalies', async () => {
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
    const day = weekday();
    await page.getByLabel('What', { exact: true }).fill('Patch');
    await page.getByLabel('Component').fill('Web');
    await page.getByLabel('Starts (your local time)').fill(`${day}T10:00`);
    await page.getByLabel('Ends (your local time)').fill(`${day}T11:00`);
    await page.getByRole('button', { name: 'Schedule' }).click();
    await settle();
    const sugg = await page.locator('main .suggest').first().innerText().catch(() => '');
    if (tz === 'America/Chicago') check(/Book it outside service hours, for example/.test(sugg), 'STORY-014: a mistaken window gets a corrective suggestion');
    await shot('19-user-error-suggestion.png', false);
    await go('performance');
    await page.waitForTimeout(400);
    check(/user error|maintenance|documents/i.test(await page.locator('main table').last().innerText()), 'STORY-014: user errors are logged');
    await shot('20-performance-anomaly.png');
  });

  // STORY-015: incident reports.
  await segment('STORY-015 Incident reports', async () => {
    await go('performance');
    for (let i = 0; i < 2; i++) {
      await page.getByRole('button', { name: 'Check now and scan' }).click();
      await page.waitForTimeout(500);
    }
    await go('incident-reports');
    await as('Morgan Demo (compliance officer)');
    const row = () => page.locator('main table').first().locator('tr', { hasText: 'Response time anomaly' }).first();
    await row().getByRole('button').click();
    await settle();
    check(/version 1, stored/.test(await notice()), 'STORY-015: incident report generated and stored');
    await row().getByRole('button').click();
    await settle();
    check(/version 2, stored/.test(await notice()), 'STORY-015: a new version is kept');
    await page.locator('main table').nth(1).getByRole('link', { name: 'Open' }).first().click();
    await page.waitForTimeout(800);
    const t = await page.locator('main').innerText();
    check(/Matches its archived hash/.test(t) && /Versions:/.test(t), 'STORY-015: the report opens, verifies and lists its versions');
    await shot('21-incident-report.png');
    const url = page.url();
    await as('Avery Demo (TxDOT user)');
    await page.goto(url);
    await page.waitForTimeout(800);
    check(/Access refused/.test(await page.locator('main').innerText()), 'STORY-015: unauthorised access refused');
    await go('incident-reports');
    await page.waitForTimeout(400);
    const log = await page.locator('main table').last().innerText();
    check(/refused/.test(log) && /opened/.test(log), 'STORY-015: openings and refusals logged');
  });

  // Close: the audit trail, with its hash chain intact.
  await segment('Audit trail', async () => {
    await go('audit');
    await page.waitForTimeout(1200);
    check(/The chain is intact/.test(await page.locator('main .notice').first().innerText()), 'Trust: audit chain intact at the end of the demo');
    await shot('22-audit-trail-intact.png');
  });

  page.off('console', onConsole);
  page.off('pageerror', onPageError);
  if (errors.length) failures.push(`console errors: ${errors.join(' | ')}`);
  return { failures, timings, shots: shots.length };
}
