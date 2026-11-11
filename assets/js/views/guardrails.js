// Tab 4, Guardrails: what must never happen, and whether anything in the build enforces it yet.
// Source: plan.derived.guardrails, plan.requirements[].fulfilled_by, and each story's verification state.
import { h, card, empty, section, source, pill } from '../ui.js';
import { tabHead, subPage, notFound, model, storiesTable, storyPage, isBuilt } from './common.js';

function standing(req, byId) {
  const ids = req?.fulfilled_by ?? [];
  if (!ids.length) return { tone: 'not_started', label: 'No story enforces it', text: 'No story in the plan is set to enforce this promise. That is a gap in the plan.' };
  if (isBuilt(req, byId)) return { tone: 'verified', label: 'Enforced', text: `Every story that enforces it (${ids.join(', ')}) is verified.` };
  return { tone: 'not_started', label: 'Promise not yet kept', text: `This is a promise the project has made and not yet kept: ${ids.join(', ')} ${ids.length === 1 ? 'is' : 'are'} not verified.` };
}

export function renderGuardrails(tab, data, ctx, rest) {
  const plan = data.plan;
  const guardrails = plan?.derived?.guardrails ?? [];
  const { rows, byId } = model(data);
  const reqById = new Map((plan?.requirements ?? []).map((r) => [r.id, r]));
  const [kind, id] = rest;

  if (kind === 'story') {
    const row = byId.get(id);
    return row ? storyPage(tab, row, plan) : notFound(tab, `story/${id}`);
  }
  if (kind === 'guardrail') {
    const g = guardrails.find((x) => x.id === id);
    if (!g) return notFound(tab, `guardrail/${id}`);
    const req = reqById.get(g.id);
    const st = standing(req, byId);
    const enforcing = rows.filter((r) => (req?.fulfilled_by ?? []).includes(r.id));
    return subPage(
      tab,
      `${g.id} · Guardrail`,
      h('p', { class: 'lede' }, g.statement),
      h('p', {}, pill(st.label, st.tone), ' ', st.text),
      enforcing.length ? storiesTable(tab, enforcing, 'The stories that enforce it') : empty({ title: 'No story is set to enforce this', next: 'A story that enforces it is added to the plan.' }),
      req?.cluster ? h('p', { class: 'source' }, `Part of "${req.cluster}" in the plan.`) : null,
    );
  }
  if (kind) return notFound(tab, rest.join('/'));

  return h(
    'div',
    {},
    ...tabHead(tab, 'The promises this system makes: what must never happen. Each one shows whether anything in the build enforces it yet.'),
    guardrails.length
      ? section(
          `Guardrails (${guardrails.length})`,
          h(
            'div',
            { class: 'grid grid--2' },
            guardrails.map((g) => {
              const st = standing(reqById.get(g.id), byId);
              return card({ to: `guardrails/guardrail/${g.id}`, label: g.id, value: st.label, note: g.statement, tone: st.tone === 'verified' ? null : 'empty', wide: true });
            }),
          ),
        )
      : empty({
          title: 'The plan has no guardrails',
          body: 'Guardrails are the plan’s SAFE requirements: what the system must never do. A plan without any is worth fixing before building further.',
          next: 'Safety requirements are added to the plan and synced.',
        }),
    source('.colaberry/plan.json → derived.guardrails and requirements[].fulfilled_by; .colaberry/progress.json → verification.state'),
  );
}
