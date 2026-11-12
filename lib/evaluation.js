// STORY-009: evaluate and score responses on a weighted scoring system. Criteria carry weights that must total 100.
// Each evaluator scores each criterion from 0 to 10. A response's weighted score is the sum over criteria of
// weight × (mean evaluator score / 10), so it runs from 0 to 100; the best value offer is the highest. Scores are never
// edited: a correction is a new score that names the one it replaces and the reason, so every score ever given stays
// archived. A score far from the other evaluators' scores is flagged for checking. The final ranking is archived as a
// report with its SHA-256, for transparency.
import { sha256 } from './store.js';

export class EvaluationError extends Error {
  constructor(message, problems = []) {
    super(message);
    this.name = 'EvaluationError';
    this.problems = problems;
  }
}

export const SCALE = { min: 0, max: 10 };
export const OUTLIER_GAP = 4;
const EVALUATORS = new Set(['procurement officer', 'TxDOT contract manager', 'TxDOT manager']);

/** Load the criteria once. Refused unless the weights total exactly 100. */
export async function setCriteria(store, criteria, actor) {
  const total = criteria.reduce((s, c) => s + Number(c.weight_pct ?? c.weight), 0);
  if (Math.round(total * 100) / 100 !== 100) throw new EvaluationError(`The weights total ${total}, not 100. Fix the criteria before scoring.`);
  if (store.list('ScoringCriterion').length) return store.list('ScoringCriterion');
  for (const c of criteria) await store.insert('ScoringCriterion', { name: c.name, weight: Number(c.weight_pct ?? c.weight), description: c.basis ?? c.description }, { actor, action: 'scoring criterion set', key: `criterion:${c.name}` });
  return store.list('ScoringCriterion');
}

/** The scores that count: for each evaluator and criterion, the latest one (a correction replaces what it corrects). */
export function currentScores(store, responseId) {
  const all = store.list('EvaluationScore', (s) => !responseId || s.response === responseId);
  const replaced = new Set(all.map((s) => s.corrects).filter(Boolean));
  return all.filter((s) => !replaced.has(s.id));
}

export async function scoreResponse(store, { response, evaluator, scores }) {
  const r = store.get('SolicitationResponse', response);
  const problems = [];
  if (!r) problems.push(`Response ${response} does not exist.`);
  else if (r.status !== 'under evaluation') problems.push(`${response} is ${r.status}; only a response under evaluation can be scored.`);
  if (!EVALUATORS.has(store.get('Person', evaluator)?.role)) problems.push('Only a procurement officer, the contract manager or a TxDOT manager can evaluate.');
  const criteria = store.list('ScoringCriterion');
  if (!criteria.length) problems.push('No scoring criteria are set.');
  for (const c of criteria) {
    const v = scores?.[c.id];
    if (v === undefined || v === null || v === '') problems.push(`Score ${c.name}.`);
    else if (!Number.isFinite(Number(v)) || Number(v) < SCALE.min || Number(v) > SCALE.max) problems.push(`${c.name}: a score must be from ${SCALE.min} to ${SCALE.max}.`);
  }
  if (r && currentScores(store, response).some((s) => s.evaluator === evaluator)) problems.push('This evaluator has already scored this response; correct a score instead.');
  if (problems.length) throw new EvaluationError('The scores were not recorded.', problems);
  return store.transaction(async (tx) => {
    const out = [];
    for (const c of criteria) out.push(await tx.insert('EvaluationScore', { response, criterion: c.id, evaluator, score: Number(scores[c.id]), scored_at: store.now().toISOString() }, { actor: evaluator, action: 'score recorded' }));
    return out;
  });
}

