// STORY-005 Training: understanding is measured by a knowledge check, a missed session has its recording, completion is logged.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { setup } from './helpers.mjs';
import { scheduleSession, holdSession, takeCheck, sessionProgress, completions, courseById, TrainingError } from '../lib/training.js';
import { submitFeedback, assessFeedback } from '../lib/features.js';

const materials = JSON.parse(await readFile(new URL('../content/training-materials.json', import.meta.url), 'utf8'));
const right = (id) => courseById(materials, id).questions.map((q) => q.answer);
const wrong = (id) => courseById(materials, id).questions.map((q) => (q.answer + 1) % q.options.length);

async function heldSession(ctx, course = 'COURSE-HELPDESK') {
  const s = await scheduleSession(ctx.store, materials, { course, scheduled_at: '2026-11-12T15:00:00.000Z', trainer: ctx.staff });
  ctx.now.set('2026-11-12T16:00:00.000Z');
  return holdSession(ctx.store, s.id, { actor: ctx.staff, recording_reference: 'recordings/helpdesk-2026-11-12.mp4' });
}

test('STORY-005: after training on a new feature, staff show they understand it by passing the check', async () => {
  const ctx = await setup();
  const fb = await submitFeedback(ctx.store, { submitted_by: ctx.user, text: 'County filter' });
  const { change } = await assessFeedback(ctx.store, fb.id, { actor: ctx.dev, feasible: true, reason: 'Common' });
  const s = await scheduleSession(ctx.store, materials, { course: 'COURSE-FEATURES', scheduled_at: '2026-11-12T15:00:00.000Z', trainer: ctx.staff, feature: change.id });
  assert.equal(s.feature, change.id);
  ctx.now.set('2026-11-12T16:00:00.000Z');
  await holdSession(ctx.store, s.id, { actor: ctx.staff, recording_reference: 'rec/features.mp4' });
  const r = await takeCheck(ctx.store, materials, { session: s.id, person: ctx.manager, answers: right('COURSE-FEATURES') });
  assert.equal(r.passed, true);
  assert.equal(r.score, 1);
  const failed = await takeCheck(ctx.store, materials, { session: s.id, person: ctx.user, answers: wrong('COURSE-FEATURES') });
  assert.equal(failed.passed, false, 'attending is not the same as understanding');
});

test('STORY-005: someone who missed the session completes it from the recording', async () => {
  const ctx = await setup();
  const s = await heldSession(ctx);
  assert.equal(s.recording_reference, 'recordings/helpdesk-2026-11-12.mp4');
  const r = await takeCheck(ctx.store, materials, { session: s.id, person: ctx.user, answers: right('COURSE-HELPDESK'), via: 'recording' });
  assert.equal(r.passed, true);
  assert.equal(r.attendance.via, 'recording');
});

test('STORY-005 Trust: training completion is logged, and cyber security completion is recorded on the person', async () => {
  const ctx = await setup();
  const s = await scheduleSession(ctx.store, materials, { course: 'COURSE-CYBER', scheduled_at: '2026-11-12T15:00:00.000Z', trainer: ctx.admin });
  ctx.now.set('2026-11-12T16:00:00.000Z');
  await holdSession(ctx.store, s.id, { actor: ctx.admin, recording_reference: 'rec/cyber.mp4' });
  await takeCheck(ctx.store, materials, { session: s.id, person: ctx.dev, answers: right('COURSE-CYBER') });
  assert.equal(ctx.store.get('Person', ctx.dev).cyber_training_completed_on, '2026-11-12');
  assert.equal(completions(ctx.store).length, 1);
  const lines = ctx.store.audit().map((e) => e.action);
  assert.ok(lines.includes('training completed (live)'));
  assert.ok(lines.includes('cyber security training recorded'));
  assert.equal(sessionProgress(ctx.store, s.id).find((p) => p.person.id === ctx.dev).completion.completed, true);
  assert.equal((await ctx.store.verifyAudit()).ok, true);
});

test('STORY-005 failure paths: no materials, past date, no recording, not yet held, unanswered check', async () => {
  const ctx = await setup();
  await assert.rejects(scheduleSession(ctx.store, materials, { course: 'NOPE', scheduled_at: '2026-11-12T15:00:00Z', trainer: ctx.staff }), TrainingError);
  await assert.rejects(scheduleSession(ctx.store, { courses: [{ id: 'X', title: 'Empty', kind: 'new functionality', materials: [], questions: [] }] }, { course: 'X', scheduled_at: '2026-11-12T15:00:00Z', trainer: ctx.staff }), (e) => /no materials/.test(e.problems.join()));
  await assert.rejects(scheduleSession(ctx.store, materials, { course: 'COURSE-HELPDESK', scheduled_at: '2026-01-01T15:00:00Z', trainer: ctx.staff }), (e) => /past/.test(e.problems.join()));
  const s = await scheduleSession(ctx.store, materials, { course: 'COURSE-HELPDESK', scheduled_at: '2026-11-12T15:00:00Z', trainer: ctx.staff });
  await assert.rejects(takeCheck(ctx.store, materials, { session: s.id, person: ctx.user, answers: right('COURSE-HELPDESK') }), /not been held/);
  await assert.rejects(holdSession(ctx.store, s.id, { actor: ctx.staff, recording_reference: '' }), /recording/);
  await holdSession(ctx.store, s.id, { actor: ctx.staff, recording_reference: 'rec/x.mp4' });
  await assert.rejects(takeCheck(ctx.store, materials, { session: s.id, person: ctx.user, answers: [0] }), /Answer every question/);
});
