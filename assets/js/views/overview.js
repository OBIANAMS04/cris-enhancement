// Tab 1, Overview: what the system is, which release the build is in, what is live and what is not.
// Headline counts come straight from progress.totals; they are not recomputed here.
import { h, card, statePill, pill, empty, crumbs, table, section, source, link, sampleTag } from '../ui.js';
import { storyRows, releaseRows, focusRelease, releaseWindow, formatDate, dataAge, STALE_AFTER_DAYS } from '../data.js';
import { BUILD_PAUSED_AT_OVERVIEW } from '../tabs.js';

const DAY_MS = 86400000;
const storyName = (row) => (row.title ? `${row.id} · ${row.title}` : row.id);
const storyLink = (row) => h('a', { href: link(`overview/story/${row.id}`) }, storyName(row));
const page = (title, trail, ...kids) => h('div', {}, crumbs([{ label: 'Overview', to: 'overview' }, ...trail]), h('h1', { tabindex: '-1' }, title, sampleTag()), ...kids);

function criteriaText(row) {
  if (row.verification) return `${row.verification.criteria_passed} of ${row.verification.criteria_total} passed`;
  return `${row.claimed} of ${row.criteriaTotal} ticked in the file, not checked yet`;
}

function liveness(release) {
  const total = release.stories.length;
  if (total && release.verified === total) return pill('Live', 'verified');
  if (release.verified > 0) return pill('Partly live', 'in_progress');
  return pill('Not live yet', 'not_started');
}

const BASIS_TEXT = {
  date: 'Today falls inside this release’s dates.',
  'progress-no-dates': 'The plan file has no release dates yet, so this is the first release that still has unverified stories.',
  'progress-between-dates': 'Today falls between release dates, so this is the first release that still has unverified stories.',
  'all-verified': 'Every story in every release is verified.',
};

export function renderOverview(data, ctx, rest) {
  const { plan, progress } = data;
  if (!plan || !progress) {
    return h(
      'div',
      {},
      h('h1', { tabindex: '-1' }, 'Overview'),
      empty({
        title: 'The plan files could not be read',
        body: 'The Overview is drawn from .colaberry/plan.json and .colaberry/progress.json. The message at the top of the page says which file failed and why.',
        next: 'Both files are committed in this repo and the page is opened through a web server, not as a file on disk.',
      }),
    );
  }
  const rows = storyRows(plan, progress);
  const model = { data, ctx, plan, progress, rows, releases: releaseRows(plan, rows), totals: progress.totals ?? null, anyChecked: rows.some((r) => r.checked) };
  return rest.length ? detail(model, rest) : home(model);
}

