// STORY-005: training on new functionality. A session is scheduled with its materials and, where it teaches a new
// feature, linked to that feature. It cannot be marked held without a recording, so anyone who missed it can watch
// the recording instead. "Understands the functionality" is measured, not assumed: a person completes the training
// only by passing the course's knowledge check (80% or more), live or after the recording. Completing the cyber
// security course also records the date on the person (REQ-020). Every step is in the audit log.

export class TrainingError extends Error {
  constructor(message, problems = []) {
    super(message);
    this.name = 'TrainingError';
    this.problems = problems;
  }
}

export const courseById = (materials, id) => (materials?.courses ?? []).find((c) => c.id === id) ?? null;

/** Schedule a session. Refused without materials, without a trainer, or in the past. */
export async function scheduleSession(store, materials, { course, scheduled_at, trainer, feature, key }) {
  const c = courseById(materials, course);
  const problems = [];
  if (!c) problems.push('Choose a course; its materials are what the session teaches.');
  else if (!c.materials?.length || !c.questions?.length) problems.push(`${c.title} has no materials or knowledge check yet, so it cannot be taught.`);
  if (!trainer || !store.get('Person', trainer)) problems.push('Choose the trainer.');
  if (!scheduled_at || Number.isNaN(Date.parse(scheduled_at))) problems.push('Choose when the session takes place.');
  else if (Date.parse(scheduled_at) < store.now().getTime()) problems.push('The session would start in the past.');
  if (feature && !store.get('FeatureChange', feature)) problems.push(`Feature change ${feature} does not exist.`);
  if (problems.length) throw new TrainingError('The session was not scheduled.', problems);
  return store.insert('TrainingSession', { title: c.title, kind: c.kind, scheduled_at, trainer, materials_reference: c.id, status: 'scheduled', feature: feature || undefined }, { actor: trainer, action: 'training scheduled', key });
}

/** Mark a session held. A recording is required: without one, people who missed it would have nothing. */
export async function holdSession(store, id, { actor, recording_reference }) {
  const s = store.get('TrainingSession', id);
  if (!s) throw new TrainingError(`Session ${id} does not exist.`);
  if (s.status !== 'scheduled') throw new TrainingError(`Session ${id} is already ${s.status}.`);
  if (!String(recording_reference ?? '').trim()) throw new TrainingError('Add where the recording is kept. A session without a recording cannot be marked held, so those who missed it are not left out.');
  return store.update('TrainingSession', id, { status: 'held', held_at: store.now().toISOString(), recording_reference: recording_reference.trim() }, { actor, action: 'training held, recording kept' });
}

export async function cancelSession(store, id, { actor, reason }) {
  const s = store.get('TrainingSession', id);
  if (!s || s.status !== 'scheduled') throw new TrainingError(`Session ${id} cannot be cancelled.`);
  return store.update('TrainingSession', id, { status: 'cancelled' }, { actor, action: 'training cancelled', detail: { reason } });
}

export function grade(course, answers) {
  const qs = course.questions;
  const right = qs.filter((q, i) => Number(answers?.[i]) === q.answer).length;
  return right / qs.length;
}

/**
 * A person takes the knowledge check for a held session, live or from the recording.
 * Passing completes the training; failing is logged too, and they can try again.
 */
export async function takeCheck(store, materials, { session, person, answers, via = 'live' }) {
  const s = store.get('TrainingSession', session);
  if (!s) throw new TrainingError(`Session ${session} does not exist.`);
  if (s.status !== 'held') throw new TrainingError(s.status === 'scheduled' ? 'The session has not been held yet.' : `The session was ${s.status}.`);
  if (!store.get('Person', person)) throw new TrainingError('Choose who is taking the check.');
  if (via === 'recording' && !s.recording_reference) throw new TrainingError('There is no recording for this session.');
  const course = courseById(materials, s.materials_reference);
  if (!course) throw new TrainingError('The course materials for this session are missing.');
  if (!Array.isArray(answers) || answers.length !== course.questions.length || answers.some((a) => a === null || a === undefined || a === '')) {
    throw new TrainingError('Answer every question.');
  }
  const score = grade(course, answers);
  const passed = score >= (materials.pass_mark ?? 0.8);
  const today = store.now().toISOString().slice(0, 10);
  return store.transaction(async (tx) => {
    const row = await tx.insert('TrainingAttendance', { session, person, completed: passed, completed_on: passed ? today : undefined, via, score: Math.round(score * 100) / 100 }, { actor: person, action: passed ? `training completed (${via})` : 'knowledge check not passed' });
    if (passed && s.kind === 'cyber security') await tx.update('Person', person, { cyber_training_completed_on: today }, { actor: person, action: 'cyber security training recorded' });
    return { attendance: row, passed, score };
  });
}

/** Who has completed a session, who has not, and how. */
export function sessionProgress(store, sessionId) {
  const rows = store.list('TrainingAttendance', (a) => a.session === sessionId);
  const people = store.list('Person');
  const done = new Map();
  for (const r of rows) if (r.completed) done.set(r.person, r);
  return people.map((p) => ({ person: p, completion: done.get(p.id) ?? null, attempts: rows.filter((r) => r.person === p.id).length }));
}

/** Everyone's completions across all sessions: the "training completion is logged" view. */
export const completions = (store) => store.list('TrainingAttendance', (a) => a.completed === true);
