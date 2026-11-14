// STORY-011: the Security page: vendor clearance by cyber training, breaches from report to close, the training archive.
import { h, table, section, empty } from '../../assets/js/ui.js';
import { head, when, person, badge, flash, act, field, form, button, onClick } from './common.js';
import { vendorClearances, requireRetraining, reportBreach, containBreach, recordNotification, closeBreach, notified, breaches as listBreaches, archiveTraining, VALID_DAYS } from '../../lib/cyber.js';
import { verifyReport } from '../../lib/reports.js';

export function securityPage(page, rest, ctx) {
  const s = ctx.store;
  const clear = vendorClearances(s);
  const list = listBreaches(s).reverse();
  const archives = s.list('Report', (r) => r.spec === 'CYBER-TRAINING').reverse();
  return h(
    'div',
    {},
    ...head(page, 'Security', `Vendor staff are cleared for protected work only with the TxDOT-approved cyber security training completed in the last ${VALID_DAYS} days; without it, opening or uploading response documents is refused. Breaches are logged, contained and closed with their cause.`),
    flash(ctx),
    section('Vendor clearance', table(['Person', 'Cleared', 'Why', ''], clear.map((c) => [c.person.display_name, c.cleared ? h('span', { class: 'pill pill--ok' }, 'Cleared') : h('span', { class: 'pill pill--bad' }, 'Blocked'), c.reason, c.cleared ? onClick(h('button', { type: 'button', class: 'btn btn--quiet' }, 'Require retraining'), () => act(ctx, () => requireRetraining(s, c.person.id, { actor: ctx.actor, reason: 'Required by the security officer after a security review.' }), `${c.person.display_name} must retake the training; clearance suspended.`)) : h('a', { href: '#/training' }, 'Go to Training')])), h('p', { class: 'source' }, 'Training is taken on the Training page (course "Cyber security training"). Rule: REQ-020; Tex. Gov\'t Code §2063.104.')),
    section(
      'Report a security breach',
      form('form', [
        field('What happened', h('input', { name: 'title', required: true, placeholder: 'Phishing email opened by a vendor account' })),
        field('Details', h('textarea', { name: 'description' })),
        h('label', { class: 'check' }, h('input', { type: 'checkbox', name: 'pii', id: 'pii' }), ' Sensitive personal information may be involved'),
        h('p', { class: 'hint' }, 'If personal information is involved, notification is due within 60 days (Tex. Bus. & Com. Code §521.053).'),
        h('div', { class: 'actions' }, button('Log the breach')),
      ], (fd) => act(ctx, () => reportBreach(s, { actor: ctx.actor, title: fd.get('title'), description: fd.get('description'), personal_data: fd.get('pii') === 'on' }), (b) => ({ tone: 'warn', title: `${b.id} logged as a severity-1 security incident.`, body: b.notify_by ? `Notification due by ${b.notify_by}.` : 'No personal information: no notification deadline.' }))),
    ),
    section(
      'Breaches',
      list.length
        ? list.map((b) => h('div', { class: 'form' },
            h('p', {}, h('strong', {}, b.id), ' ', badge(b.status), ` · ${when(b.detected_at)} · `, b.title, b.notify_by ? [' · ', h('span', { class: `pill pill--${notified(s, b.id) ? 'ok' : 'warn'}` }, notified(s, b.id) ? 'notified' : `notify by ${b.notify_by}`)] : null),
            b.containment ? h('p', {}, h('strong', {}, 'Contained: '), b.containment) : null,
            b.root_cause ? h('p', {}, h('strong', {}, 'Cause: '), b.root_cause) : null,
            b.status === 'open' ? form('form form--inline', [field('Containment', h('input', { name: 'c', required: true })), h('div', { class: 'actions' }, button('Mark contained', 'btn btn--quiet'))], (fd) => act(ctx, () => containBreach(s, b.id, { actor: ctx.actor, containment: fd.get('c') }), `${b.id} contained.`)) : null,
            b.status !== 'resolved' && b.personal_data && !notified(s, b.id) ? form('form form--inline', [field('Who was notified, and when', h('input', { name: 'n', required: true })), h('div', { class: 'actions' }, button('Record notification', 'btn btn--quiet'))], (fd) => act(ctx, () => recordNotification(s, b.id, { actor: ctx.actor, details: fd.get('n') }), 'Notification recorded.')) : null,
            b.status === 'mitigated' ? form('form form--inline', [field('Cause', h('input', { name: 'r', required: true })), h('div', { class: 'actions' }, button('Close the breach', 'btn btn--quiet'))], (fd) => act(ctx, () => closeBreach(s, b.id, { actor: ctx.actor, root_cause: fd.get('r') }), `${b.id} closed.`)) : null))
        : empty({ title: 'No breaches logged', body: 'A reported breach is tracked here from logging to close.' }),
    ),
    section(
      'Training archive',
      h('div', { class: 'actions' }, onClick(h('button', { type: 'button', class: 'btn' }, 'Archive the training completions'), () => act(ctx, () => archiveTraining(s, { actor: ctx.actor }), (r) => ({ tone: 'ok', title: `${r.id} archived: ${r.body.completions.length} completion(s), version ${r.version}.` })))),
      archives.length ? table(['Report', 'Version', 'Archived', 'Completions', 'Hash'], archives.map((r) => {
        const v = h('span', { class: 'pill pill--unknown' }, '…');
        verifyReport(r).then((ok) => { v.className = `pill pill--${ok ? 'ok' : 'bad'}`; v.textContent = ok ? 'verified' : 'changed'; });
        return [r.id, r.version, `${when(r.generated_at)} by ${person(ctx, r.requested_by)}`, r.body.completions.length, v];
      })) : null,
    ),
  );
}