/** Correct a score: a new score that names the old one and why. The old one stays archived. */
export async function correctScore(store, scoreId, { actor, score, reason }) {
  const old = store.get('EvaluationScore', scoreId);
  if (!old) throw new EvaluationError(`Score ${scoreId} does not exist.`);
  if (store.list('EvaluationScore', (s) => s.corrects === scoreId).length) throw new EvaluationError(`${scoreId} has already been corrected.`);
  if (actor !== old.evaluator) throw new EvaluationError('Only the evaluator who gave a score can correct it.');
  if (!Number.isFinite(Number(score)) || Number(score) < SCALE.min || Number(score) > SCALE.max) throw new EvaluationError(`A score must be from ${SCALE.min} to ${SCALE.max}.`);
  if (!String(reason ?? '').trim()) throw new EvaluationError('Say why the score is being corrected.');
  return store.insert('EvaluationScore', { response: old.response, criterion: old.criterion, evaluator: old.evaluator, score: Number(score), scored_at: store.now().toISOString(), corrects: scoreId, reason: reason.trim(), comment: old.comment }, { actor, action: 'score corrected', detail: { corrects: scoreId, from: old.score, to: Number(score), reason } });
}

/** Scores more than OUTLIER_GAP away from the mean of the other evaluators on the same criterion and response. */
export function flaggedScores(store) {
  const cur = currentScores(store);
  return cur.filter((s) => {
    const others = cur.filter((o) => o.response === s.response && o.criterion === s.criterion && o.evaluator !== s.evaluator);
    if (!others.length) return false;
    const mean = others.reduce((a, o) => a + o.score, 0) / others.length;
    return Math.abs(s.score - mean) > OUTLIER_GAP;
  });
}

/** Weighted score per response (0 to 100), complete only when every criterion has at least one score. */
export function ranking(store) {
  const criteria = store.list('ScoringCriterion');
  const responses = store.list('SolicitationResponse', (r) => r.status === 'under evaluation' || r.status === 'awarded' || r.status === 'not awarded');
  const rows = responses.map((r) => {
    const cur = currentScores(store, r.id);
    const evaluators = new Set(cur.map((s) => s.evaluator));
    let total = 0;
    let complete = criteria.length > 0;
    const by = criteria.map((c) => {
      const mine = cur.filter((s) => s.criterion === c.id);
      if (!mine.length) complete = false;
      const mean = mine.length ? mine.reduce((a, s) => a + s.score, 0) / mine.length : null;
      const points = mean === null ? 0 : (c.weight * mean) / SCALE.max;
      total += points;
      return { criterion: c.name, weight: c.weight, mean: mean === null ? null : Math.round(mean * 100) / 100, points: Math.round(points * 100) / 100 };
    });
    return { response: r.id, respondent: r.respondent, status: r.status, evaluators: evaluators.size, complete, total: Math.round(total * 100) / 100, by };
  });
  rows.sort((a, b) => b.total - a.total || a.respondent.localeCompare(b.respondent));
  const top = rows.filter((x) => x.complete);
  const tie = top.length > 1 && top[0].total === top[1].total;
  return { rows, best: top.length && !tie ? top[0] : null, tie };
}

/** Archive the ranking with every score behind it. Refused while a response is unscored or a flagged score is unchecked. */
export async function archiveEvaluation(store, { actor, acknowledgeFlags = false }) {
  const rank = ranking(store);
  const problems = [];
  if (!rank.rows.length) problems.push('No response is under evaluation.');
  for (const r of rank.rows) if (!r.complete) problems.push(`${r.respondent} is not fully scored.`);
  const flags = flaggedScores(store);
  if (flags.length && !acknowledgeFlags) problems.push(`${flags.length} score(s) differ from the other evaluators by more than ${OUTLIER_GAP} points; correct them or confirm they stand.`);
  if (problems.length) throw new EvaluationError('The evaluation cannot be archived yet.', problems);
  const generated_at = store.now().toISOString();
  const body = { title: 'Evaluation and ranking of responses', generated_at, method: `Weighted score = sum of weight x (mean evaluator score / ${SCALE.max}); scale ${SCALE.min}-${SCALE.max}; weights total 100.`, criteria: store.list('ScoringCriterion'), ranking: rank.rows, best_value: rank.best?.respondent ?? null, tie: rank.tie, all_scores: store.list('EvaluationScore'), flagged_confirmed: flags.map((f) => f.id) };
  const content_hash = await sha256(JSON.stringify(body));
  const day = generated_at.slice(0, 10);
  return store.insert('Report', { kind: 'contract-specified', spec: 'EVALUATION', period_start: day, period_end: day, requested_by: actor, generated_at, file_reference: `sha256:${content_hash}`, content_hash, body }, { actor, action: 'evaluation archived', detail: { content_hash, best_value: body.best_value } });
}
