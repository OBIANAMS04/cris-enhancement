// STORY-004: Feature development: feedback, decisions, changes and their documented history.
import { h, table, section, empty } from '../../assets/js/ui.js';
import { head, when, person, badge, flash, act, field, form, button } from './common.js';
import { submitFeedback, assessFeedback, advanceFeature, changeLog, FLOW } from '../../lib/features.js';


export function features(page, rest, ctx) {
  if (rest[0]) return featurePage(page, rest[0], ctx);
  const s = ctx.store;
  const fresh = s.list('Feedback', (f) => f.status === 'new');
  const answered = s.list('Feedback', (f) => f.status !== 'new').reverse();
  const changes = s.list('FeatureChange').reverse();
  return h(
    'div',
    {},
    ...head(page, 'Feature development', 'User feedback goes in; the team decides. Feasible ideas become feature changes that are released only once someone records how they meet the need. Ideas that cannot be done are answered with the reason.'),
    flash(ctx),
    section(
      'Give feedback',
      form('form', [field('Your feedback', h('textarea', { name: 'text', required: true })), field('About', h('select', { name: 'category' }, ['general', 'crash report entry', 'reports', 'search', 'accessibility', 'performance'].map((c) => h('option', { value: c }, c)))), h('div', { class: 'actions' }, button('Send feedback'))], (fd) =>
        act(ctx, () => submitFeedback(s, { submitted_by: ctx.actor, text: fd.get('text'), category: fd.get('category') }), (f) => ({ tone: 'ok', title: `Thank you. Your feedback is ${f.id}; you will see the team's answer below.` })),
      ),
    ),
    section(
      'Waiting for a decision',
      fresh.length
        ? fresh.map((f) =>
            h(
              'div',
              { class: 'form' },
              h('p', {}, h('strong', {}, f.id), ` · ${f.category} · from ${person(ctx, f.submitted_by)}: `, f.text),
              form('form form--inline', [field('Feature title', h('input', { name: 'title', placeholder: f.text.slice(0, 60) })), field('Reason', h('input', { name: 'reason', required: true })), h('div', { class: 'actions' }, h('button', { type: 'submit', class: 'btn', name: 'choice', value: 'yes' }, 'Feasible: propose it'), h('button', { type: 'submit', class: 'btn btn--quiet', name: 'choice', value: 'no' }, 'Not feasible: answer'))], (fd) => {
                const feasible = fd.get('choice') === 'yes';
                act(ctx, () => assessFeedback(s, f.id, { actor: ctx.actor, feasible, reason: fd.get('reason'), title: fd.get('title') }), (r) => ({ tone: 'ok', title: r.change ? `${r.change.id} proposed from ${f.id}.` : `${f.id} declined; the submitter sees the reason.` }));
              }),
            ),
          )
        : empty({ title: 'Nothing waiting', body: 'New feedback appears here for the development team to decide on.' }),
    ),
    section('Feature changes', changes.length ? table(['Change', 'Title', 'From feedback', 'Status', 'Released'], changes.map((c) => [h('a', { href: `#/features/${c.id}` }, c.id), c.title, c.from_feedback ?? '—', badge(c.status), c.released_on ?? '—'])) : empty({ title: 'No feature changes yet', body: 'Feasible feedback becomes a change here.' })),
    section('Answers given', answered.length ? table(['Feedback', 'What was asked', 'Status', 'Answer'], answered.map((f) => [f.id, f.text, badge(f.status), f.response ?? '—'])) : empty({ title: 'No answers yet', body: 'Every piece of feedback gets an answer: planned, released or declined with a reason.' })),
  );
}

function featurePage(page, id, ctx) {
  const s = ctx.store;
  const c = s.get('FeatureChange', id);
  if (!c) return h('div', {}, h('h1', { tabindex: '-1' }, 'No such change'), h('p', {}, h('a', { href: '#/features' }, 'Back to Feature development'), '.'));
  const fb = c.from_feedback ? s.get('Feedback', c.from_feedback) : null;
  const next = FLOW[FLOW.indexOf(c.status) + 1];
  return h(
    'div',
    {},
    h('nav', { class: 'crumbs', 'aria-label': 'Breadcrumb' }, h('a', { href: '#/features' }, 'Feature development'), ' › ', h('span', { 'aria-current': 'page' }, id)),
    ...head(page, `${id}: ${c.title}`),
    flash(ctx),
    h('p', {}, 'Status: ', badge(c.status), ' · ', FLOW.map((step, i) => [i ? ' → ' : '', step === c.status ? h('strong', {}, step) : step])),
    fb ? h('p', {}, h('strong', {}, `From ${fb.id}: `), `"${fb.text}" (${person(ctx, fb.submitted_by)})`) : null,
    h('p', {}, h('strong', {}, 'Why: '), c.reason),
    c.need_check ? h('p', {}, h('strong', {}, 'How it meets the need: '), c.need_check) : null,
    next
      ? form('form form--inline', [next === 'released' ? field('How does it meet the feedback?', h('input', { name: 'need', required: true })) : null, h('div', { class: 'actions' }, button(`Move to ${next}`))], (fd) => act(ctx, () => advanceFeature(s, id, { actor: ctx.actor, need_check: fd.get('need') }), `${id} is now ${next}.`))
      : null,
    section('Change history', h('ol', { class: 'timeline' }, changeLog(s, id).map((e) => h('li', {}, h('div', {}, h('strong', {}, e.action)), h('div', { class: 'timeline__meta' }, `${person(ctx, e.actor)} · ${when(e.at)}`))))),
  );
}

