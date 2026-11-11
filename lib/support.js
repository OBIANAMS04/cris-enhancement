// STORY-012: ongoing technical support and maintenance. Who is on duty, maintenance windows that stay outside
// service hours, and the numbers on the Support dashboard. Service levels themselves are in lib/sla.js.
import { slaState } from './sla.js';

/** Service hours, in Central time: maintenance may not touch them. */
export const SERVICE_HOURS = { zone: 'America/Chicago', days: [1, 2, 3, 4, 5], from: 6, to: 20 };
export const MAX_WINDOW_HOURS = 12;
const HOUR = 3600 * 1000;

function centralParts(date) {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: SERVICE_HOURS.zone, weekday: 'short', hour: 'numeric', hourCycle: 'h23' }).formatToParts(date);
  const wd = parts.find((p) => p.type === 'weekday').value;
  const hour = Number(parts.find((p) => p.type === 'hour').value);
  return { day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(wd), hour };
}

export function inServiceHours(date) {
  const { day, hour } = centralParts(date);
  return SERVICE_HOURS.days.includes(day) && hour >= SERVICE_HOURS.from && hour < SERVICE_HOURS.to;
}

/** Problems with a proposed window; an empty list means it can be scheduled. */
export function windowProblems({ starts_at, ends_at }, existing = [], now = new Date()) {
  const start = Date.parse(starts_at);
  const end = Date.parse(ends_at);
  if (Number.isNaN(start) || Number.isNaN(end)) return ['Both a start and an end are needed.'];
  const problems = [];
  if (end <= start) problems.push('The window must end after it starts.');
  if (end - start > MAX_WINDOW_HOURS * HOUR) problems.push(`A window may last at most ${MAX_WINDOW_HOURS} hours.`);
  if (start < now.getTime()) problems.push('The window starts in the past.');
  if (!problems.length) {
    for (let t = start; t < end; t += 15 * 60 * 1000) {
      if (inServiceHours(new Date(t))) {
        problems.push('It overlaps service hours (Monday to Friday, 6:00 to 20:00 Central), so users would be disrupted.');
        break;
      }
    }
  }
  const clash = existing.find((w) => w.status === 'scheduled' && Date.parse(w.starts_at) < end && start < Date.parse(w.ends_at));
  if (clash) problems.push(`It overlaps ${clash.id} (${clash.title}).`);
  return problems;
}

export class SupportError extends Error {
  constructor(message, problems = []) {
    super(message);
    this.name = 'SupportError';
    this.problems = problems;
  }
}

export async function scheduleMaintenance(store, { title, component, starts_at, ends_at, scheduled_by, key }) {
  const problems = windowProblems({ starts_at, ends_at }, store.list('MaintenanceWindow'), store.now());
  if (problems.length) throw new SupportError('This maintenance window cannot be scheduled.', problems);
  return store.insert('MaintenanceWindow', { title, component, starts_at, ends_at, status: 'scheduled', scheduled_by }, { actor: scheduled_by, action: 'maintenance scheduled', key });
}

/** Mark a window done. Finishing after its end is allowed but recorded as late, so it shows on the dashboard. */
export async function completeMaintenance(store, id, { actor, notes }) {
  const w = store.get('MaintenanceWindow', id);
  if (!w) throw new SupportError(`${id} does not exist.`);
  if (w.status !== 'scheduled') throw new SupportError(`${id} is already ${w.status}.`);
  const at = store.now().toISOString();
  const late = Date.parse(at) > Date.parse(w.ends_at);
  return store.update('MaintenanceWindow', id, { status: 'completed', completed_at: at, notes: notes || (late ? 'Completed after the window closed.' : undefined) }, { actor, action: late ? 'maintenance completed late' : 'maintenance completed' });
}

/** Windows past their end and still not completed: the "maintenance not completed on time" failure path. */
export const overdueMaintenance = (store) => store.list('MaintenanceWindow', (w) => w.status === 'scheduled' && Date.parse(w.ends_at) < store.now().getTime());

export async function setOnDuty(store, personId, onDuty, actor) {
  return store.update('Person', personId, { on_duty: Boolean(onDuty) }, { actor, action: onDuty ? 'went on duty' : 'went off duty' });
}

/** The numbers on the Support dashboard, all counted from the store. */
export function supportSummary(store) {
  const now = store.now();
  const tickets = store.list('SupportTicket');
  const states = tickets.map((t) => slaState(t, now));
  const count = (s) => states.filter((x) => x === s).length;
  const decided = count('met') + count('missed');
  return {
    open: tickets.filter((t) => t.status === 'open' || t.status === 'in progress').length,
    unassigned: tickets.filter((t) => (t.status === 'open' || t.status === 'in progress') && !t.assigned_to).length,
    breached: count('breached'),
    atRisk: count('at risk'),
    met: count('met'),
    missed: count('missed'),
    metShare: decided ? count('met') / decided : null,
    onDuty: store.list('Person', (p) => p.on_duty === true).length,
    maintenanceScheduled: store.list('MaintenanceWindow', (w) => w.status === 'scheduled').length,
    maintenanceOverdue: overdueMaintenance(store).length,
  };
}
