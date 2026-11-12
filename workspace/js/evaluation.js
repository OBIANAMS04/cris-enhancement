// STORY-009: the Evaluation page: weighted criteria, score sheets, flagged scores and corrections, ranking, archive.
import { h, table, section, empty } from '../../assets/js/ui.js';
import { head, when, person, badge, flash, act, field, form, button, onClick } from './common.js';
import { setCriteria, scoreResponse, correctScore, ranking, flaggedScores, archiveEvaluation, currentScores, SCALE, OUTLIER_GAP } from '../../lib/evaluation.js';
import { verifyReport } from '../../lib/reports.js';

function criteriaSource(ctx) {
  const c = ctx.procurement?.suggested_demo_criteria;
  return Array.isArray(c) && c.length ? { list: c, note: ctx.procurement.note } : null;
}

export function evaluationPage(page, rest, ctx) {
  const s = ctx.store;
  const src = criteriaSource(ctx);
  if (!src) return h('div', {}, ...head(page, 'Evaluation'), h('div', { class: 'notice notice--bad', role: 'alert' }, 'The evaluation criteria (content/procurement-rules.json) could not be read, so nothing can be scored.'));
  if (!s.list('ScoringCriterion').length) {
    setCriteria(s, src.list, ctx.actor).then(() => ctx.rerender(), (err) => { ctx.flash = { tone: 'bad', title: err.message }; ctx.rerender(); });
    return h('div', {}, ...head(page, 'Evaluation'), h('p', { role: 'status' }, 'Setting the scoring criteria…'));
  }
  const criteria = s.list('ScoringCriterion');
  const rank = ranking(s);
  const flags = flaggedScores(s);
  const open = s.list('SolicitationResponse', (r) => r.status === 'under evaluation');
  const mine = (rid) => currentScores(s, rid).some((x) => x.evaluator === ctx.actor);
  const archived = s.list('Report', (r) => r.spec === 'EVALUATION').reverse();
  const max = Math.max(1, ...rank.rows.map((r) => r.total));
  return h(
    'div',
    {},
    ...head(page, 'Evaluation', `Responses scored on weighted criteria. Each evaluator scores each criterion from ${SCALE.min} to ${SCALE.max}; a response's score is the sum of weight × mean score ÷ ${SCALE.max}, out of 100. Corrections never overwrite: every score stays on record.`),
    h('p', { class: 'notice notice--warn', role: 'note' }, h('strong', {}, 'Criteria: '), src.note),
    flash(ctx),
    section('Criteria', table(['Criterion', 'Weight', 'Basis'], criteria.map((c) => [c.name, `${c.weight}%`, c.description ?? '—']), `Weights total ${criteria.reduce((a, c) => a + c.weight, 0)}`)),
    section(
      'Ranking',
      rank.rows.length
        ? h('div', { class: 'bars' }, rank.rows.map((r) => {
            const fill = h('span', { class: `bar__fill${r === rank.best ? '' : ' bar__fill--muted'}` });
            fill.style.width = `${(r.total / max) * 100}%`;
            return h('div', { class: 'bar' }, h('span', {}, h('a', { href: `#/submissions/${r.response}` }, r.respondent), r === rank.best ? ' ★ best value' : ''), h('span', { class: 'bar__track', role: 'img', 'aria-label': `${r.respondent}: ${r.total} of 100` }, fill), h('span', {}, r.complete ? `${r.total} / 100` : `${r.total} (incomplete)`));
          }))
        : empty({ title: 'Nothing under evaluation', body: 'Move a response to "under evaluation" on the Submissions page to score it.' }),
      rank.tie ? h('p', { class: 'notice notice--warn' }, 'The top two are tied; the evaluation committee decides.') : null,
    ),
    section(
      `Score sheets for ${person(ctx, ctx.actor)}`,
      open.length
        ? open.map((r) => mine(r.id)
            ? h('p', {}, `${r.id} ${r.respondent}: scored.`)
            : form('form', [h('p', {}, h('strong', {}, `${r.id} ${r.respondent}`)), ...criteria.map((c) => field(`${c.name} (${c.weight}%)`, h('input', { name: c.id, type: 'number', min: SCALE.min, max: SCALE.max, step: '0.5', required: true }))), h('div', { class: 'actions' }, button('Record scores'))], (fd) => act(ctx, () => scoreResponse(s, { response: r.id, evaluator: ctx.actor, scores: Object.fromEntries(criteria.map((c) => [c.id, fd.get(c.id)])) }), `Scores recorded for ${r.respondent}.`)))
        : empty({ title: 'Nothing to score', body: 'Responses under evaluation appear here.' }),
    ),
    section(
      'Scores to check',
      flags.length
        ? flags.map((x) => h('div', { class: 'form' }, h('p', {}, h('span', { class: 'pill pill--warn' }, `${x.score}`), ` ${x.id}: ${s.get('ScoringCriterion', x.criterion)?.name} for ${s.get('SolicitationResponse', x.response)?.respondent}, by ${person(ctx, x.evaluator)}; more than ${OUTLIER_GAP} points from the other evaluators.`), x.evaluator === ctx.actor ? form('form form--inline', [field('Corrected score', h('input', { name: 'score', type: 'number', min: SCALE.min, max: SCALE.max, step: '0.5', required: true })), field('Why', h('input', { name: 'reason', required: true })), h('div', { class: 'actions' }, button('Correct', 'btn btn--quiet'))], (fd) => act(ctx, () => correctScore(s, x.id, { actor: ctx.actor, score: fd.get('score'), reason: fd.get('reason') }), `${x.id} corrected; the original stays on record.`)) : h('p', { class: 'muted' }, 'Only the evaluator who gave it can correct it.')))
        : h('p', {}, 'No score stands out from the other evaluators.'),
    ),
    section(
      'Archive',
      h('div', { class: 'actions' }, onClick(h('button', { type: 'button', class: 'btn' }, 'Archive the evaluation'), () => act(ctx, () => archiveEvaluation(s, { actor: ctx.actor, acknowledgeFlags: false }), (rep) => ({ tone: 'ok', title: `${rep.id} archived: ranking and all ${rep.body.all_scores.length} scores.`, body: rep.body.best_value ? `Best value: ${rep.body.best_value}.` : 'No single best value (tie).' })))),
      archived.length ? table(['Report', 'Archived', 'Best value', 'Scores', 'Hash'], archived.map((r) => {
        const v = h('span', { class: 'pill pill--unknown' }, '…');
        verifyReport(r).then((ok) => { v.className = `pill pill--${ok ? 'ok' : 'bad'}`; v.textContent = ok ? 'verified' : 'changed'; });
        return [r.id, when(r.generated_at), r.body.best_value ?? 'tie', r.body.all_scores.length, v];
      })) : null,
    ),
  );
}
