// Tab 7, AI agents. Source: plan.agents[] (the design of each agent) and plan.stories[].owner_agent.
// No agent has run, so there is no run history, last-run time or success rate anywhere in the files. Each card says
// "No runs recorded" rather than a zero, which would read as an agent that ran and failed.
// When the plan has no scoped agents, the tab is built from who owns each story, and says those are owners.
import { h, card, empty, section, source, table } from '../ui.js';
import { tabHead, subPage, notFound, slug, model, storiesTable, storyPage } from './common.js';

const list = (items, none) => (items?.length ? h('ul', {}, items.map((x) => h('li', {}, typeof x === 'string' ? x : JSON.stringify(x)))) : h('p', { class: 'muted' }, none));

export function renderAgents(tab, data, ctx, rest) {
  const plan = data.plan;
  const agents = plan?.agents ?? [];
  const { rows, byId } = model(data);
  const owners = [...new Set((plan?.stories ?? []).map((s) => s.owner_agent).filter(Boolean))];
  const ownedBy = (name) => rows.filter((r) => r.owner === name);
  const byAutonomy = plan?.derived?.counts?.agents_by_autonomy ?? {};
  const [kind, id] = rest;

  if (kind === 'story') {
    const row = byId.get(id);
    return row ? storyPage(tab, row, plan) : notFound(tab, `story/${id}`);
  }
  if (kind === 'agent') {
    const a = agents.find((x) => (x.id ?? slug(x.name)) === id);
    if (!a) return notFound(tab, `agent/${id}`);
    return subPage(
      tab,
      a.name,
      h('p', { class: 'lede' }, a.purpose ?? 'No purpose stated in the plan.'),
      h('dl', { class: 'facts' }, h('dt', {}, 'Trigger'), h('dd', {}, [a.trigger_type, a.trigger].filter(Boolean).join(': ') || 'Not stated'), h('dt', {}, 'Autonomy'), h('dd', {}, a.autonomy_level ?? 'Not stated'), h('dt', {}, 'Runs'), h('dd', {}, 'No runs recorded')),
      h('h2', {}, 'Inputs'), list(a.inputs, 'None listed.'),
      h('h2', {}, 'Outputs'), list(a.outputs, 'None listed.'),
      h('h2', {}, 'Approval gates'), list(a.approval_gates, 'None listed.'),
      h('h2', {}, 'Escalation rules'), list(a.escalation_rules, 'None listed.'),
      h('h2', {}, 'Skills'), list(a.skills, 'No skills registered yet.'),
      storiesTable(tab, rows.filter((r) => (a.owns ?? []).includes(r.id)), 'Stories it owns'),
    );
  }
  if (kind === 'owner') {
    const name = owners.find((o) => slug(o) === id);
    if (!name) return notFound(tab, `owner/${id}`);
    return subPage(
      tab,
      name,
      h('p', { class: 'lede' }, 'An owner named in the plan. This is a team or job title, not a scoped AI agent.'),
      h('dl', { class: 'facts' }, h('dt', {}, 'Skills'), h('dd', {}, 'No skills registered yet'), h('dt', {}, 'Runs'), h('dd', {}, 'No runs recorded'), h('dt', {}, 'Design'), h('dd', {}, 'No agent has been scoped for this work yet.')),
      storiesTable(tab, ownedBy(name), 'Stories it owns'),
    );
  }
  if (kind) return notFound(tab, rest.join('/'));

  const counts = Object.entries(byAutonomy);
  return h(
    'div',
    {},
    ...tabHead(tab, 'The agents that will do the work, and what each owns. No agent has run yet, so nothing here reports runs.'),
    agents.length
      ? section(
          `Agents (${agents.length})`,
          counts.length ? table(['Autonomy level', 'Agents'], counts.map(([k, v]) => [k, String(v)]), 'Roster by autonomy') : null,
          h('div', { class: 'grid grid--2' }, agents.map((a) => card({ to: `agents/agent/${a.id ?? slug(a.name)}`, label: a.autonomy_level ?? 'Agent', value: a.name, note: `${a.purpose ?? ''} No runs recorded. ${a.skills?.length ? `${a.skills.length} skills.` : 'No skills registered yet.'}`, wide: true }))),
        )
      : section(
          'Owners',
          h('p', { class: 'block__lede' }, 'The plan has no scoped AI agents yet, so this tab lists who owns each story. These are owners, not agents.'),
          owners.length
            ? h(
                'div',
                { class: 'grid grid--3' },
                owners.map((o) => {
                  const own = ownedBy(o);
                  return card({ to: `agents/owner/${slug(o)}`, label: 'Owner', value: o, note: `Owns ${own.map((r) => r.id).join(', ')}. No skills registered yet. No runs recorded.`, wide: true });
                }),
              )
            : empty({ title: 'No story names an owner', next: 'Owners or agents are added to the plan.' }),
        ),
    source('.colaberry/plan.json → agents[], derived.counts.agents_by_autonomy and stories[].owner_agent'),
  );
}
