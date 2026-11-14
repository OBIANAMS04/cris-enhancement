// STORY-014 (part 1): performance anomalies. Each component's response times are compared with its own recent
// baseline (the median of its earlier samples and their median absolute deviation). A sample far outside the baseline
// is an anomaly: it raises an alert as an incident for investigation (one open alert per component), and is logged.
// A component back within its baseline at the next scan has its alert resolved. Too few samples means no baseline yet,
// and the scan says so rather than guessing.
export const MIN_BASELINE = 5;
export const FACTOR = 3; // a sample over 3x the median ...
export const MAD_K = 6; // ... and over median + 6 MADs is an anomaly
export const FLOOR_MS = 50; // differences under 50 ms are noise
const component = (c) => `Anomaly: ${c}`;

const median = (xs) => {
  const s = xs.slice().sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

/** Per component: the baseline from earlier samples and whether the latest is an anomaly. */
export function analyse(store) {
  const samples = store.list('HealthSample', (s) => s.metric === 'response time');
  const comps = [...new Set(samples.map((s) => s.component))];
  return comps.map((c) => {
    const mine = samples.filter((s) => s.component === c).sort((a, b) => a.observed_at.localeCompare(b.observed_at) || a.id.localeCompare(b.id));
    const latest = mine.at(-1);
    const earlier = mine.slice(0, -1).slice(-30).map((s) => s.value);
    if (earlier.length < MIN_BASELINE) return { component: c, latest, baseline: null, anomaly: false, note: `${earlier.length} earlier samples; ${MIN_BASELINE} needed for a baseline.` };
    const med = median(earlier);
    const mad = median(earlier.map((v) => Math.abs(v - med))) || 1;
    const limit = Math.max(med * FACTOR, med + MAD_K * mad, med + FLOOR_MS);
    return { component: c, latest, baseline: { median: med, mad, limit: Math.round(limit) }, anomaly: latest.value > limit, note: null };
  });
}

/** Scan and act: open an alert for each new anomaly, resolve alerts for components back to normal. */
export async function scanAnomalies(store, { actor = 'anomaly monitor' } = {}) {
  const results = analyse(store);
  const raised = [];
  const cleared = [];
  await store.transaction(async (tx) => {
    for (const r of results) {
      const open = tx.list('Incident', (i) => i.component === component(r.component) && i.status !== 'resolved')[0];
      if (r.anomaly && !open) {
        raised.push(await tx.insert('Incident', { title: `Response time anomaly on ${r.component}: ${r.latest.value} ms against a baseline of ${r.baseline.median} ms (limit ${r.baseline.limit} ms)`, severity: '3', status: 'open', detected_at: store.now().toISOString(), component: component(r.component) }, { actor, action: 'performance anomaly alert', detail: { sample: r.latest.id, baseline: r.baseline } }));
      } else if (r.anomaly && open) {
        await tx.log('performance anomaly continues', { actor, entity: 'Incident', record_id: open.id, detail: { sample: r.latest.id, value: r.latest.value } });
      } else if (!r.anomaly && r.baseline && open) {
        cleared.push(await tx.update('Incident', open.id, { status: 'resolved', resolved_at: store.now().toISOString(), root_cause: `Back within baseline: ${r.latest.value} ms.` }, { actor, action: 'performance anomaly cleared' }));
      }
    }
  });
  return { results, raised, cleared };
}

export const anomalyAlerts = (store) => store.list('Incident', (i) => String(i.component ?? '').startsWith('Anomaly: '));
