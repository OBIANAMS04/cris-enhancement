// Run with: node --test tests/
// Checks the data layer the whole Command Center reads through, against the real files committed in this repo.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { loadReal, dataAge, formatDate, storyRows, releaseRows, focusRelease, releaseWindow, FILES } from '../assets/js/data.js';
import { buildSample } from '../assets/js/sample.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const fileFetch = async (path) => {
  try {
    const text = readFileSync(join(root, path), 'utf8');
    return { ok: true, status: 200, json: async () => JSON.parse(text) };
  } catch {
    return { ok: false, status: 404, json: async () => ({}) };
  }
};
const real = await loadReal(fileFetch);
const NOW = new Date('2026-11-10T15:00:00Z');

test('the three committed files load with no errors', () => {
  assert.deepEqual(real.errors, []);
  assert.ok(real.plan && real.progress && real.manifest);
  assert.ok(Array.isArray(real.notes) && real.notes.length > 0, 'content/notes.json is read');
  assert.ok(real.dataModel?.entities?.length > 0, 'content/data-model.json is read');
  assert.equal(real.mode, 'real');
});

test('failure path: a missing file is reported by name and left null, not guessed', async () => {
  const data = await loadReal(async (path) => (path === FILES.plan ? { ok: false, status: 404 } : fileFetch(path)));
  assert.equal(data.plan, null);
  assert.ok(data.progress);
  assert.equal(data.errors.length, 1);
  assert.match(data.errors[0], /plan\.json answered HTTP 404/);
});

test('failure path: a file that is not JSON and a fetch that throws are both reported', async () => {
  const broken = await loadReal(async (path) =>
    path === FILES.manifest ? { ok: true, status: 200, json: async () => JSON.parse('{nope') } : fileFetch(path),
  );
  assert.equal(broken.manifest, null);
  assert.match(broken.errors[0], /manifest\.json is not valid JSON/);
  const offline = await loadReal(async () => {
    throw new Error('network down');
  });
  assert.equal(offline.errors.length, 5, 'three plan files and two content files');
  assert.match(offline.errors[0], /could not be read \(network down\)/);
});

test('data age: plain under a week, a warning past a week, unknown when the stamp is missing', () => {
  const fresh = dataAge('2026-11-10T12:51:02.894Z', NOW);
  assert.deepEqual([fresh.level, fresh.absolute, fresh.relative], ['fresh', '10 November 2026', '2 hours ago']);
  assert.equal(dataAge('2026-11-07T15:00:00Z', NOW).relative, '3 days ago');
  assert.equal(dataAge('2026-11-03T15:00:00Z', NOW).level, 'fresh', 'exactly seven days is not yet past a week');
  const stale = dataAge('2026-11-02T14:00:00Z', NOW);
  assert.deepEqual([stale.level, stale.relative], ['stale', '8 days ago']);
  assert.deepEqual(dataAge(null, NOW), { known: false, level: 'unknown' });
  assert.equal(dataAge('not a date', NOW).known, false);
});

test('dates: a calendar day is formatted without shifting across time zones', () => {
  assert.equal(formatDate('2026-11-05'), '5 November 2026');
  assert.equal(formatDate(null), null);
  assert.equal(formatDate('nonsense'), null);
});

test('stories: plan and progress join on id, and an absent verification block means not checked', () => {
  const rows = storyRows(real.plan, real.progress);
  assert.equal(rows.length, real.progress.stories.length);
  assert.equal(rows[0].id, 'STORY-000', 'the story that is only in progress.json comes first');
  assert.equal(rows[0].inPlan, false);
  assert.equal(rows[0].title, null, 'its title is not in the files, so none is invented');
  const first = rows.find((r) => r.id === 'STORY-001');
  assert.equal(first.title, real.plan.stories.find((s) => s.id === 'STORY-001').title);
  assert.equal(first.checked, false);
  assert.equal(first.state, null);
});

test('stories: deleting a story from the plan removes it from the rows', () => {
  const plan = structuredClone(real.plan);
  const progress = structuredClone(real.progress);
  plan.stories = plan.stories.filter((s) => s.id !== 'STORY-003');
  progress.stories = progress.stories.filter((s) => s.id !== 'STORY-003');
  const rows = storyRows(plan, progress);
  assert.equal(rows.some((r) => r.id === 'STORY-003'), false);
  const r0 = releaseRows(plan, rows).find((r) => r.key === 'r0');
  assert.equal(r0.stories.some((s) => s.id === 'STORY-003'), false);
});

test('releases: with no dates in the plan the focus falls back to progress and says so', () => {
  const releases = releaseRows(real.plan, storyRows(real.plan, real.progress));
  assert.equal(releases.length, real.plan.releases.length);
  const undated = releases.every((r) => !r.starts_on);
  const focus = focusRelease(releases, NOW);
  assert.equal(focus.release.key, releases[0].key);
  if (undated) {
    assert.equal(focus.basis, 'progress-no-dates');
    assert.equal(releaseWindow(releases[0]).dated, false);
  }
  assert.equal(focusRelease([], NOW), null);
});

test('sample mode: flagged as sample, same stories as the plan, dates and states filled in', () => {
  const sample = buildSample(real, NOW);
  assert.equal(sample.mode, 'sample');
  assert.equal(sample.sample, true);
  assert.equal(sample.manifest.sample, true);
  assert.deepEqual(sample.plan.stories.map((s) => s.id), real.plan.stories.map((s) => s.id));
  assert.ok(sample.plan.stories.every((s) => s.due_on && s.due_baseline_on));
  assert.ok(sample.plan.schedule.demo_day);
  const rows = storyRows(sample.plan, sample.progress);
  assert.ok(rows.every((r) => r.checked));
  const t = sample.progress.totals;
  assert.equal(t.stories_total, rows.length);
  assert.equal(t.stories_verified + t.stories_submitted + t.stories_in_progress + t.stories_not_started, t.stories_total);
  assert.equal(focusRelease(releaseRows(sample.plan, rows), NOW).basis, 'date');
});

test('sample mode never changes the real data it was built from', () => {
  const before = JSON.stringify(real);
  buildSample(real, NOW);
  assert.equal(JSON.stringify(real), before);
  assert.equal(real.plan.schedule ?? null, JSON.parse(before).plan.schedule ?? null);
});

test('failure path: sample mode without a readable plan reports it instead of inventing one', () => {
  const sample = buildSample({ plan: null, progress: real.progress, manifest: real.manifest }, NOW);
  assert.equal(sample.plan, null);
  assert.equal(sample.errors.length, 1);
});
