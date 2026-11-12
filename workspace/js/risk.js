// STORY-010: the Risk page: run an assessment, the heat map, the register, mitigation, and risks for review.
import { h, table, section, empty } from '../../assets/js/ui.js';
import { head, when, person, badge, flash, act, field, form, button, onClick } from './common.js';
import { assess, recordMitigation, heatMap, forReview, REVIEW_DAYS } from '../../lib/risk.js';
import { verifyReport } from '../../lib/reports.js';

const LEVELS = ['high', 'medium', 'low'];

export function riskPage(page, rest, ctx) {
  const s = ctx.store;
  const cells = heatMap(s);
  const register = s.list('Risk').sort((a, b) => (b.status === 'open') - (a.status === 'open') || (b.score ?? 0) - (a.score ?? 0));
  const review = new Set(forReview(s).map((r) => r.id));
  const archived = s.list('Report', (r) => r.kind === 'risk assessment').reverse();
  const heat = h('div', { class: 'heat', role: 'table', 'aria-label': 'Open risks by likelihood and impact' },
    h('div', { class: 'heat__corner', role: 'cell' }, 'Likelihood ↓ / Impact →'),
    ...['low', 'medium', 'high'].map((i) => h('div', { class: 'heat__head', role: 'columnheader' }, i)),
    ...LEVELS.flatMap((l) => [h('div', { class: 'heat__head', role: 'rowheader' }, l), ...['low', 'medium', 'high'].map((i) => {
      const n = cells[`${l}|${i}`];
      const score = { low: 1, medium: 2, high: 3 }[l] * { low: 1, medium: 2, high: 3 }[i];
      return h('div', { class: `heat__cell heat__cell--${score >= 6 ? 'bad' : score >= 3 ? 'warn' : 'ok'}${n ? '' : ' heat__cell--empty'}`, role: 'cell' }, n ? String(n) : '·');
    })]));
  return h(
    'div',
    {},
    ...head(page, 'Risk', `An assessment reads the live system for outages, slow performance, user error, operator error and security gaps. Each finding is a risk with a score, evidence, an owner and a mitigation plan. Unmitigated risks scoring 9, or open past ${REVIEW_DAYS} days, are logged for review.`),
    flash(ctx),
    h('div', { class: 'actions' }, onClick(h('button', { type: 'button', class: 'btn' }, 'Run a risk assessment'), () => act(ctx, () => assess(s, { actor: ctx.actor }), (r) => ({ tone: r.forReview.length ? 'warn' : 'ok', title: `${r.report.id} archived: ${r.identified.length} new risk(s), ${r.mitigated.length} mitigated, ${r.forReview.length} logged for review.` })))),
    section('Heat map of open risks', heat),
    section(
      'Register',
      register.length
        ? table(['Risk', 'Category', 'Score', 'Status', 'Evidence', 'Mitigation', 'Owner'], register.map((r) => [
            [h('strong', {}, r.id), ' ', r.title, review.has(r.id) ? [' ', h('span', { class: 'pill pill--bad' }, 'for review')] : null],
            r.category,
            h('span', { class: `pill pill--${r.score >= 6 ? 'bad' : r.score >= 3 ? 'warn' : 'ok'}` }, `${r.score} · ${r.likelihood}/${r.impact}`),
            badge(r.status),
            r.evidence,
            r.status === 'open' ? [r.mitigation, form('form form--inline', [field('Action taken', h('input', { name: 'action', required: true })), h('div', { class: 'actions' }, button('Mark mitigated', 'btn btn--quiet'))], (fd) => act(ctx, () => recordMitigation(s, r.id, { actor: ctx.actor, action: fd.get('action') }), `${r.id} mitigated.`))] : r.mitigation,
            person(ctx, r.owner),
          ]), 'Every risk found, open first')
        : empty({ title: 'No risks recorded', body: 'Run an assessment; each condition it finds becomes a risk here.' }),
    ),
    section('Archived assessments', archived.length ? table(['Report', 'When', 'Found', 'For review', 'Hash'], archived.map((r) => {
      const v = h('span', { class: 'pill pill--unknown' }, '…');
      verifyReport(r).then((ok) => { v.className = `pill pill--${ok ? 'ok' : 'bad'}`; v.textContent = ok ? 'verified' : 'changed'; });
      return [r.id, `${when(r.generated_at)} by ${person(ctx, r.requested_by)}`, r.body.found.length, r.body.for_review.length, v];
    })) : empty({ title: 'No assessments yet', body: 'Each assessment is archived here with its fingerprint.' })),
  );
}
