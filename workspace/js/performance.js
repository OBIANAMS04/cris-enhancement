// STORY-014: the Performance and errors page: response-time anomalies with alerts, and user errors with suggestions.
import { h, table, section, empty } from '../../assets/js/ui.js';
import { head, when, person, badge, flash, act, onClick } from './common.js';
import { analyse, scanAnomalies, anomalyAlerts, FACTOR, MIN_BASELINE } from '../../lib/anomaly.js';
import { userErrors, errorPatterns } from '../../lib/usererrors.js';
import { runChecks, DEFAULT_TARGETS } from '../../lib/monitoring.js';

const siteTargets = () => DEFAULT_TARGETS.map((t) => ({ ...t, url: `../${t.url}` }));

export function performancePage(page, rest, ctx) {
  const s = ctx.store;
  const results = analyse(s);
  const alerts = anomalyAlerts(s).reverse();
  const errors = userErrors(s).reverse();
  const patterns = errorPatterns(s);
  return h(
    'div',
    {},
    ...head(page, 'Performance and errors', `Each component's response time is compared with its own baseline. A sample over ${FACTOR}× the baseline (and well outside its normal spread) raises an alert for investigation. Every refused action anywhere in the workspace is logged as a user error, with suggestions on what to do instead.`),
    flash(ctx),
    h('div', { class: 'actions' },
      onClick(h('button', { type: 'button', class: 'btn' }, 'Check now and scan'), () => act(ctx, async () => { await runChecks(s, siteTargets()); return scanAnomalies(s, { actor: ctx.actor }); }, (r) => ({ tone: r.raised.length ? 'bad' : 'ok', title: r.raised.length ? `${r.raised.length} anomaly alert(s) raised.` : `Scanned ${r.results.length} component(s): no anomaly.` }))),
      onClick(h('button', { type: 'button', class: 'btn btn--danger' }, 'Run the slow-response drill'), () => act(ctx, async () => {
        // The drill records one deliberately slow reading, labelled as a drill, so the alert can be seen.
        const c = results.find((x) => x.baseline)?.component ?? 'Command Center page';
        await s.insert('HealthSample', { component: c, metric: 'response time', value: 2500, unit: 'ms', observed_at: s.now().toISOString(), source: 'slow-response drill' }, { actor: ctx.actor, action: 'drill sample recorded' });
        return scanAnomalies(s, { actor: ctx.actor });
      }, (r) => ({ tone: r.raised.length ? 'bad' : 'warn', title: r.raised.length ? `ALERT: ${r.raised[0].title}` : 'No alert: the component needs a baseline first; run "Check now" a few more times.' }))),
    ),
    section('Baselines', results.length ? table(['Component', 'Latest', 'Baseline (median)', 'Alert above', 'State'], results.map((r) => [r.component, r.latest ? `${r.latest.value} ms` : '—', r.baseline ? `${r.baseline.median} ms` : '—', r.baseline ? `${r.baseline.limit} ms` : r.note, r.anomaly ? h('span', { class: 'pill pill--bad' }, 'Anomaly') : r.baseline ? h('span', { class: 'pill pill--ok' }, 'Normal') : h('span', { class: 'pill pill--unknown' }, 'No baseline')])) : empty({ title: 'No measurements yet', body: `Run "Check now" ${MIN_BASELINE + 1} times or more to build a baseline.` })),
    section('Alerts', alerts.length ? table(['Alert', 'What', 'Status', 'Raised', 'Cleared'], alerts.map((a) => [a.id, a.title, badge(a.status), when(a.detected_at), a.resolved_at ? when(a.resolved_at) : '—'])) : empty({ title: 'No alerts', body: 'An anomaly raises one alert per component until it is back to normal.' })),
    section(
      'User errors',
      patterns.length ? h('p', {}, 'Most frequent this week: ', patterns.slice(0, 4).map((p, i) => [i ? ', ' : '', `${p.where} (${p.count})`])) : null,
      errors.length ? table(['When', 'Who', 'Page', 'What went wrong', 'Suggested'], errors.slice(0, 50).map((e) => [when(e.at), person(ctx, e.actor), e.record_id, e.detail.message, (e.detail.suggestions ?? []).join(' ') || '—'])) : empty({ title: 'No user errors logged', body: 'A refused action on any page is logged here with the suggestion shown.' }),
    ),
  );
}
