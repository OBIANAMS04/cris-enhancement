// STORY-008 Response submissions: stored correctly, errors logged and addressed, every submission tracked.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { setup, clock } from './helpers.mjs';
import { memoryBlobs } from '../lib/documents.js';
import { submitResponse, verifyReceipt, setResponseStatus, submissionErrors, addressSubmissionError, trackingLog, SubmissionError } from '../lib/submissions.js';

const solicitation = JSON.parse(await readFile(new URL('../content/solicitation.json', import.meta.url), 'utf8'));
const f = (name, text) => ({ name, bytes: new TextEncoder().encode(text), media_type: '' });
const fullSet = (who) => solicitation.required_documents.map((kind, i) => ({ kind, file: f(`${who}-${i}.pdf`, `${who} ${kind}`) }));
const officer = (store) => store.list('Person', (p) => p.role === 'procurement officer')[0].id;

test('STORY-008: a submitted response is stored correctly with all its documents and a receipt', async () => {
  const { store } = await setup();
  const blobs = memoryBlobs();
  const r = await submitResponse(store, blobs, solicitation, { respondent: 'Vendor A Demo', documents: fullSet('a'), actor: officer(store) });
  assert.equal(r.status, 'submitted');
  assert.match(r.receipt_hash, /^[0-9a-f]{64}$/);
  assert.equal(store.list('ResponseDocument', (d) => d.response === r.id).length, solicitation.required_documents.length);
  assert.deepEqual(await verifyReceipt(store, blobs, r.id), { ok: true });
});

test('STORY-008: a submission error is logged, and addressed when the respondent resubmits correctly', async () => {
  const { store } = await setup();
  const blobs = memoryBlobs();
  const actor = officer(store);
  const err = await submitResponse(store, blobs, solicitation, { respondent: 'Vendor B Demo', documents: fullSet('b').slice(0, 2), actor }).catch((e) => e);
  assert.ok(err instanceof SubmissionError);
  assert.match(err.problems.join(), /Missing required document: Forms and certifications/);
  assert.equal(err.incident.status, 'open');
  assert.equal(store.list('SolicitationResponse').length, 0, 'nothing stored for a failed submission');
  await submitResponse(store, blobs, solicitation, { respondent: 'Vendor B Demo', documents: fullSet('b'), actor });
  assert.equal(store.get('Incident', err.incident.id).status, 'resolved');
  assert.match(store.get('Incident', err.incident.id).root_cause, /submitted correctly/);
});

test('STORY-008 failure paths: late, wrong role, bad file, storage failure, double submit; errors addressed by hand', async () => {
  const { store, user } = await setup({ now: clock('2026-11-11T15:00:00.000Z') });
  const actor = officer(store);
  await assert.rejects(submitResponse(store, memoryBlobs(), solicitation, { respondent: 'X', documents: fullSet('x'), actor: user }), (e) => /procurement officer/.test(e.problems.join()));
  const bad = fullSet('y');
  bad[0] = { kind: bad[0].kind, file: f('y.exe', 'x') };
  await assert.rejects(submitResponse(store, memoryBlobs(), solicitation, { respondent: 'Y', documents: bad, actor }), (e) => /not accepted/.test(e.problems.join()));
  const broken = { put: async () => { throw new Error('disk full'); }, get: async () => null };
  const e2 = await submitResponse(store, broken, solicitation, { respondent: 'Z', documents: fullSet('z'), actor }).catch((e) => e);
  assert.match(e2.message, /not stored/);
  await addressSubmissionError(store, e2.incident.id, { actor, root_cause: 'Storage freed; vendor asked to resubmit.' });
  assert.equal(submissionErrors(store).filter((i) => i.status === 'open').length, 2);
  const blobs = memoryBlobs();
  const one = await submitResponse(store, blobs, solicitation, { respondent: 'W', documents: fullSet('w'), actor, key: 'w-1' });
  const two = await submitResponse(store, blobs, solicitation, { respondent: 'W', documents: fullSet('w'), actor, key: 'w-1' });
  assert.equal(one.id, two.id, 'a retried submission is not stored twice');
  const late = await setup({ now: clock('2026-11-21T15:00:00.000Z') });
  await assert.rejects(submitResponse(late.store, memoryBlobs(), solicitation, { respondent: 'L', documents: fullSet('l'), actor: officer(late.store) }), (e) => /late submissions are not accepted/.test(e.problems.join()));
});

test('STORY-008 Trust: every submission and status change is tracked in the audit log', async () => {
  const { store } = await setup();
  const blobs = memoryBlobs();
  const actor = officer(store);
  const r = await submitResponse(store, blobs, solicitation, { respondent: 'Vendor C Demo', documents: fullSet('c'), actor });
  await setResponseStatus(store, r.id, 'under evaluation', { actor });
  await assert.rejects(setResponseStatus(store, r.id, 'submitted', { actor }), /cannot move/);
  const log = trackingLog(store, r.id).map((e) => e.action);
  assert.equal(log[0], 'response submitted');
  assert.equal(log.filter((a) => a === 'submission document stored').length, solicitation.required_documents.length);
  assert.equal(log.at(-1), 'response under evaluation');
  assert.equal((await store.verifyAudit()).ok, true);
});
