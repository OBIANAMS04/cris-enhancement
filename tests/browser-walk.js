// A walk through the Command Center in a real browser. It is a Playwright function: run it with a Playwright
// page while `node scripts/serve.mjs` is serving the repo (Claude Code runs it through its Playwright tool).
// It returns { failures: [...] }; an empty list means every check passed. Screenshots go to framework/screens/.
async (page) => {
  const BASE = 'http://localhost:4321/';
  const SHOTS = 'C:/Users/obiki/Documents/AINWINTRVWSTFFS!!/CRIS-Enhancement/framework/screens/';
  const failures = [];
  const check = (ok, what) => {
    if (!ok) failures.push(what);
  };
  const consoleErrors = [];
  const onConsole = (m) => m.type() === 'error' && consoleErrors.push(m.text());
  const onPageError = (e) => consoleErrors.push(String(e));
  page.on('console', onConsole);
  page.on('pageerror', onPageError);
  const open = async (hash, query = 'walk') => {
    await page.goto(`${BASE}?${query}=${Date.now()}#/${hash}`);
    await page.waitForSelector('main h1');
  };
  const shot = (name, fullPage = true) => page.screenshot({ path: SHOTS + name, fullPage });

  await page.setViewportSize({ width: 1280, height: 900 });
  await open('overview');
  await page.evaluate(() => {
    try {
      localStorage.removeItem('command-center-mode');
    } catch {
      // storage blocked: the page starts in Real anyway
    }
  });
  await page.reload();
  await page.waitForSelector('main h1');

  // Every tab is reachable, shows the data stamp and carries the Real/Sample switch.
  const tabs = await page.$$eval('nav.tabs a', (links) => links.map((a) => ({ href: a.getAttribute('href'), label: a.innerText })));
  check(tabs.length === 9, `expected 9 tabs, found ${tabs.length}`);
  for (const tab of tabs) {
    await open(tab.href.slice(2));
    check((await page.locator('nav.tabs a[aria-current=page]').innerText()) === tab.label, `${tab.label}: not marked as the current tab`);
    check((await page.locator('.stamp').innerText()).includes('as of'), `${tab.label}: no "Data as of" stamp`);
    check((await page.locator('.switch__btn').count()) === 2, `${tab.label}: no Real/Sample switch`);
    check(!/\b(null|undefined|NaN)\b/.test(await page.locator('#app').innerText()), `${tab.label}: a null, undefined or NaN is printed`);
  }

  // Every card on every tab opens its own page one level down.
  let cardCount = 0;
  for (const tab of tabs) {
    await open(tab.href.slice(2));
    const cards = await page.$$eval('main a.card', (links) => links.map((a) => a.getAttribute('href')));
    cardCount += cards.length;
    for (const href of cards) {
      await open(href.slice(2));
      const text = await page.locator('main').innerText();
      check(href.split('/').length >= 3, `${href}: a card does not go one level down`);
      check(!/no such page|Page not found/.test(text), `${href}: the card leads to a not-found page`);
    }
  }
  check(cardCount > 0, 'no cards found on any tab');

  // Each built tab tells the truth about what the files hold.
  await open('guardrails');
  check((await page.locator('main').innerText()).includes('Promise not yet kept'), 'Guardrails: an unverified guardrail is not called a promise not yet kept');
  await open('systems');
  const sysText = await page.locator('main').innerText();
  check(!/Connected/.test(sysText) && sysText.includes('Not checked from here'), 'Systems: an indicator is not grey and "not checked from here" in Real mode');
  await open('agents');
  const agText = await page.locator('main').innerText();
  check(agText.includes('No runs recorded') && agText.includes('not agents'), 'AI agents: owners are not marked as owners, or runs are implied');
  check(!/success rate|0%/.test(agText), 'AI agents: a success rate is shown');
  await open('project');
  check((await page.locator('svg.gantt rect').count()) > 0, 'Project management: no Gantt bars');
  await open('knowledge');
  await page.locator('#kb-question').fill('Which stories cover REQ-010?');
  await page.getByRole('button', { name: 'Ask' }).click();
  const ans = await page.locator('.chat__a').last().innerText();
  check(ans.includes('REQ-010') && ans.includes('From:'), 'Knowledge base: the question panel does not answer from the data with a source');
  await page.locator('#kb-question').fill('What is the weather in Austin tomorrow?');
  await page.getByRole('button', { name: 'Ask' }).click();
  check((await page.locator('.chat__a').last().innerText()).includes("can't answer"), 'Knowledge base: an unanswerable question is not refused');
  await shot('08-knowledge-chat.png', false);
  await open('data-model');
  const dmText = await page.locator('main').innerText();
  check(dmText.includes('Created') && dmText.includes('See the tables in the workspace'), 'Data model: the status does not match content/data-model.json (created)');

  const tabShots = [['overview', '01-overview-real.png'], ['outcomes', '02-outcomes.png'], ['users', '03-users.png'], ['guardrails', '04-guardrails.png'], ['systems', '05-systems.png'], ['project', '06-project-management.png'], ['agents', '07-agents.png'], ['data-model', '09-data-model.png'], ['guardrails/guardrail/REQ-010', '10-drill-down-guardrail.png'], ['data-model/entity/supportticket', '11-drill-down-entity.png']];
  for (const [hash, name] of tabShots) {
    await open(hash);
    await shot(name);
  }

  // Sample mode is labelled on every tab and on every card, and Real removes every label.
  await open('overview');
  await page.getByRole('button', { name: 'Sample' }).click();
  await page.waitForSelector('.sample-banner');
  await shot('12-overview-sample.png');
  await open('systems');
  check((await page.locator('main .tag-sample').count()) > 0, 'Systems: sample statuses are not labelled sample');
  await shot('13-systems-sample.png');
  await open('project');
  check((await page.locator('.gantt__today').count()) === 1, 'Project management: sample dates do not mark today');
  await shot('14-project-sample.png');
  for (const tab of tabs) {
    await open(tab.href.slice(2));
    check((await page.locator('.sample-banner').count()) === 1, `${tab.label}: sample mode is not labelled`);
    check((await page.locator('.stamp').innerText()).startsWith('Sample data shown'), `${tab.label}: the stamp does not say sample`);
    const untagged = await page.$$eval('main a.card', (cards) => cards.filter((c) => !c.querySelector('.tag-sample')).length);
    check(untagged === 0, `${tab.label}: ${untagged} sample card(s) carry no Sample tag`);
  }
  await page.getByRole('button', { name: 'Real' }).click();
  check((await page.locator('.sample-banner, .tag-sample').count()) === 0, 'Real mode still shows a sample label');

  // Data over a week old turns the stamp into a warning on every tab.
  const old = new Date(Date.now() - 9 * 86400000).toISOString();
  await page.route('**/.colaberry/manifest.json', (r) => r.fulfill({ contentType: 'application/json', body: JSON.stringify({ generated_at: old }) }));
  for (const tab of tabs) {
    await open(tab.href.slice(2), 'stale');
    const stamp = page.locator('.stamp');
    check((await stamp.getAttribute('class')).includes('stamp--stale'), `${tab.label}: no warning for data over a week old`);
    check((await stamp.innerText()).includes('Sync from the portal to refresh'), `${tab.label}: the warning does not ask for a sync`);
  }
  await open('overview', 'stale');
  await shot('15-stale-data-warning.png', false);
  await page.unroute('**/.colaberry/manifest.json');

  // Deleting a story from the plan file removes it from the page.
  await page.route('**/.colaberry/plan.json', async (r) => {
    const res = await r.fetch();
    const plan = await res.json();
    plan.stories = plan.stories.filter((s) => s.id !== 'STORY-003');
    plan.releases.forEach((rel) => {
      rel.story_ids = rel.story_ids.filter((id) => id !== 'STORY-003');
    });
    await r.fulfill({ contentType: 'application/json', body: JSON.stringify(plan) });
  });
  await open('overview/release/r0', 'deleted');
  check(!(await page.locator('main').innerText()).includes('Generate Performance Reports'), 'a story deleted from plan.json still shows: something is hard-coded');
  await page.unroute('**/.colaberry/plan.json');

  // A file that cannot be read is reported by name.
  await page.route('**/.colaberry/plan.json', (r) => r.fulfill({ status: 404, body: 'missing' }));
  await open('overview', 'missing');
  check((await page.locator('.errors').innerText()).includes('.colaberry/plan.json answered HTTP 404'), 'a missing plan.json is not reported');
  await page.unroute('**/.colaberry/plan.json');
  const expectedErrors = consoleErrors.filter((e) => /404/.test(e)).length;
  check(consoleErrors.length === expectedErrors, `console errors: ${consoleErrors.filter((e) => !/404/.test(e)).join(' | ')}`);

  // Phone width: the page does not scroll sideways.
  await page.setViewportSize({ width: 390, height: 800 });
  await open('overview', 'phone');
  check((await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)) <= 0, 'the page scrolls sideways at phone width');
  await shot('16-overview-phone.png', false);
  await open('project', 'phone');
  check((await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)) <= 0, 'Project management scrolls sideways at phone width');
  await page.setViewportSize({ width: 1280, height: 900 });
  await open('overview');

  page.off('console', onConsole);
  page.off('pageerror', onPageError);
  return { tabs: tabs.length, cards: cardCount, failures };
}
