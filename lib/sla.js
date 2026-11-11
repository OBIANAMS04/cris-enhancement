// Service levels for help desk tickets: when a first answer is due, where a ticket stands against it, and who takes
// a new ticket. Used by the Help desk (STORY-001) to tell the user when they will hear back.
//
// The numbers below are a proposal for TxDOT to confirm, not a TxDOT figure: the plan states no service levels.
// They live in one place so the confirmed values replace them in one edit.

export const SLA_HOURS = { urgent: 4, high: 8, normal: 24, low: 72 };
export const SLA_SOURCE = 'Proposed service levels, to be confirmed with TxDOT; the plan does not set them.';

const HOUR = 3600 * 1000;

export function respondBy(priority, openedAt) {
  const hours = SLA_HOURS[priority];
  if (!hours) throw new Error(`No service level for priority "${priority}".`);
  return new Date(Date.parse(openedAt) + hours * HOUR).toISOString();
}

/**
 * Where a ticket stands against its service level at `now`:
 * met (resolved in time), missed (resolved late), breached (open past the deadline),
 * at risk (open, in the last quarter of its time), on track.
 */
export function slaState(ticket, now) {
  if (!ticket.respond_by) return 'no deadline';
  const due = Date.parse(ticket.respond_by);
  const done = ticket.status === 'resolved' || ticket.status === 'closed';
  if (done) return Date.parse(ticket.resolved_at ?? ticket.respond_by) <= due ? 'met' : 'missed';
  const t = now.getTime();
  if (t > due) return 'breached';
  const total = due - Date.parse(ticket.opened_at);
  return due - t <= total / 4 ? 'at risk' : 'on track';
}

/** Pick who takes a new ticket: the on-duty support person with the fewest open tickets. Null if nobody is on duty. */
export function pickAssignee(people, tickets) {
  const support = people.filter((p) => p.on_duty === true && (p.role === 'TxDOT staff member' || p.role === 'system administrator'));
  if (!support.length) return null;
  const load = (id) => tickets.filter((t) => t.assigned_to === id && (t.status === 'open' || t.status === 'in progress')).length;
  return support.slice().sort((a, b) => load(a.id) - load(b.id) || a.id.localeCompare(b.id))[0];
}

