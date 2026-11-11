// STORY-004 Feature development: feedback to release, answers for what cannot be done, documented changes.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { setup } from './helpers.mjs';
import { submitFeedback, assessFeedback, advanceFeature, changeLog, FeatureError } from '../lib/features.js';

test('STORY-004: feedback becomes a feature that is released only once it is shown to meet the need', async () => {
  const { store, user, dev } = await setup();
  const fb = await submitFeedback(store, { submitted_by: user, text: 'Let me filter reports by county' });
  const { change } = await assessFeedback(store, fb.id, { actor: dev, feasible: true, reason: 'Common request; data already has county', title: 'County filter on reports' });
  await advanceFeature(store, change.id, { actor: dev });
  await advanceFeature(store, change.id, { actor: dev });
  await assert.rejects(advanceFeature(store, change.id, { actor: dev }), /how this change meets/);
  const released = await advanceFeature(store, change.id, { actor: dev, need_check: 'Avery filtered by Travis County in the demo.' });
  assert.equal(released.status, 'released');
  assert.equal(store.get('Feedback', fb.id).status, 'reviewed');
  assert.match(store.get('Feedback', fb.id).response, /Released as FC-/);
});

test('STORY-004: a request that is not feasible gets feedback, not silence', async () => {
  const { store, user, dev } = await setup();
  const fb = await submitFeedback(store, { submitted_by: user, text: 'Show other states crash data' });
  await assert.rejects(assessFeedback(store, fb.id, { actor: dev, feasible: false, reason: ' ' }), FeatureError);
  const { feedback, change } = await assessFeedback(store, fb.id, { actor: dev, feasible: false, reason: 'CRIS holds Texas records only.' });
  assert.equal(change, null);
  assert.equal(feedback.status, 'declined');
  assert.equal(feedback.response, 'Not feasible: CRIS holds Texas records only.');
  await assert.rejects(assessFeedback(store, fb.id, { actor: dev, feasible: true, reason: 'x' }), /already been assessed/);
});

test('STORY-004 Trust: every feature change is documented', async () => {
  const { store, user, dev } = await setup();
  const fb = await submitFeedback(store, { submitted_by: user, text: 'Bigger buttons' });
  const { change } = await assessFeedback(store, fb.id, { actor: dev, feasible: true, reason: 'Accessibility' });
  await advanceFeature(store, change.id, { actor: dev });
  assert.deepEqual(changeLog(store, change.id).map((e) => e.action), ['feature proposed', 'feature approved']);
  assert.equal((await store.verifyAudit()).ok, true);
});