function home(m) {
  const { plan, totals, releases, ctx } = m;
  const name = plan.project?.name ?? plan.project_name ?? 'Command Center';
  const descriptor = plan.project?.descriptor ?? plan.descriptor ?? null;
  const starting = 'No verification run is recorded yet, so this is the starting count, not a result.';

  const counts = totals
    ? [
        card({
          to: 'overview/stories',
          label: 'Stories verified',
          value: `${totals.stories_verified} of ${totals.stories_total}`,
          note: m.anyChecked ? `${totals.stories_submitted} submitted, ${totals.stories_in_progress} in progress, ${totals.stories_not_started} not started.` : starting,
        }),
        card({
          to: 'overview/criteria',
          label: 'Acceptance criteria passed',
          value: `${totals.criteria_passed} of ${totals.criteria_total}`,
          note: m.anyChecked ? 'Counted by the platform when it verifies a story.' : starting,
        }),
        card({
          to: 'overview/points',
          label: 'Points awarded',
          value: String(totals.points_awarded),
          note: m.anyChecked ? 'Awarded by the platform for verified stories.' : 'None awarded yet. Points come with a verified story.',
        }),
      ]
    : [empty({ title: 'No totals in progress.json', body: 'The headline counts are read from progress.totals, and that block is missing from the file.', next: 'A sync from the portal rewrites the totals.' })];

  const schedule = plan.schedule;
  const daysToDemo = schedule?.demo_day ? Math.round((Date.parse(schedule.demo_day) - Date.UTC(ctx.now.getFullYear(), ctx.now.getMonth(), ctx.now.getDate())) / DAY_MS) : null;
  const scheduleCard = schedule?.demo_day
    ? card({
        to: 'overview/schedule',
        label: 'Demo day',
        value: formatDate(schedule.demo_day),
        note: `${daysToDemo > 0 ? `In ${daysToDemo} day${daysToDemo === 1 ? '' : 's'}.` : daysToDemo === 0 ? 'Today.' : 'Already past.'} Build runs ${formatDate(schedule.build_start) ?? 'from an unset date'} to ${formatDate(schedule.build_end) ?? 'an unset date'}.`,
        wide: true,
      })
    : card({
        to: 'overview/schedule',
        label: 'Schedule',
        value: 'Not in the plan file yet',
        note: 'Build start, build end and demo day are empty in plan.json, so no date is shown here.',
        tone: 'empty',
        wide: true,
      });

  const focus = focusRelease(releases, ctx.now);
  const focusCard = focus
    ? card({
        to: `overview/release/${focus.release.key}`,
        label: 'Release in focus',
        value: focus.release.name,
        note: `${focus.release.key} · ${releaseWindow(focus.release).text ?? 'no dates or weeks in the plan'} · ${focus.release.verified} of ${focus.release.stories.length} stories verified. ${BASIS_TEXT[focus.basis]}`,
        wide: true,
      })
    : empty({ title: 'No releases in the plan file', next: 'A plan with releases is published and synced.' });

  const liveCount = releases.filter((r) => r.stories.length && r.verified === r.stories.length).length;
  const liveLine = !releases.length
    ? null
    : liveCount === 0
      ? 'Nothing is live yet. A release is live when the platform has verified every story in it.'
      : `${liveCount} of ${releases.length} releases are live: every story in them is verified.`;

  const age = dataAge((m.data.sample ? m.data.realManifest : m.data.manifest)?.generated_at, ctx.now);

  return h(
    'div',
    {},
    h('p', { class: 'kicker' }, 'Overview'),
    h('h1', { tabindex: '-1' }, name),
    descriptor ? h('p', { class: 'lede' }, descriptor) : null,
    BUILD_PAUSED_AT_OVERVIEW
      ? h(
          'div',
          { class: 'paused', role: 'note' },
          h('strong', {}, 'The build is stopped here for your review. '),
          'Only this Overview is built. The other eight tabs open and say so. When the Overview looks right, tell Claude ',
          h('strong', {}, 'build the rest'),
          ' and the remaining tabs get built.',
        )
      : null,
    section('Where the build stands', h('div', { class: 'grid grid--3' }, counts)),
    section('Where you are in the plan', h('div', { class: 'grid grid--2' }, scheduleCard, focusCard)),
    section(
      'What is live and what is not',
      liveLine ? h('p', { class: 'block__lede' }, liveLine) : null,
      h(
        'div',
        { class: 'grid grid--releases' },
        releases.map((r) =>
          h(
            'a',
            { class: 'card card--release', href: link(`overview/release/${r.key}`) },
            h('span', { class: 'card__top' }, h('span', { class: 'card__label' }, r.key), sampleTag()),
            h('span', { class: 'card__title' }, r.name),
            h('span', { class: 'card__row' }, liveness(r), h('span', {}, `${r.verified} of ${r.stories.length} stories verified`)),
            h('span', { class: 'card__note' }, releaseWindow(r).text ?? 'No dates or weeks in the plan'),
            h('span', { class: 'card__more', 'aria-hidden': 'true' }, 'Open →'),
          ),
        ),
      ),
    ),
    section(
      'About this data',
      h(
        'div',
        { class: 'grid grid--2' },
        card({
          to: 'overview/freshness',
          label: 'Data as of',
          value: age.known ? age.absolute : 'Unknown',
          note: age.known ? `${age.relative[0].toUpperCase()}${age.relative.slice(1)}. Nothing on this page is live: it shows the files as they were last written.` : 'manifest.json has no readable generated_at, so the age of this data cannot be shown.',
          tone: age.level === 'stale' ? 'warn' : age.known ? null : 'empty',
          wide: true,
        }),
      ),
      source('.colaberry/plan.json, .colaberry/progress.json and .colaberry/manifest.json'),
    ),
  );
}

