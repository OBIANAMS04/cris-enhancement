// The one place the Command Center gets its data. Every tab reads through here, so pointing the page at a
// different source later is a change to this file and to nothing else.
//
// The three files are written by the Colaberry platform (or downloaded from the portal) and committed in this
// repo. They are fetched at runtime; nothing from them is copied into a component. See docs/DATA_CONTRACT.md.

export const FILES = {
  plan: '.colaberry/plan.json',
  progress: '.colaberry/progress.json',
  manifest: '.colaberry/manifest.json',
};

export const FETCH_TIMEOUT_MS = 10000;
export const STALE_AFTER_DAYS = 7;
const DAY_MS = 86400000;
const HOUR_MS = 3600000;

export const STATE_LABEL = {
  not_started: 'Not started',
  in_progress: 'In progress',
  submitted: 'Submitted',
  verified: 'Verified',
};
export const NOT_CHECKED = 'Not checked yet';

async function readJson(path, fetchImpl) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetchImpl(path, { cache: 'no-store', signal: controller.signal });
    if (!res.ok) return { error: `${path} answered HTTP ${res.status}.` };
    try {
      return { value: await res.json() };
    } catch (err) {
      return { error: `${path} is not valid JSON (${err.message}).` };
    }
  } catch (err) {
    const why = err.name === 'AbortError' ? `did not answer within ${FETCH_TIMEOUT_MS / 1000} seconds` : `could not be read (${err.message})`;
    return { error: `${path} ${why}.` };
  } finally {
    clearTimeout(timer);
  }
}

/** Reads the three files. A file that cannot be read is reported in `errors` and left null; it is never guessed. */
export async function loadReal(fetchImpl = (...args) => globalThis.fetch(...args)) {
  const names = Object.keys(FILES);
  const results = await Promise.all(names.map((name) => readJson(FILES[name], fetchImpl)));
  const data = { mode: 'real', sample: false, errors: [] };
  names.forEach((name, i) => {
    data[name] = results[i].value ?? null;
    if (results[i].error) data.errors.push(results[i].error);
  });
  return data;
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/** "2026-11-10" or a full timestamp becomes "10 November 2026". Date-only values are read as calendar days. */
export function formatDate(value) {
  if (!value) return null;
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split('-').map(Number);
    return `${d} ${MONTHS[m - 1]} ${y}`;
  }
  const t = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(t.getTime())) return null;
  return `${t.getDate()} ${MONTHS[t.getMonth()]} ${t.getFullYear()}`;
}

/**
 * How old the data is, from manifest.generated_at. The stamp moves when the DATA changes, not when a sync runs,
 * so an old stamp means "nothing changed" or "not synced" and the page cannot tell which.
 */
export function dataAge(generatedAt, now = new Date()) {
  const t = generatedAt ? new Date(generatedAt) : null;
  if (!t || Number.isNaN(t.getTime())) return { known: false, level: 'unknown' };
  const ms = now.getTime() - t.getTime();
  const days = Math.floor(ms / DAY_MS);
  const hours = Math.floor(ms / HOUR_MS);
  let relative;
  if (ms < 0) relative = 'dated in the future';
  else if (hours < 1) relative = 'less than an hour ago';
  else if (hours < 24) relative = `${hours} hour${hours === 1 ? '' : 's'} ago`;
  else relative = `${days} day${days === 1 ? '' : 's'} ago`;
  return { known: true, absolute: formatDate(t), relative, days, level: ms > STALE_AFTER_DAYS * DAY_MS ? 'stale' : 'fresh' };
}

/**
 * One row per story: the plan joined to progress on story id. State comes from progress.verification and from
 * nowhere else; when that block is absent the state is null, which means "not checked yet", not "not started".
 * A story that is in progress.json but not in plan.json (the Command Center story itself) is kept, first.
 */
export function storyRows(plan, progress) {
  const planStories = plan?.stories ?? [];
  const progressStories = progress?.stories ?? [];
  const progressById = new Map(progressStories.map((s) => [s.id, s]));
  const planIds = new Set(planStories.map((s) => s.id));
  const row = (id, story, p) => {
    const criteria = p?.criteria ?? [];
    const v = p?.verification ?? null;
    return {
      id,
      inPlan: Boolean(story),
      title: story?.title ?? null,
      release: story?.release ?? p?.release ?? null,
      narrative: story?.narrative ?? null,
      owner: story?.owner_agent ?? null,
      due_on: story?.due_on ?? null,
      due_baseline_on: story?.due_baseline_on ?? null,
      criteria,
      claimed: criteria.filter((c) => c.passed === true).length,
      criteriaTotal: p?.acceptance_total ?? story?.acceptance?.length ?? criteria.length,
      checked: Boolean(v),
      state: v?.state ?? null,
      verification: v,
    };
  };
  const extra = progressStories.filter((s) => !planIds.has(s.id)).map((s) => row(s.id, null, s));
  return [...extra, ...planStories.map((s) => row(s.id, s, progressById.get(s.id)))];
}

/** One row per release, with its stories and how many of them the platform has verified. */
export function releaseRows(plan, rows) {
  const byId = new Map(rows.map((r) => [r.id, r]));
  return (plan?.releases ?? []).map((release) => {
    const stories = (release.story_ids ?? []).map((id) => byId.get(id)).filter(Boolean);
    return {
      ...release,
      stories,
      verified: stories.filter((s) => s.state === 'verified').length,
      checked: stories.some((s) => s.checked),
    };
  });
}

/**
 * Which release the build is in. By date when the plan carries dates; otherwise the first release that still has
 * unverified stories, and the caller is told which basis was used so the page can say so.
 */
export function focusRelease(releases, now = new Date()) {
  if (!releases.length) return null;
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const dated = releases.filter((r) => r.starts_on && r.ends_on);
  const current = dated.find((r) => r.starts_on <= today && today <= r.ends_on);
  if (current) return { release: current, basis: 'date' };
  const open = releases.find((r) => r.verified < r.stories.length);
  if (open) return { release: open, basis: dated.length ? 'progress-between-dates' : 'progress-no-dates' };
  return { release: releases[releases.length - 1], basis: 'all-verified' };
}

/** "5 November 2026 to 8 November 2026", or the plan weeks when the file has no dates for the release. */
export function releaseWindow(release) {
  if (release.starts_on && release.ends_on) return { dated: true, text: `${formatDate(release.starts_on)} to ${formatDate(release.ends_on)}` };
  const hasWeeks = Number.isFinite(release.week_start) && Number.isFinite(release.week_end);
  return { dated: false, text: hasWeeks ? `Plan weeks ${release.week_start} to ${release.week_end}` : null };
}
