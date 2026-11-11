// STORY-012: the Support dashboard: the queue against service levels, who is on duty, maintenance.
import { h, table, section, empty } from '../../assets/js/ui.js';
import { head, when, person, badge, flash, act, field, form, button, onClick } from './common.js';
import { slaState, SLA_HOURS, SLA_SOURCE } from '../../lib/sla.js';
import { supportSummary, scheduleMaintenance, completeMaintenance, overdueMaintenance, setOnDuty } from '../../lib/support.js';


export function support(page, rest, ctx) {
  const s = ctx.store;
  const sum = supportSummary(s);
  const now = s.now();
  const queue = s.list('SupportTicket', (t) => t.status === 'open' || t.status === 'in progress').sort((a, b) => a.respond_by.localeCompare(b.respond_by));
  const staff = s.list('Person', (p) => p.role === 'TxDOT staff member' || p.role === 'system administrator');
  const windows = s.list('MaintenanceWindow').sort((a, b) => a.starts_at.localeCompare(b.starts_at));
  const overdue = new Set(overdueMaintenance(s).map((w) => w.id));
  const stat = (label, value, t) => h('div', { class: `card${t ? ` card--${t}` : ''}` }, h('span', { class: 'card__label' }, label), h('span', { class: 'card__value' }, value));
  const tomorrow = new Date(now.getTime() + 24 * 3600 * 1000).toISOString().slice(0, 10);
  return h(
    'div',
    {},
    ...head(page, 'Support dashboard', 'Ongoing support and maintenance: every open ticket against its service level, who is on duty, and maintenance kept outside service hours.'),
    flash(ctx),
    h(
      'div',
      { class: 'grid grid--3' },
      stat('Open tickets', sum.open),
      stat('Breached service level', sum.breached, sum.breached ? 'warn' : null),
      stat('At risk', sum.atRisk, sum.atRisk ? 'warn' : null),
      stat('Resolved within service level', sum.metShare === null ? 'None resolved yet' : `${Math.round(sum.metShare * 100)}%`),
      stat('Support on duty', sum.onDuty, sum.onDuty ? null : 'warn'),
      stat('Maintenance overdue', sum.maintenanceOverdue, sum.maintenanceOverdue ? 'warn' : null),
    ),
    section(
      'Queue, by deadline',
      queue.length ? table(['Ticket', 'Issue', 'Priority', 'Assigned to', 'Due', 'Service level'], queue.map((t) => [h('a', { href: `#/help-desk/${t.id}` }, t.id), t.summary, t.priority, t.assigned_to ? person(ctx, t.assigned_to) : h('span', { class: 'pill pill--bad' }, 'Unassigned'), when(t.respond_by), badge(slaState(t, now))]), 'Open tickets') : empty({ title: 'Nothing open', body: 'Tickets reported on the Help desk queue here until they are resolved.' }),
    ),
    section(
      'Who is on duty',
      table(['Person', 'Role', 'On duty', ''], staff.map((p) => [p.display_name, p.role, p.on_duty ? h('span', { class: 'pill pill--ok' }, 'Yes') : 'No', onClick(h('button', { type: 'button', class: 'btn btn--quiet' }, p.on_duty ? 'Go off duty' : 'Go on duty'), () => act(ctx, () => setOnDuty(s, p.id, !p.on_duty, ctx.actor), `${p.display_name} is now ${p.on_duty ? 'off' : 'on'} duty.`))])),
      h('p', { class: 'source' }, 'New tickets go to the on-duty person with the fewest open tickets. With nobody on duty they are escalated.'),
    ),
    section(
      'Service levels',
      table(['Priority', 'First answer within'], Object.entries(SLA_HOURS).map(([p, hours]) => [p, `${hours} hours`])),
      h('p', { class: 'source' }, SLA_SOURCE),
    ),
    section(
      'Maintenance',
      form(
        'form',
        [
          field('What', h('input', { name: 'title', required: true, placeholder: 'Apply security patches' })),
          field('Component', h('input', { name: 'component', required: true, placeholder: 'Web servers' })),
          field('Starts (your local time)', h('input', { name: 'starts_at', type: 'datetime-local', required: true, value: `${tomorrow}T23:00` })),
          field('Ends (your local time)', h('input', { name: 'ends_at', type: 'datetime-local', required: true })),
          h('p', { class: 'hint' }, 'Windows must stay outside service hours (Monday to Friday, 6:00 to 20:00 Central) and may not overlap another window.'),
          h('div', { class: 'actions' }, button('Schedule')),
        ],
        (fd) => {
          const iso = (v) => (v ? new Date(v).toISOString() : '');
          act(ctx, () => scheduleMaintenance(s, { title: fd.get('title'), component: fd.get('component'), starts_at: iso(fd.get('starts_at')), ends_at: iso(fd.get('ends_at')), scheduled_by: ctx.actor }), (w) => ({ tone: 'ok', title: `${w.id} scheduled.` }));
        },
      ),
      windows.length
        ? table(['Window', 'What', 'From', 'To', 'Status', ''], windows.map((w) => [w.id, `${w.title} (${w.component})`, when(w.starts_at), when(w.ends_at), overdue.has(w.id) ? badge('breached') : badge(w.status), w.status === 'scheduled' ? onClick(h('button', { type: 'button', class: 'btn btn--quiet' }, 'Mark done'), () => act(ctx, () => completeMaintenance(s, w.id, { actor: ctx.actor }), `${w.id} completed.`)) : when(w.completed_at)]), 'Maintenance windows')
        : empty({ title: 'No maintenance scheduled', body: 'Windows scheduled above appear here; one past its end and not done shows as overdue.' }),
    ),
  );
}