function detail(m, [kind, id]) {
  if (kind === 'stories') return storiesPage(m);
  if (kind === 'criteria') return criteriaPage(m);
  if (kind === 'points') return pointsPage(m);
  if (kind === 'schedule') return schedulePage(m);
  if (kind === 'freshness') return freshnessPage(m);
  if (kind === 'release') {
    const release = m.releases.find((r) => r.key === id);
    if (release) return releasePage(m, release);
  }
  if (kind === 'story') {
    const row = m.rows.find((r) => r.id === id);
    if (row) return storyPage(m, row);
  }
  return page('Not found', [{ label: 'Not found' }], empty({ title: 'There is no such page under Overview', body: `Nothing in the plan files matches "${[kind, id].filter(Boolean).join('/')}".` }));
}

function storiesTable(rows, caption) {
  return table(
    ['Story', 'Release', 'State', 'Criteria'],
    rows.map((r) => [storyLink(r), r.release ?? (r.inPlan ? '—' : 'Not in plan.json'), statePill(r.state), criteriaText(r)]),
    caption,
  );
}

function storiesPage(m) {
  const t = m.totals;
  return page(
    'Stories verified',
    [{ label: 'Stories verified' }],
    t ? h('p', { class: 'lede' }, `${t.stories_verified} of ${t.stories_total} stories are verified, as counted in progress.totals.`) : null,
    m.anyChecked ? null : h('p', {}, 'No story carries a verification block yet. That means the platform has not checked any story, which is different from checking and finding nothing done.'),
    storiesTable(m.rows, 'Every story in progress.json, joined to the plan on story id'),
    h('p', { class: 'source' }, 'A story is verified when every acceptance criterion is ticked in progress.json and a pushed commit names the story.'),
  );
}

function criteriaPage(m) {
  const t = m.totals;
  return page(
    'Acceptance criteria',
    [{ label: 'Acceptance criteria' }],
    t ? h('p', { class: 'lede' }, `${t.criteria_passed} of ${t.criteria_total} criteria have passed, as counted in progress.totals.`) : null,
    h('p', {}, 'A tick in progress.json is a claim made by the build. It counts once the platform verifies the story it belongs to.'),
    m.rows.map((r) =>
      h(
        'section',
        { class: 'block block--tight' },
        h('h2', {}, storyLink(r), ' ', statePill(r.state)),
        r.criteria.length
          ? h('ul', { class: 'criteria' }, r.criteria.map((c) => h('li', { class: c.passed ? 'is-ticked' : '' }, h('span', { class: 'criteria__mark' }, c.passed ? 'Ticked' : 'Not ticked'), c.text)))
          : h('p', {}, 'No criteria are listed for this story in progress.json.'),
      ),
    ),
  );
}

function pointsPage(m) {
  const awarded = m.rows.filter((r) => r.verification?.points_awarded != null);
  return page(
    'Points awarded',
    [{ label: 'Points awarded' }],
    m.totals ? h('p', { class: 'lede' }, `${m.totals.points_awarded} points awarded, as counted in progress.totals.`) : null,
    awarded.length
      ? table(['Story', 'State', 'Points'], awarded.map((r) => [storyLink(r), statePill(r.state), String(r.verification.points_awarded)]), 'Points by story')
      : empty({ title: 'No points have been awarded yet', body: 'This page will list each verified story with the points the platform awarded for it.', next: 'A story is verified: its criteria are ticked because they are true, and a pushed commit names it.' }),
  );
}

function schedulePage(m) {
  const s = m.plan.schedule;
  const weeks = table(
    ['Release', 'Name', 'Window', 'Demo target'],
    m.releases.map((r) => [h('a', { href: link(`overview/release/${r.key}`) }, r.key), r.name, releaseWindow(r).text ?? '—', r.is_demo_target ? 'Yes' : 'No']),
    'Releases as the plan file holds them',
  );
  if (!s) {
    return page(
      'Schedule',
      [{ label: 'Schedule' }],
      empty({
        title: 'No schedule in the plan file yet',
        body: 'When the plan carries dates, this page shows the build start, the build end, demo day, and where today falls between them.',
        next: 'A plan with dates is published and synced into this repo. In the copy held here plan.schedule is null, and every release and story date is empty too. The week numbers below are in the file.',
      }),
      weeks,
    );
  }
  const row = (label, value) => [label, formatDate(value) ?? 'Not set'];
  return page(
    'Schedule',
    [{ label: 'Schedule' }],
    table(['', 'Date'], [row('Build starts', s.build_start), row('Build ends', s.build_end), row('Demo day', s.demo_day)], 'From plan.schedule'),
    s.demo_release_key ? h('p', {}, `The release shown on demo day is ${s.demo_release_key}.`) : null,
    weeks,
  );
}

