// STORY-002: the Monitoring page: live checks, alerts and incidents, and the archive.
import { h, table, section, empty } from '../../assets/js/ui.js';
import { head, when, badge, flash, act, onClick, download } from './common.js';
import { runChecks, currentStatus, archiveBundle, DEFAULT_TARGETS, TIMEOUT_MS, RETRIES, SLOW_MS } from '../../lib/monitoring.js';


const DRILL = { component: 'Outage drill (a file that does not exist)', url: '../no-such-file.json' };
const siteTargets = () => DEFAULT_TARGETS.map((t) => ({ ...t, url: `../${t.url}` }));

export function monitoring(page, rest, ctx) {
  const s = ctx.store;
  const status = currentStatus(s);
  const incidents = s.list('Incident').reverse();
  const run = (targets, label) => () =>
    act(ctx, () => runChecks(s, targets), ({ alerts }) =>
      alerts.length ? { tone: alerts.some((a) => a.kind === 'down') ? 'bad' : 'ok', title: alerts.map((a) => a.message).join(' '), body: label } : { tone: 'ok', title: `Checked ${targets.length} target${targets.length > 1 ? 's' : ''}. No change.`, body: label },
    );
  if (ctx.autoMonitor) {
    const t = setInterval(() => runChecks(s, siteTargets()).then(() => ctx.rerender()), 60000);
    ctx.timers.add(t);
  }
  return h(
    'div',
    {},
    ...head(page, 'Monitoring', 'Continuous checks with real measurements. Each check calls its target with a time limit and one retry, records availability and response time, and raises an alert when something stops answering.'),
    h('p', { class: 'notice notice--warn', role: 'note' }, h('strong', {}, 'What is monitored here: '), 'the Command Center site itself, because CRIS is not reachable from this demo. Pointing the monitor at CRIS means changing its list of targets in ', h('code', {}, 'lib/monitoring.js'), ', nothing else.'),
    flash(ctx),
    h(
      'div',
      { class: 'actions' },
      onClick(h('button', { type: 'button', class: 'btn' }, 'Run a check now'), run(siteTargets(), 'Measured just now from this browser.')),
      onClick(h('button', { type: 'button', class: 'btn btn--quiet', 'aria-pressed': String(Boolean(ctx.autoMonitor)) }, ctx.autoMonitor ? 'Stop checking every minute' : 'Check every minute'), () => {
        ctx.autoMonitor = !ctx.autoMonitor;
        ctx.rerender();
      }),
      onClick(h('button', { type: 'button', class: 'btn btn--danger' }, 'Run the outage drill'), run([DRILL], 'The drill checks a file that does not exist, so you can see an outage raise an alert.')),
    ),
    section(
      'Now',
      status.length
        ? table(['Component', 'Status', 'Response time', 'Availability', 'Checks', 'Last checked'], status.map((c) => [c.component, c.up ? h('span', { class: 'pill pill--ok' }, 'Up') : h('span', { class: 'pill pill--bad' }, 'Down'), c.ms === null ? '—' : h('span', { class: c.slow ? 'pill pill--warn' : '' }, `${c.ms} ms`), c.availability === null ? '—' : `${Math.round(c.availability * 1000) / 10}%`, c.checks, when(c.checkedAt)]), 'Latest reading per component')
        : empty({ title: 'No checks yet', body: 'Nothing has been measured, so nothing is shown.', next: 'Press "Run a check now".' }),
      h('p', { class: 'source' }, `Time limit ${TIMEOUT_MS / 1000} s, ${RETRIES} retry; a response slower than ${SLOW_MS / 1000} s is marked.`),
    ),
    section(
      'Alerts and incidents',
      incidents.length ? table(['Incident', 'What', 'Severity', 'Status', 'Detected', 'Resolved'], incidents.map((i) => [i.id, i.title, i.severity, badge(i.status), when(i.detected_at), when(i.resolved_at)])) : empty({ title: 'No incidents', body: 'An outage opens one incident and raises an alert; recovery resolves it.' }),
    ),
    section(
      'Archive',
      h('p', {}, `${s.list('HealthSample').length} samples and ${incidents.length} incidents are kept. Samples cannot be edited once written.`),
      onClick(h('button', { type: 'button', class: 'btn btn--quiet' }, 'Download the monitoring archive'), async () => {
        const b = await archiveBundle(s);
        download(`monitoring-archive-${b.body.exported_at.slice(0, 10)}.json`, JSON.stringify({ sha256: b.hash, ...b.body }, null, 2));
      }),
    ),
  );
}


