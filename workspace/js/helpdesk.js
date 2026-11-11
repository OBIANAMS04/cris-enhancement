// STORY-001: the Help desk page and the page of one ticket.
import { h, table, section, empty } from '../../assets/js/ui.js';
import { head, when, person, badge, flash, act, field, form, button, onClick } from './common.js';
import { reportIssue, ticketStatus, startWork, resolveTicket, reopenTicket, closeTicket } from '../../lib/helpdesk.js';
import { slaState, SLA_HOURS, SLA_SOURCE } from '../../lib/sla.js';


export function helpDesk(page, rest, ctx) {
  if (rest[0]) return ticketPage(page, rest[0], ctx);
  const s = ctx.store;
  const formKey = `report-${Date.now()}`;
  const mine = s.list('SupportTicket', (t) => t.reported_by === ctx.actor).reverse();
  const lookup = h('input', { name: 'ref', placeholder: 'TKT-0001', autocomplete: 'off' });
  return h(
    'div',
    {},
    ...head(page, 'Help desk', 'Report a problem with CRIS and get help straight away: a reference, who has it, when they will answer, and what you can try now.'),
    flash(ctx),
    ctx.lastAssistance ? assistancePanel(ctx) : null,
    section(
      'Report an issue',
      form(
        'form',
        [
          field('What is wrong?', h('input', { name: 'summary', required: true, maxlength: 140 }), 'A few words, for example "Crash report will not submit".'),
          field('Details', h('textarea', { name: 'details' }), 'What you were doing, what you saw. Optional.'),
          field('Area', h('select', { name: 'category' }, ['', 'Signing in', 'Crash report entry', 'Report copies', 'Queries and reports', 'Data export', 'Accessibility', 'Other'].map((c) => h('option', { value: c }, c || 'Choose one (optional)')))),
          field('How urgent?', h('select', { name: 'priority' }, ['low', 'normal', 'high', 'urgent'].map((p) => h('option', { value: p, selected: p === 'normal' }, `${p} (answer within ${SLA_HOURS[p]} h)`))), SLA_SOURCE),
          h('div', { class: 'actions' }, button('Report the issue')),
        ],
        (fd) =>
          act(
            ctx,
            () => reportIssue(s, { reporter: ctx.actor, summary: fd.get('summary'), details: fd.get('details'), category: fd.get('category'), priority: fd.get('priority'), key: formKey }, ctx.articles),
            ({ ticket, assistance }) => {
              ctx.lastAssistance = assistance;
              return { tone: 'ok', title: `Issue reported as ${ticket.id}.` };
            },
          ),
      ),
    ),
    section(
      'Check a ticket',
      form('form form--inline', [field('Ticket reference', lookup), h('div', { class: 'actions' }, button('Check status', 'btn btn--quiet'))], (fd) => {
        const ref = String(fd.get('ref') ?? '').trim().toUpperCase();
        if (s.get('SupportTicket', ref)) location.hash = `#/help-desk/${ref}`;
        else act(ctx, async () => {
          throw new Error(`No ticket ${ref || 'with that reference'}. References look like TKT-0001.`);
        });
      }),
    ),
    section(
      `Tickets reported by ${person(ctx, ctx.actor)}`,
      mine.length
        ? table(['Reference', 'Issue', 'Status', 'Opened'], mine.map((t) => [h('a', { href: `#/help-desk/${t.id}` }, t.id), t.summary, badge(t.status), when(t.opened_at)]), 'Your tickets, newest first')
        : empty({ title: 'No tickets yet', body: 'Issues this person reports appear here with their status.' }),
    ),
  );
}

