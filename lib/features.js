// STORY-004: feature development driven by feedback. Users submit feedback; the development team assesses it.
// Feasible feedback becomes a FeatureChange that moves proposed → approved → in build → released. Feedback that is
// not feasible is declined with a reason the submitter is told, so no request disappears silently. A change cannot be
// released until someone records how it meets the original feedback, and every step is documented in the audit log
// and in the change history (changeLog).

export class FeatureError extends Error {
  constructor(message, problems = []) {
    super(message);
    this.name = 'FeatureError';
    this.problems = problems;
  }
}

export const FLOW = ['proposed', 'approved', 'in build', 'released'];

export async function submitFeedback(store, { submitted_by, text, category = 'general', key }) {
  const problems = [];
  if (!submitted_by || !store.get('Person', submitted_by)) problems.push('Choose who is giving the feedback.');
  if (!String(text ?? '').trim()) problems.push('Write the feedback.');
  if (problems.length) throw new FeatureError('The feedback was not saved.', problems);
  return store.insert('Feedback', { submitted_by, text: text.trim(), category, submitted_at: store.now().toISOString(), status: 'new' }, { actor: submitted_by, action: 'feedback submitted', key });
}

/**
 * Decide on a piece of feedback. Feasible: a FeatureChange is proposed from it. Not feasible: it is declined and the
 * reason is kept as the response to the submitter. Either way the submitter gets an answer.
 */
export async function assessFeedback(store, id, { actor, feasible, reason, title }) {
  const fb = store.get('Feedback', id);
  if (!fb) throw new FeatureError(`Feedback ${id} does not exist.`);
  if (fb.status !== 'new') throw new FeatureError(`Feedback ${id} has already been assessed (${fb.status}).`);
  if (!String(reason ?? '').trim()) throw new FeatureError(feasible ? 'Say why it is worth building.' : 'Say why it cannot be done, so the submitter knows.');
  return store.transaction(async (tx) => {
    if (!feasible) {
      const declined = await tx.update('Feedback', id, { status: 'declined', response: `Not feasible: ${reason.trim()}` }, { actor, action: 'feedback declined' });
      return { feedback: declined, change: null };
    }
    const change = await tx.insert('FeatureChange', { title: (title || fb.text).slice(0, 120), reason: reason.trim(), status: 'proposed', from_feedback: id }, { actor, action: 'feature proposed' });
    const planned = await tx.update('Feedback', id, { status: 'planned', response: `Planned as ${change.id}: ${reason.trim()}` }, { actor, action: 'feedback planned' });
    return { feedback: planned, change };
  });
}

/** Move a change one step along the flow. Releasing needs `need_check`: how it meets the feedback it came from. */
export async function advanceFeature(store, id, { actor, need_check }) {
  const fc = store.get('FeatureChange', id);
  if (!fc) throw new FeatureError(`Feature change ${id} does not exist.`);
  const i = FLOW.indexOf(fc.status);
  if (i < 0 || i === FLOW.length - 1) throw new FeatureError(`${id} is ${fc.status}; there is no next step.`);
  const to = FLOW[i + 1];
  const patch = { status: to };
  if (to === 'released') {
    if (!String(need_check ?? '').trim()) throw new FeatureError('Before release, record how this change meets the user feedback it came from.');
    patch.need_check = need_check.trim();
    patch.released_on = store.now().toISOString().slice(0, 10);
  }
  return store.transaction(async (tx) => {
    const updated = await tx.update('FeatureChange', id, patch, { actor, action: `feature ${to}` });
    if (to === 'released' && fc.from_feedback) await tx.update('Feedback', fc.from_feedback, { status: 'reviewed', response: `Released as ${id} on ${patch.released_on}. ${patch.need_check}` }, { actor, action: 'feedback answered' });
    return updated;
  });
}

/** The documented history of one change, read from the audit log. */
export function changeLog(store, id) {
  return store.audit().filter((e) => e.entity === 'FeatureChange' && e.record_id === id).map((e) => ({ at: e.at, actor: e.actor, action: e.action, detail: e.detail }));
}
