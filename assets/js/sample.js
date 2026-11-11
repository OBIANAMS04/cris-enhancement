// Sample mode. It keeps the SHAPE of the real plan (same releases, same stories) and fills in made-up dates,
// states and points so the page can be seen full on day one. Nothing here is a result of the project, and the
// page labels every screen that shows it. The values are deterministic for a given day so tests can check them.

const DAY_MS = 86400000;
const iso = (ms) => new Date(ms).toISOString().slice(0, 10);

const RELEASE_LENGTH_DAYS = 4;
const RELEASE_STEP_DAYS = 6;
const DAYS_BEFORE_TODAY = 12;
const SAMPLE_POINTS = 30;

function sampleState(releaseIndex, storyIndex) {
  if (releaseIndex < 2) return 'verified';
  if (releaseIndex === 2) return ['submitted', 'in_progress'][storyIndex] ?? 'not_started';
  return 'not_started';
}

function sampleVerification(state, criteria, when) {
  const total = criteria.length;
  const passed = state === 'verified' || state === 'submitted' ? total : state === 'in_progress' ? Math.min(1, total) : 0;
  criteria.forEach((c, i) => {
    c.passed = i < passed;
  });
  return {
    state,
    criteria_passed: passed,
    criteria_total: total,
    verified_at: state === 'verified' ? new Date(when).toISOString() : null,
    commit_sha: state === 'verified' ? 'sample00' : null,
    commit_url: null,
    commit_at: null,
    points_awarded: state === 'verified' ? SAMPLE_POINTS : null,
    outstanding: criteria.filter((c) => !c.passed).map((c) => c.text),
  };
}

export function buildSample(real, now = new Date()) {
  if (!real?.plan || !real?.progress) {
    return {
      mode: 'sample',
      sample: true,
      plan: null,
      progress: null,
      manifest: null,
      realManifest: real?.manifest ?? null,
      errors: ['Sample mode copies the shape of .colaberry/plan.json and .colaberry/progress.json, and at least one of them could not be read.'],
    };
  }
  const plan = structuredClone(real.plan);
  const progress = structuredClone(real.progress);
  // The local calendar day, held as a UTC timestamp so adding days never crosses a clock change.
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const start = today - DAYS_BEFORE_TODAY * DAY_MS;
  const storyById = new Map((plan.stories ?? []).map((s) => [s.id, s]));
  const stateById = new Map();

  (plan.releases ?? []).forEach((release, ri) => {
    const starts = start + ri * RELEASE_STEP_DAYS * DAY_MS;
    release.starts_on = iso(starts);
    release.ends_on = iso(starts + RELEASE_LENGTH_DAYS * DAY_MS);
    release.is_demo_target = ri === plan.releases.length - 1;
    const ids = release.story_ids ?? [];
    ids.forEach((id, si) => {
      const story = storyById.get(id);
      if (!story) return;
      const due = starts + Math.round(((si + 1) / ids.length) * RELEASE_LENGTH_DAYS) * DAY_MS;
      story.due_on = iso(due);
      // Every third story in a release slipped a day, so the baseline and current dates differ somewhere.
      story.due_baseline_on = iso(si % 3 === 2 ? due - DAY_MS : due);
      stateById.set(id, sampleState(ri, si));
    });
  });

  const last = plan.releases?.[plan.releases.length - 1];
  plan.schedule = {
    build_start: iso(start),
    build_end: last?.ends_on ?? null,
    demo_day: last ? iso(Date.parse(last.ends_on) + 2 * DAY_MS) : null,
    build_weeks: null,
    demo_release_key: last?.key ?? null,
    roadmap_release_keys: [],
    prep: [],
  };

  const totals = { stories_total: 0, stories_verified: 0, stories_submitted: 0, stories_in_progress: 0, stories_not_started: 0, criteria_total: 0, criteria_passed: 0, points_awarded: 0 };
  (progress.stories ?? []).forEach((p) => {
    // A story that is in progress.json but not in the plan (the Command Center itself) is shown as verified.
    const state = stateById.get(p.id) ?? 'verified';
    p.criteria = p.criteria ?? [];
    p.verification = sampleVerification(state, p.criteria, today - 2 * DAY_MS);
    totals.stories_total += 1;
    totals[`stories_${state}`] += 1;
    totals.criteria_total += p.verification.criteria_total;
    totals.criteria_passed += p.verification.criteria_passed;
    totals.points_awarded += p.verification.points_awarded ?? 0;
  });
  progress.totals = totals;

  // Made-up measures and connection statuses, so the Outcomes and Systems tabs can be seen full.
  plan.derived = { ...(plan.derived ?? {}) };
  plan.derived.measures = [
    { id: 'SAMPLE-M1', statement: 'Sample: 90% of help desk tickets resolved within one business day.' },
    { id: 'SAMPLE-M2', statement: 'Sample: CRIS available 99.5% of each month.' },
  ];
  const states = ['connected', 'not_connected', 'error'];
  const systemStatus = Object.fromEntries((plan.derived.systems ?? []).map((name, i) => [name, { state: states[i % states.length], checked_at: new Date(now.getTime() - (i + 1) * 20 * 60000).toISOString() }]));

  return {
    mode: 'sample',
    sample: true,
    plan,
    progress,
    notes: real.notes ?? null,
    dataModel: real.dataModel ?? null,
    systemStatus,
    manifest: { generated_at: new Date(now.getTime() - 3 * 3600000).toISOString(), sample: true },
    realManifest: real.manifest ?? null,
    errors: [],
  };
}
