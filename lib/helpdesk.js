// STORY-001: the Help Desk Support module. A TxDOT user reports an issue and gets assistance straight away:
// a logged ticket with a reference, a deadline, a named person (or an escalation if nobody is on duty), and the help
// articles that match what they wrote. They can check its status, and see it resolved; if the fix did not work they
// reopen it. Every step is a TicketEvent and an audit line, written together with the ticket or not at all.
import { respondBy, pickAssignee } from './sla.js';

export class HelpDeskError extends Error {
  constructor(message, problems = []) {
    super(message);
    this.name = 'HelpDeskError';
    this.problems = problems;
  }
}

const PRIORITIES = ['low', 'normal', 'high', 'urgent'];
const words = (s) => String(s ?? '').toLowerCase().match(/[a-z0-9]+/g) ?? [];

/** Help articles whose keywords appear in the report, best match first. */
export function suggestArticles(articles, text, limit = 3) {
  const said = new Set(words(text));
  return (articles ?? [])
    .map((a) => ({ a, score: a.keywords.filter((k) => words(k).every((w) => said.has(w))).length }))
    .filter((x) => x.score > 0)
    .sort((x, y) => y.score - x.score || x.a.id.localeCompare(y.a.id))
    .slice(0, limit)
    .map((x) => x.a);
}

/**
 * Report an issue. `key` makes it safe to submit twice (a double click, a retried request): the second call returns
 * the first ticket. Returns { ticket, assistance }.
 */
export async function reportIssue(store, { reporter, summary, details = '', category = '', priority = 'normal', key }, articles = []) {
  const problems = [];
  if (!reporter || !store.get('Person', reporter)) problems.push('Choose who is reporting the issue.');
  if (!String(summary ?? '').trim()) problems.push('Say in a few words what is wrong.');
  if (!PRIORITIES.includes(priority)) problems.push(`Priority must be one of: ${PRIORITIES.join(', ')}.`);
  if (problems.length) throw new HelpDeskError('The issue was not reported.', problems);

  const ticket = await store.transaction(async (tx) => {
    if (key && tx.seen(key)) return tx.get('SupportTicket', tx.recall(key).id);
    const opened_at = store.now().toISOString();
    const assignee = pickAssignee(tx.list('Person'), tx.list('SupportTicket'));
    const t = await tx.insert(
      'SupportTicket',
      { reported_by: reporter, assigned_to: assignee?.id, summary: summary.trim(), details: details.trim() || undefined, category: category || undefined, priority, status: 'open', opened_at, respond_by: respondBy(priority, opened_at) },
      { actor: reporter, action: 'issue reported' },
    );
    await tx.insert('TicketEvent', { ticket: t.id, actor: reporter, action: 'reported', at: opened_at, note: summary.trim() }, { actor: reporter, action: 'ticket event' });
    const found = suggestArticles(articles, `${summary} ${details} ${category}`);
    const note = [
      assignee ? `Assigned to ${assignee.display_name}.` : 'Nobody is on duty: escalated to the support lead.',
      `First response due by ${t.respond_by}.`,
      found.length ? `Suggested help: ${found.map((a) => a.id).join(', ')}.` : 'No help article matched; a person will reply.',
    ].join(' ');
    await tx.insert('TicketEvent', { ticket: t.id, actor: assignee?.id ?? reporter, action: assignee ? 'assistance given' : 'escalated', at: opened_at, note }, { actor: 'help desk', action: 'ticket event' });
    if (key) tx.remember(key, 'SupportTicket', t.id);
    return t;
  });

  return { ticket, assistance: assistanceFor(store, ticket, articles) };
}

/** What the user is told: who has it, by when, and what to try now. */
export function assistanceFor(store, ticket, articles = []) {
  const who = ticket.assigned_to ? store.get('Person', ticket.assigned_to) : null;
  return {
    reference: ticket.id,
    assignedTo: who?.display_name ?? null,
    escalated: !who,
    respondBy: ticket.respond_by,
    articles: suggestArticles(articles, `${ticket.summary} ${ticket.details ?? ''} ${ticket.category ?? ''}`),
  };
}

/** The status a user sees, with the ticket's history in order. */
export function ticketStatus(store, id) {
  const ticket = store.get('SupportTicket', id);
  if (!ticket) return null;
  const history = store.list('TicketEvent', (e) => e.ticket === id).sort((a, b) => a.at.localeCompare(b.at) || a.id.localeCompare(b.id));
  return { ticket, history };
}

async function move(store, id, { actor, to, action, note, extra = {} }) {
  return store.transaction(async (tx) => {
    const t = tx.get('SupportTicket', id);
    if (!t) throw new HelpDeskError(`Ticket ${id} does not exist.`);
    if (!tx.get('Person', actor)) throw new HelpDeskError('Choose who is acting on the ticket.');
    const at = store.now().toISOString();
    const updated = await tx.update('SupportTicket', id, { status: to, ...extra }, { actor, action: `ticket ${action}` });
    await tx.insert('TicketEvent', { ticket: id, actor, action, at, note }, { actor, action: 'ticket event' });
    return updated;
  });
}

export async function startWork(store, id, { actor, note }) {
  const t = store.get('SupportTicket', id);
  if (t && t.status !== 'open') throw new HelpDeskError(`Ticket ${id} is ${t.status}, not open.`);
  return move(store, id, { actor, to: 'in progress', action: 'work started', note, extra: t?.assigned_to ? {} : { assigned_to: actor } });
}

export async function resolveTicket(store, id, { actor, resolution }) {
  const t = store.get('SupportTicket', id);
  if (!t) throw new HelpDeskError(`Ticket ${id} does not exist.`);
  if (t.status === 'resolved' || t.status === 'closed') throw new HelpDeskError(`Ticket ${id} is already ${t.status}.`);
  if (!String(resolution ?? '').trim()) throw new HelpDeskError('Say what fixed it, so the user and the audit can see.');
  return move(store, id, { actor, to: 'resolved', action: 'resolved', note: resolution.trim(), extra: { resolution: resolution.trim(), resolved_at: store.now().toISOString() } });
}

/** The fix did not work: the user reopens the ticket, and it goes back in the queue with its history kept. */
export async function reopenTicket(store, id, { actor, reason }) {
  const t = store.get('SupportTicket', id);
  if (!t) throw new HelpDeskError(`Ticket ${id} does not exist.`);
  if (t.status !== 'resolved') throw new HelpDeskError(`Only a resolved ticket can be reopened; ${id} is ${t.status}.`);
  if (!String(reason ?? '').trim()) throw new HelpDeskError('Say what is still wrong.');
  const opened_at = store.now().toISOString();
  return move(store, id, { actor, to: 'open', action: 'reopened', note: reason.trim(), extra: { resolved_at: undefined, resolution: undefined, respond_by: respondBy(t.priority, opened_at) } });
}

export async function closeTicket(store, id, { actor }) {
  const t = store.get('SupportTicket', id);
  if (t && t.status !== 'resolved') throw new HelpDeskError(`Only a resolved ticket can be closed; ${id} is ${t.status}.`);
  return move(store, id, { actor, to: 'closed', action: 'closed', note: 'Closed after resolution.' });
}
