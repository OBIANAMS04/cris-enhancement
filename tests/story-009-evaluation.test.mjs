// STORY-009 Evaluation: weighted scores are accurate, scoring errors are corrected, all scores are archived.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { setup } from './helpers.mjs';
import { memoryBlobs } from '../lib/documents.js';
import { submitResponse, setResponseStatus } from '../lib/submissions.js';
import { setCriteria, scoreResponse, correctScore, ranking, flaggedScores, archiveEvaluation, currentScores, EvaluationError } from '../lib/evaluation.js';
import { verifyReport } from '../lib/reports.js';

const solicitation = JSON.parse(await readFile(new URL('../content/solicitation.json', import.meta.url), 'utf8'));
const CRITERIA = [{ name: 'Technical approach', weight_pct: 40 }, { name: 'Experience', weight_pct: 30 }, { name: 'Price', weight_pct: 30 }];
const f = (who, kind) => ({ kind, file: { name: `${who}.pdf`, bytes: new TextEncoder().encode(`${who} ${kind}`) } });

async function ready() {
  const ctx = await setup();
  const { store } = ctx;
  const people = store.list('Person');
  const proc = people.find((p) => p.role === 'procurement officer').id;
  const cm = people.find((p) => p.role === 'TxDOT contract manager').id;
  const blobs = memoryBlobs();
  const ids = [];
  for (const who of ['Vendor A Demo', 'Vendor B Demo']) {
    const r = await submitResponse(store, blobs, solicitation, { respondent: who, documents: solicitation.required_documents.map((k) => f(who, k)), actor: proc });
    await setResponseStatus(store, r.id, 'under evaluation', { actor: proc });
    ids.push(r.id);
  }
  const crit = await setCriteria(store, CRITERIA, proc);
  const by = (name) => crit.find((c) => c.name === name).id;
  return { ...ctx, proc, cm, ids, by };
}
const sheet = (by, t, e, p) => ({ [by('Technical approach')]: t, [by('Experience')]: e, [by('Price')]: p });

test('STORY-009: a response is scored accurately on the weighted system', async () => {
  const { store, proc, cm, ids, by } = await ready();
  await scoreResponse(store, { response: ids[0], evaluator: proc, scores: sheet(by, 8, 6, 9) });
  await scoreResponse(store, { response: ids[0], evaluator: cm, scores: sheet(by, 6, 8, 7) });
  await scoreResponse(store, { response: ids[1], evaluator: proc, scores: sheet(by, 9, 9, 5) });
  await scoreResponse(store, { response: ids[1], evaluator: cm, scores: sheet(by, 9, 7, 5) });
  const rank = ranking(store);
  // A: 40*(7/10) + 30*(7/10) + 30*(8/10) = 28 + 21 + 24 = 73. B: 40*0.9 + 30*0.8 + 30*0.5 = 36 + 24 + 15 = 75.
  assert.deepEqual(rank.rows.map((r) => [r.respondent, r.total]), [['Vendor B Demo', 75], ['Vendor A Demo', 73]]);
  assert.equal(rank.best.respondent, 'Vendor B Demo');
});

test('STORY-009: a scoring error is corrected, and the original stays on record', async () => {
  const { store, proc, cm, ids, by } = await ready();
  await scoreResponse(store, { response: ids[0], evaluator: proc, scores: sheet(by, 8, 6, 9) });
  const typo = await scoreResponse(store, { response: ids[0], evaluator: cm, scores: sheet(by, 1, 8, 7) });
  assert.equal(flaggedScores(store).length, 2, 'a 1 against an 8: both scores of the pair are flagged for checking');
  await assert.rejects(archiveEvaluation(store, { actor: proc }), EvaluationError);
  const wrong = typo.find((s) => s.criterion === by('Technical approach'));
  await assert.rejects(correctScore(store, wrong.id, { actor: proc, score: 7, reason: 'x' }), /Only the evaluator/);
  await assert.rejects(correctScore(store, wrong.id, { actor: cm, score: 7, reason: ' ' }), /why/);
  const fixed = await correctScore(store, wrong.id, { actor: cm, score: 7, reason: 'Typed 1 instead of 7.' });
  assert.equal(fixed.corrects, wrong.id);
  assert.equal(flaggedScores(store).length, 0);
  assert.ok(store.get('EvaluationScore', wrong.id), 'the original score is kept');
  assert.equal(currentScores(store, ids[0]).find((s) => s.criterion === by('Technical approach') && s.evaluator === cm).score, 7);
  await assert.rejects(correctScore(store, wrong.id, { actor: cm, score: 6, reason: 'again' }), /already been corrected/);
});

test('STORY-009 failure paths: weights not 100, out-of-range score, missing criterion, double scoring, not under evaluation', async () => {
  const fresh = await setup();
  await assert.rejects(setCriteria(fresh.store, [{ name: 'A', weight_pct: 60 }, { name: 'B', weight_pct: 30 }], 'x'), /total 90, not 100/);
  const { store, proc, ids, by, user } = await ready();
  await assert.rejects(scoreResponse(store, { response: ids[0], evaluator: proc, scores: sheet(by, 11, 5, 5) }), (e) => /from 0 to 10/.test(e.problems.join()));
  await assert.rejects(scoreResponse(store, { response: ids[0], evaluator: proc, scores: { [by('Price')]: 5 } }), (e) => /Score Technical approach/.test(e.problems.join()));
  await assert.rejects(scoreResponse(store, { response: ids[0], evaluator: user, scores: sheet(by, 5, 5, 5) }), (e) => /Only a procurement officer/.test(e.problems.join()));
  await scoreResponse(store, { response: ids[0], evaluator: proc, scores: sheet(by, 5, 5, 5) });
  await assert.rejects(scoreResponse(store, { response: ids[0], evaluator: proc, scores: sheet(by, 6, 6, 6) }), (e) => /already scored/.test(e.problems.join()));
  await setResponseStatus(store, ids[1], 'not awarded', { actor: proc });
  await assert.rejects(scoreResponse(store, { response: ids[1], evaluator: proc, scores: sheet(by, 5, 5, 5) }), (e) => /only a response under evaluation/.test(e.problems.join()));
});

test('STORY-009 Trust: every score, including corrected ones, is archived with the ranking', async () => {
  const { store, proc, cm, ids, by } = await ready();
  for (const id of ids) for (const ev of [proc, cm]) await scoreResponse(store, { response: id, evaluator: ev, scores: sheet(by, 7, 7, 7) });
  const one = currentScores(store, ids[0])[0];
  await correctScore(store, one.id, { actor: one.evaluator, score: 8, reason: 'Re-read section 3.' });
  const rep = await archiveEvaluation(store, { actor: proc });
  assert.equal(rep.body.all_scores.length, 13, 'twelve scores plus the correction');
  assert.ok(rep.body.all_scores.some((s) => s.id === one.id));
  assert.equal(await verifyReport(rep), true);
  await assert.rejects(store.update('Report', rep.id, { kind: 'performance' }), /cannot be changed/);
  assert.ok(store.audit().some((e) => e.action === 'score corrected'));
});
