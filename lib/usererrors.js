// STORY-014 (part 2): user errors. When an action in the workspace is refused because of something the user did, the
// refusal is logged as a user error, and the user is given corrective suggestions: concrete next steps worked out from
// the data where possible (the next maintenance window outside service hours, a report period that has data, the
// documents still missing), not generic advice. Every user error and the suggestions given are in the audit log.
import { windowProblems } from './support.js';

const DAY = 86400000;

/** Next window of the same length that passes the maintenance rules, searching nightly from 22:00 Central. */
export function nextMaintenanceSlot(store, hours = 2) {
  const existing = store.list('MaintenanceWindow');
  const now = store.now();
  for (let d = 0; d < 14; d++) {
    for (const utcHour of [4, 5, 6, 7, 8, 9]) {
      const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + d, utcHour));
      if (start <= now) continue;
      const end = new Date(start.getTime() + hours * 3600000);
      if (!windowProblems({ starts_at: start.toISOString(), ends_at: end.toISOString() }, existing, now).length) return { starts_at: start.toISOString(), ends_at: end.toISOString() };
    }
  }
  return null;
}

/** The days that have monitoring samples, newest first. */
export function daysWithData(store) {
  return [...new Set(store.list('HealthSample').map((s) => s.observed_at.slice(0, 10)))].sort().reverse();
}

/** Suggestions for an error, keyed on what went wrong. Each rule returns zero or more plain sentences. */
const RULES = [
  [/overlaps service hours/i, (s) => {
    const slot = nextMaintenanceSlot(s);
    return slot ? [`Book it outside service hours, for example ${slot.starts_at.slice(0, 16).replace('T', ' ')} to ${slot.ends_at.slice(11, 16)} UTC (overnight Central time), which passes every rule.`] : ['Book it on a weekend or between 20:00 and 06:00 Central.'];
  }],
  [/overlaps MW-/i, () => ['Pick a time after the other window ends, or move that window.']],
  [/No monitoring samples|monitoring samples between/i, (s) => {
    const days = daysWithData(s);
    return days.length ? [`Choose a period that includes a day with data: ${days.slice(0, 3).join(', ')}.`] : ['Run a check on the Monitoring page first; a report needs recorded data.'];
  }],
  [/Missing required document: ([^.;]+)/i, (s, m, all) => [`Attach the missing documents: ${[...all.matchAll(/Missing required document: ([^.;]+)/gi)].map((x) => x[1]).join(', ')}.`]],
  [/closed at|late submissions/i, () => ['The solicitation has closed; a late response cannot be accepted. Record it as received late outside the system if TxDOT policy allows.']],
  [/from 0 to 10/i, () => ['Enter each score as a number from 0 to 10; half points are allowed.']],
  [/not passed yet|Answer every question/i, () => ['Re-read the materials listed on the session page, then take the check again; attempts are not limited.']],
  [/Say in a few words what is wrong|Say what/i, () => ['Write one short sentence, for example "Crash report form will not submit".']],
  [/cyber security training (has not|expired)|not completed the TxDOT-approved/i, () => ['Complete the cyber security course on the Training page; access returns as soon as the knowledge check is passed.']],
  [/Access refused/i, () => ['Ask a compliance officer, procurement officer or the contract manager to open it for you.']],
  [/already/i, () => ['It has already been done; refresh the page to see its current state.']],
  [/not connected/i, () => ['This needs a TxDOT system that is not connected to this build; record the request and the cause on the error so it can be addressed.']],
];

export function suggestionsFor(store, message, problems = []) {
  const all = [message, ...problems].join(' ');
  const out = [];
  for (const [re, fn] of RULES) {
    const m = all.match(re);
    if (m) for (const s of fn(store, m, all)) if (!out.includes(s)) out.push(s);
  }
  return out;
}

/** Log a user error with its suggestions. Returns the suggestions to show. */
export async function recordUserError(store, { actor, where, message, problems = [] }) {
  const suggestions = suggestionsFor(store, message, problems);
  await store.log('user error', { actor: actor ?? 'unknown', entity: 'Workspace', record_id: where || '(page)', detail: { message, problems, suggestions } });
  return suggestions;
}

export const userErrors = (store) => store.audit().filter((e) => e.action === 'user error');
export const errorPatterns = (store, sinceDays = 7) => {
  const since = new Date(store.now().getTime() - sinceDays * DAY).toISOString();
  const counts = {};
  for (const e of userErrors(store).filter((x) => x.at >= since)) counts[e.record_id] = (counts[e.record_id] ?? 0) + 1;
  return Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([where, count]) => ({ where, count }));
};
