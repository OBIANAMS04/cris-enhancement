// STORY-005: the Training page: schedule sessions, mark them held with a recording, take the knowledge check.
import { h, table, section, empty } from '../../assets/js/ui.js';
import { head, when, person, badge, flash, act, field, form, button } from './common.js';
import { scheduleSession, holdSession, takeCheck, sessionProgress, completions, courseById } from '../../lib/training.js';
import { submitFeedback } from '../../lib/features.js';

const missing = (ctx) => !ctx.materials || ctx.materials.error;

export function training(page, rest, ctx) {
  if (missing(ctx)) return h('div', {}, ...head(page, 'Training'), h('div', { class: 'notice notice--bad', role: 'alert' }, 'The training materials (content/training-materials.json) could not be read: ', ctx.materials?.error ?? 'missing', '. Nothing can be scheduled until they are.'));
  if (rest[0]) return sessionPage(page, rest[0], ctx);
  const s = ctx.store;
  const sessions = s.list('TrainingSession').sort((a, b) => b.scheduled_at.localeCompare(a.scheduled_at));
  const done = completions(s);
  const tomorrow = new Date(s.now().getTime() + 86400000).toISOString().slice(0, 10);
  const features = s.list('FeatureChange');
  const vendors = s.list('Person', (p) => p.organization === 'vendor');
  return h(
    'div',
    {},
    ...head(page, 'Training', 'Sessions on new functionality and the cyber security programme. Staff complete a session by passing its short knowledge check, live or from the recording, so completion means they understood it.'),
    flash(ctx),
    h('div', { class: 'grid grid--3' },
      h('div', { class: 'card' }, h('span', { class: 'card__label' }, 'Sessions held'), h('span', { class: 'card__value' }, sessions.filter((x) => x.status === 'held').length)),
      h('div', { class: 'card' }, h('span', { class: 'card__label' }, 'Completions logged'), h('span', { class: 'card__value' }, done.length)),
      h('div', { class: `card${vendors.some((p) => !p.cyber_training_completed_on) ? ' card--warn' : ''}` }, h('span', { class: 'card__label' }, 'Vendor staff with cyber training'), h('span', { class: 'card__value' }, `${vendors.filter((p) => p.cyber_training_completed_on).length} of ${vendors.length}`)),
    ),
    section(
      'Schedule a session',
      form(
        'form',
        [
          field('Course', h('select', { name: 'course' }, ctx.materials.courses.map((c) => h('option', { value: c.id }, `${c.title} (${c.kind})`)))),
          field('When (your local time)', h('input', { name: 'when', type: 'datetime-local', required: true, value: `${tomorrow}T10:00` })),
          field('Teaches feature change', h('select', { name: 'feature' }, [h('option', { value: '' }, 'None'), ...features.map((f) => h('option', { value: f.id }, `${f.id} ${f.title} (${f.status})`))]), 'Optional: link the session to the new feature it covers.'),
          h('p', { class: 'hint' }, `The trainer is the person you are acting as: ${person(ctx, ctx.actor)}.`),
          h('div', { class: 'actions' }, button('Schedule')),
        ],
        (fd) => act(ctx, () => scheduleSession(s, ctx.materials, { course: fd.get('course'), scheduled_at: fd.get('when') ? new Date(fd.get('when')).toISOString() : '', trainer: ctx.actor, feature: fd.get('feature') }), (x) => ({ tone: 'ok', title: `${x.id} scheduled.` })),
      ),
    ),
    section('Sessions', sessions.length ? table(['Session', 'Course', 'When', 'Status', 'Recording', 'Completed by'], sessions.map((x) => [h('a', { href: `#/training/${x.id}` }, x.id), x.title, when(x.scheduled_at), badge(x.status), x.recording_reference ?? '—', done.filter((d) => d.session === x.id).length])) : empty({ title: 'No sessions yet', body: 'Scheduled sessions appear here.' })),
  );
}

function sessionPage(page, id, ctx) {
  const s = ctx.store;
  const x = s.get('TrainingSession', id);
  if (!x) return h('div', {}, h('h1', { tabindex: '-1' }, 'No such session'), h('p', {}, h('a', { href: '#/training' }, 'Back to Training'), '.'));
  const course = courseById(ctx.materials, x.materials_reference);
  const progress = sessionProgress(s, id);
  const parts = [];
  if (x.status === 'scheduled') {
    parts.push(section('Mark it held', form('form form--inline', [field('Where the recording is kept', h('input', { name: 'rec', required: true, placeholder: 'recordings/2026-11-12-help-desk.mp4' })), h('div', { class: 'actions' }, button('Mark held'))], (fd) => act(ctx, () => holdSession(s, id, { actor: ctx.actor, recording_reference: fd.get('rec') }), `${id} held; the recording is available to anyone who missed it.`))));
  }
  if (x.status === 'held' && course) {
    parts.push(section(
      `Knowledge check for ${person(ctx, ctx.actor)}`,
      form('form', [
        field('How did you take part?', h('select', { name: 'via' }, h('option', { value: 'live' }, 'I attended live'), h('option', { value: 'recording' }, `I watched the recording (${x.recording_reference})`))),
        ...course.questions.map((q, i) => h('fieldset', { class: 'field' }, h('legend', {}, `${i + 1}. ${q.q}`), q.options.map((o, j) => h('label', {}, h('input', { type: 'radio', name: `q${i}`, value: String(j) }), ' ', o)))),
        h('div', { class: 'actions' }, button('Submit answers')),
      ], (fd) => act(ctx, () => takeCheck(s, ctx.materials, { session: id, person: ctx.actor, via: fd.get('via'), answers: course.questions.map((_, i) => fd.get(`q${i}`)) }), (r) => ({ tone: r.passed ? 'ok' : 'warn', title: r.passed ? `Passed with ${Math.round(r.score * 100)}%. Training completed and logged.` : `${Math.round(r.score * 100)}%: not passed yet (80% needed). Review the materials and try again; the attempt is logged.` }))),
    ));
    parts.push(section('How was it?', form('form form--inline', [field('Feedback on this session', h('input', { name: 'text', required: true })), h('div', { class: 'actions' }, button('Send', 'btn btn--quiet'))], (fd) => act(ctx, () => submitFeedback(s, { submitted_by: ctx.actor, text: `${id}: ${fd.get('text')}`, category: 'training' }), (f) => ({ tone: 'ok', title: `Thank you; logged as ${f.id}. The team answers it on Feature development.` })))));
  }
  return h(
    'div',
    {},
    h('nav', { class: 'crumbs', 'aria-label': 'Breadcrumb' }, h('a', { href: '#/training' }, 'Training'), ' › ', h('span', { 'aria-current': 'page' }, id)),
    ...head(page, `${id}: ${x.title}`, `${when(x.scheduled_at)} with ${person(ctx, x.trainer)}.`),
    flash(ctx),
    h('p', {}, 'Status: ', badge(x.status), x.recording_reference ? ` · Recording: ${x.recording_reference}` : '', x.feature ? ` · Teaches ${x.feature}` : ''),
    course ? section('Materials', h('ol', {}, course.materials.map((m) => h('li', {}, m)))) : h('p', { class: 'notice notice--bad' }, 'The materials for this course are missing.'),
    ...parts,
    section('Who has completed it', table(['Person', 'Completed', 'How', 'Score', 'Attempts'], progress.map((p) => [p.person.display_name, p.completion ? h('span', { class: 'pill pill--ok' }, p.completion.completed_on) : 'Not yet', p.completion?.via ?? '—', p.completion ? `${Math.round(p.completion.score * 100)}%` : '—', p.attempts]))),
  );
}
