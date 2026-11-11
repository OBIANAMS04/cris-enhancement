// The Knowledge base question panel. It answers only from the data on this page and names the tab each answer came
// from. There is no model behind it and no key: a static page cannot keep one. A question it cannot match to the
// data gets "I can't answer that from this project's data" rather than a guess.
import { storyRows, formatDate } from './data.js';

const words = (s) => (s.toLowerCase().match(/[a-z0-9]+/g) ?? []).filter((w) => w.length > 2 && !STOP.has(w));
const STOP = new Set(['the', 'and', 'for', 'what', 'which', 'who', 'how', 'are', 'does', 'this', 'that', 'with', 'from', 'about', 'any', 'there', 'tell', 'show', 'have', 'has', 'will', 'can', 'its', 'system', 'project']);

export function answer(question, data, notes = []) {
  const q = question.trim();
  if (!q) return null;
  const plan = data.plan;
  const progress = data.progress;
  if (!plan || !progress) return { text: 'The plan files could not be read, so there is nothing to answer from.', sources: [] };
  const lower = q.toLowerCase();
  const rows = storyRows(plan, progress);
  const t = progress.totals ?? {};

  const reqId = lower.match(/req-?\s?(\d{3})/);
  if (reqId) {
    const id = `REQ-${reqId[1]}`;
    const r = (plan.requirements ?? []).find((x) => x.id === id);
    if (!r) return { text: `${id} is not in the plan.`, sources: [['Knowledge base', 'knowledge/requirements']] };
    const by = r.fulfilled_by?.length ? `It is covered by ${r.fulfilled_by.join(', ')}.` : 'No story covers it yet.';
    return { text: `${id} (${r.kind}, ${r.priority}): ${r.statement} ${by}`, sources: [['Knowledge base', `knowledge/req/${id}`]] };
  }
  const storyId = lower.match(/story-?\s?(\d{3})/);
  if (storyId) {
    const id = `STORY-${storyId[1]}`;
    const row = rows.find((x) => x.id === id);
    if (!row) return { text: `${id} is not in the plan or progress files.`, sources: [] };
    const state = row.state ? row.state.replace('_', ' ') : 'not checked yet';
    return { text: `${id}${row.title ? ` is "${row.title}"` : ''}, in release ${row.release ?? 'none'}, owned by ${row.owner ?? 'no named owner'}. State: ${state}. Due: ${formatDate(row.due_on) ?? 'no date in the plan'}.`, sources: [['Project management', `project/story/${id}`]] };
  }
  if (/how many|count|number of/.test(lower)) {
    if (/requirement/.test(lower)) return { text: `The plan has ${(plan.requirements ?? []).length} requirements.`, sources: [['Knowledge base', 'knowledge/requirements']] };
    if (/stor/.test(lower)) return { text: `${t.stories_verified ?? 0} of ${t.stories_total ?? rows.length} stories are verified.`, sources: [['Overview', 'overview/stories']] };
    if (/release/.test(lower)) return { text: `The plan has ${(plan.releases ?? []).length} releases.`, sources: [['Project management', 'project']] };
    if (/criteri/.test(lower)) return { text: `${t.criteria_passed ?? 0} of ${t.criteria_total ?? 0} acceptance criteria have passed.`, sources: [['Overview', 'overview/criteria']] };
  }
  if (/demo day|deadline|due date|when (is|does)|schedule|ship/.test(lower)) {
    const d = plan.schedule?.demo_day;
    return { text: d ? `Demo day is ${formatDate(d)}.` : 'The plan file holds no schedule yet, so demo day and the due dates are not on this page.', sources: [['Project management', 'project/schedule']] };
  }
  if (/guardrail|never|safe|must not/.test(lower)) {
    const g = plan.derived?.guardrails ?? [];
    return { text: g.length ? `The guardrails are: ${g.map((x) => `${x.id}, ${x.statement}`).join(' ')}` : 'The plan has no guardrails.', sources: [['Guardrails', 'guardrails']] };
  }
  if (/system|integrat|connect/.test(lower)) {
    const sys = plan.derived?.systems ?? [];
    return { text: sys.length ? `The plan names ${sys.join(' and ')}. None reports a connection status yet, so all show "not checked from here".` : 'The plan names no outside systems.', sources: [['Systems', 'systems']] };
  }
  if (/role|user|who uses|for whom/.test(lower)) {
    return { text: `The roles in the plan are: ${(plan.derived?.roles ?? []).join(', ')}.`, sources: [['Users and use case', 'users']] };
  }
  if (/owner|who owns|team|agent/.test(lower)) {
    const owners = [...new Set((plan.stories ?? []).map((s) => s.owner_agent).filter(Boolean))];
    return { text: `The plan has ${(plan.agents ?? []).length} scoped agents. Stories are owned by: ${owners.join(', ')}.`, sources: [['AI agents', 'agents']] };
  }
  if (/measure|kpi|metric|target|outcome/.test(lower)) {
    const m = plan.derived?.measures ?? [];
    return { text: m.length ? `The measures are: ${m.map((x) => x.statement).join(' ')}` : 'The plan carries no measures yet, so there is no target to report.', sources: [['Outcomes', 'outcomes']] };
  }

  // Fall back to matching words against requirements, stories and notes.
  const qw = new Set(words(q));
  if (!qw.size) return { text: "I can't answer that from this project's data.", sources: [] };
  const score = (text) => words(text).filter((w) => qw.has(w)).length;
  const hits = [
    ...(plan.requirements ?? []).map((r) => ({ s: score(r.statement), text: `${r.id}: ${r.statement}`, src: ['Knowledge base', `knowledge/req/${r.id}`] })),
    ...(plan.stories ?? []).map((st) => ({ s: score(`${st.title} ${st.narrative}`), text: `${st.id}, ${st.title}: ${st.narrative}`, src: ['Project management', `project/story/${st.id}`] })),
    ...notes.map((n) => ({ s: score(`${n.title} ${n.text}`), text: `${n.title}: ${n.text}`, src: ['Knowledge base', 'knowledge/notes'] })),
  ]
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, 3);
  if (!hits.length) return { text: "I can't answer that from this project's data.", sources: [] };
  return { text: hits.map((x) => x.text).join('\n'), sources: hits.map((x) => x.src) };
}