function releasePage(m, release) {
  const win = releaseWindow(release);
  return page(
    `${release.key} · ${release.name}`,
    [{ label: release.key }],
    h('p', { class: 'lede' }, liveness(release), ` ${release.verified} of ${release.stories.length} stories verified.`),
    h(
      'dl',
      { class: 'facts' },
      release.goal ? [h('dt', {}, 'Goal'), h('dd', {}, release.goal)] : null,
      release.demo ? [h('dt', {}, 'What gets demonstrated'), h('dd', {}, release.demo)] : null,
      h('dt', {}, 'Window'),
      h('dd', {}, win.text ?? 'No dates or weeks in the plan.', win.dated ? null : ' The plan file has no dates for this release yet.'),
    ),
    release.stories.length ? storiesTable(release.stories, 'Stories in this release') : empty({ title: 'No stories are listed for this release in the plan file' }),
  );
}

function storyPage(m, row) {
  const v = row.verification;
  return page(
    storyName(row),
    [{ label: row.id }],
    h('p', { class: 'lede' }, statePill(row.state), ' ', criteriaText(row), '.'),
    row.inPlan ? null : h('p', {}, 'This story is listed in progress.json but not in plan.json, so its title, release and owner are not in the files and are not shown.'),
    row.narrative ? h('p', {}, row.narrative) : null,
    h(
      'dl',
      { class: 'facts' },
      h('dt', {}, 'Release'),
      h('dd', {}, row.release ? h('a', { href: link(`overview/release/${row.release}`) }, row.release) : 'Not in the plan file'),
      h('dt', {}, 'Owner'),
      h('dd', {}, row.owner ?? 'Not in the plan file'),
      h('dt', {}, 'Due'),
      h('dd', {}, formatDate(row.due_on) ?? 'No date in the plan file yet'),
      h('dt', {}, 'First given due date'),
      h('dd', {}, formatDate(row.due_baseline_on) ?? 'No date in the plan file yet'),
      v?.commit_sha ? [h('dt', {}, 'Verified commit'), h('dd', {}, v.commit_url ? h('a', { href: v.commit_url }, v.commit_sha) : v.commit_sha)] : null,
    ),
    h('h2', {}, 'Acceptance criteria'),
    row.criteria.length
      ? h('ul', { class: 'criteria' }, row.criteria.map((c) => h('li', { class: c.passed ? 'is-ticked' : '' }, h('span', { class: 'criteria__mark' }, c.passed ? 'Ticked' : 'Not ticked'), c.text)))
      : h('p', {}, 'No criteria are listed for this story in progress.json.'),
  );
}

function freshnessPage(m) {
  const manifest = m.data.sample ? m.data.realManifest : m.data.manifest;
  const age = dataAge(manifest?.generated_at, m.ctx.now);
  return page(
    'Data as of',
    [{ label: 'Data as of' }],
    age.known
      ? h('p', { class: 'lede' }, `The real data is as of ${age.absolute} (${age.relative}).`)
      : empty({ title: 'The age of the data is unknown', body: '.colaberry/manifest.json could not be read or has no generated_at.', next: 'The file is committed in this repo, or a sync from the portal rewrites it.' }),
    m.data.sample ? h('p', {}, 'Sample mode is on. The sample values are made up in your browser each time the page is drawn; the stamp above is for the real files.') : null,
    h('h2', {}, 'What the stamp means'),
    h(
      'ul',
      {},
      h('li', {}, 'Nothing on this page is live. The files are written when the project is synced from the portal, and between syncs they do not change.'),
      h('li', {}, 'It reads "Data as of", not "Last synced". The stamp moves when the data changes, so a sync that found nothing new leaves it alone.'),
      h('li', {}, `An old stamp means either that nothing has happened or that the project has not been synced. The page cannot tell which. Past ${STALE_AFTER_DAYS} days it turns into a warning and asks for a sync either way.`),
    ),
    manifest
      ? table(
          ['Field', 'Value'],
          [
            ['generated_at', manifest.generated_at ?? '—'],
            ['plan_version', manifest.plan_version ?? '—'],
            ['files listed', Array.isArray(manifest.files) ? String(manifest.files.length) : '—'],
          ],
          'From .colaberry/manifest.json',
        )
      : null,
  );
}
