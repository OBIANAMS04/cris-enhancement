// STORY-003: performance reports. A report is computed from what the store holds for the period asked for
// (monitoring samples, incidents and help desk tickets), so it reflects current performance. If the period has no
// monitoring data the report is refused with an error that says what is missing; nothing is guessed. Every report is
// archived: stored once, never changed, with the SHA-256 of its body so a later copy can be checked against it.
import { sha256 } from './store.js';
import { slaState } from './sla.js';

export class ReportError extends Error {
  constructor(message, missing = []) {
    super(message);
    this.name = 'ReportError';
    this.missing = missing;
  }
}

const inPeriod = (iso, start, end) => iso && iso >= start && iso <= end;
const pct = (n) => (n === null ? null : Math.round(n * 1000) / 10);

export function percentile(values, p) {
  if (!values.length) return null;
  const sorted = values.slice().sort((a, b) => a - b);
  const i = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
  return sorted[i];
}

/** Turn "2026-11-01" .. "2026-11-11" into an inclusive ISO range. */
export function periodRange(period_start, period_end) {
  const start = `${period_start}T00:00:00.000Z`;
  const end = `${period_end}T23:59:59.999Z`;
  if (Number.isNaN(Date.parse(start)) || Number.isNaN(Date.parse(end))) throw new ReportError('Choose a start date and an end date.', ['period']);
  if (end < start) throw new ReportError('The period ends before it starts.', ['period']);
  return { start, end };
}

/** Compute the figures. Throws ReportError when there is nothing to report on. */
export function computePerformance(store, { period_start, period_end }) {
  const { start, end } = periodRange(period_start, period_end);
  const samples = store.list('HealthSample', (s) => inPeriod(s.observed_at, start, end));
  const avail = samples.filter((s) => s.metric === 'availability');
  const times = samples.filter((s) => s.metric === 'response time').map((s) => s.value);
  const missing = [];
  if (!avail.length) missing.push('monitoring samples');
  if (missing.length) throw new ReportError(`No ${missing.join(' or ')} between ${period_start} and ${period_end}. Run the monitor first, or choose a period it covers.`, missing);

  const components = [...new Set(avail.map((s) => s.component))].map((component) => {
    const a = avail.filter((s) => s.component === component);
    const t = samples.filter((s) => s.component === component && s.metric === 'response time').map((s) => s.value);
    return { component, checks: a.length, availability_pct: pct(a.filter((s) => s.value === 1).length / a.length), p50_ms: percentile(t, 50), p95_ms: percentile(t, 95) };
  });
  const incidents = store.list('Incident', (i) => inPeriod(i.detected_at, start, end));
  const tickets = store.list('SupportTicket', (t) => inPeriod(t.opened_at, start, end));
  const now = store.now();
  const sla = tickets.map((t) => slaState(t, now));
  const decided = sla.filter((s) => s === 'met' || s === 'missed').length;
  const resolved = tickets.filter((t) => t.resolved_at);
  const hours = resolved.map((t) => (Date.parse(t.resolved_at) - Date.parse(t.opened_at)) / 3600000);

  return {
    period: { start: period_start, end: period_end },
    availability_pct: pct(avail.filter((s) => s.value === 1).length / avail.length),
    checks: avail.length,
    response_ms: { p50: percentile(times, 50), p95: percentile(times, 95), samples: times.length },
    components,
    incidents: { opened: incidents.length, resolved: incidents.filter((i) => i.status === 'resolved').length, open: incidents.filter((i) => i.status !== 'resolved').map((i) => i.id) },
    help_desk: {
      opened: tickets.length,
      resolved: resolved.length,
      sla_met_pct: decided ? pct(sla.filter((s) => s === 'met').length / decided) : null,
      mean_hours_to_resolve: hours.length ? Math.round((hours.reduce((a, b) => a + b, 0) / hours.length) * 10) / 10 : null,
    },
  };
}

/** Generate and archive a performance report. Returns the stored Report record. */
export async function generatePerformanceReport(store, { period_start, period_end, requested_by, key }) {
  if (!requested_by || !store.get('Person', requested_by)) throw new ReportError('Choose who is requesting the report.', ['requested_by']);
  const figures = computePerformance(store, { period_start, period_end });
  const generated_at = store.now().toISOString();
  const body = { title: `CRIS performance report, ${period_start} to ${period_end}`, generated_at, figures, data_note: 'Computed from the workspace store at the moment of generation.' };
  const content_hash = await sha256(JSON.stringify(body));
  return store.insert('Report', { kind: 'performance', period_start, period_end, requested_by, generated_at, file_reference: `sha256:${content_hash}`, content_hash, body }, { actor: requested_by, action: 'report generated and archived', key, detail: { period_start, period_end, content_hash } });
}

/** Check an archived report still matches the hash it was archived with. */
export async function verifyReport(report) {
  return (await sha256(JSON.stringify(report.body))) === report.content_hash;
}