function assistancePanel(ctx) {
  const a = ctx.lastAssistance;
  ctx.lastAssistance = null;
  return h(
    'section',
    { class: 'block notice notice--ok', 'aria-labelledby': 'help-now' },
    h('h2', { id: 'help-now' }, `Help for ${a.reference}`),
    h('p', {}, a.escalated ? 'Nobody in support is on duty right now, so your issue has gone to the support lead.' : `${a.assignedTo} has your issue.`, ` You will hear back by ${when(a.respondBy)}.`),
    a.articles.length
      ? [h('p', {}, h('strong', {}, 'While you wait, try this:')), h('ul', {}, a.articles.map((art) => h('li', {}, h('strong', {}, art.title), ': ', art.steps.join(' '))))]
      : h('p', {}, 'No help article matches this, so a person will reply.'),
    h('p', {}, h('a', { href: `#/help-desk/${a.reference}` }, `Follow ${a.reference}`)),
  );
}

function ticketPage(page, id, ctx) {
  const s = ctx.store;
  const st = ticketStatus(s, id);
  if (!st) return h('div', {}, h('h1', { tabindex: '-1' }, 'No such ticket'), h('p', {}, `There is no ticket ${id}. `, h('a', { href: '#/help-desk' }, 'Back to the Help desk'), '.'));
  const t = st.ticket;
  const sla = slaState(t, s.now());
  const controls = [];
  if (t.status === 'open') controls.push(onClick(h('button', { type: 'button', class: 'btn btn--quiet' }, 'Start work'), () => act(ctx, () => startWork(s, id, { actor: ctx.actor, note: 'Work started.' }), 'Work started.')));
  if (t.status === 'open' || t.status === 'in progress') {
    controls.push(form('form form--inline', [field('What fixed it?', h('input', { name: 'resolution', required: true })), h('div', { class: 'actions' }, button('Mark resolved'))], (fd) => act(ctx, () => resolveTicket(s, id, { actor: ctx.actor, resolution: fd.get('resolution') }), `${id} resolved.`)));
  }
  if (t.status === 'resolved') {
    controls.push(form('form form--inline', [field('Not fixed? Say what is still wrong', h('input', { name: 'reason', required: true })), h('div', { class: 'actions' }, button('Reopen', 'btn btn--quiet'))], (fd) => act(ctx, () => reopenTicket(s, id, { actor: ctx.actor, reason: fd.get('reason') }), `${id} reopened and back in the queue.`)));
    controls.push(onClick(h('button', { type: 'button', class: 'btn' }, 'Close the ticket'), () => act(ctx, () => closeTicket(s, id, { actor: ctx.actor }), `${id} closed.`)));
  }
  return h(
    'div',
    {},
    h('nav', { class: 'crumbs', 'aria-label': 'Breadcrumb' }, h('a', { href: '#/help-desk' }, 'Help desk'), ' › ', h('span', { 'aria-current': 'page' }, id)),
    ...head(page, `${id}: ${t.summary}`),
    flash(ctx),
    h('p', { class: 'status-line', role: 'status' }, 'Status: ', badge(t.status), ' · Service level: ', badge(sla), ` · Answer due ${when(t.respond_by)}`),
    table(['Reported by', 'Assigned to', 'Priority', 'Opened', 'Resolved'], [[person(ctx, t.reported_by), t.assigned_to ? person(ctx, t.assigned_to) : 'Escalated: nobody on duty', t.priority, when(t.opened_at), when(t.resolved_at)]]),
    t.resolution ? h('p', {}, h('strong', {}, 'Resolution: '), t.resolution) : null,
    t.details ? h('p', {}, h('strong', {}, 'Details: '), t.details) : null,
    section('History', h('ol', { class: 'timeline' }, st.history.map((e) => h('li', {}, h('div', {}, h('strong', {}, e.action), e.note ? ` · ${e.note}` : ''), h('div', { class: 'timeline__meta' }, `${person(ctx, e.actor)} · ${when(e.at)}`))))),
    controls.length ? section('Act on it', h('div', { class: 'block' }, controls)) : null,
    h('p', { class: 'source' }, 'Each step above is also a line in the ', h('a', { href: `#/audit/${id}` }, 'audit log'), '.'),
  );
}

