// Tab 5, Systems: what this connects to. Source: plan.derived.systems, a list of names and nothing more.
// Whether a system is connected is a fact about the running system, which nothing in this repo can see, so every
// indicator stays grey and "not checked from here" until the system itself reports. Sample mode supplies
// made-up statuses so the shape of a healthy row can be seen; they are labelled sample.
import { h, card, empty, section, source, table, link, sampleTag } from '../ui.js';
import { tabHead, subPage, notFound, slug, model, storiesTable, storyPage, requirementsNaming } from './common.js';
import { formatDate } from '../data.js';

const STATUS = {
  unknown: { label: 'Not checked from here', cls: 'dot--unknown' },
  connected: { label: 'Connected', cls: 'dot--ok' },
  not_connected: { label: 'Not connected', cls: 'dot--warn' },
  error: { label: 'Error', cls: 'dot--bad' },
};

function statusOf(data, name) {
  const s = data.systemStatus?.[name];
  if (!s) return { ...STATUS.unknown, checked: 'Never: nothing has reported yet' };
  const at = new Date(s.checked_at);
  return { ...(STATUS[s.state] ?? STATUS.unknown), checked: `${formatDate(at)}, ${at.toTimeString().slice(0, 5)}` };
}

const dot = (st) => h('span', { class: `dot ${st.cls}` }, h('span', { class: 'dot__mark', 'aria-hidden': 'true' }), st.label);

export function renderSystems(tab, data, ctx, rest) {
  const plan = data.plan;
  const systems = plan?.derived?.systems ?? [];
  const { rows, byId } = model(data);
  const [kind, id] = rest;

  if (kind === 'story') {
    const row = byId.get(id);
    return row ? storyPage(tab, row, plan) : notFound(tab, `story/${id}`);
  }
  if (kind === 'system') {
    const name = systems.find((s) => slug(s) === id);
    if (!name) return notFound(tab, `system/${id}`);
    const st = statusOf(data, name);
    const reqs = requirementsNaming(plan, name);
    const storyIds = new Set(reqs.flatMap((r) => r.fulfilled_by ?? []));
    return subPage(
      tab,
      name,
      h('p', { class: 'lede' }, dot(st), ` · Last checked: ${st.checked}`),
      data.sample ? null : h('p', {}, 'The plan names this system and nothing more. Whether it is reachable is a fact about the running system, so this stays grey until the system reports its own connection status.'),
      h('h2', {}, 'Requirements that name it'),
      reqs.length ? h('ul', {}, reqs.map((r) => h('li', {}, h('a', { href: link(`knowledge/req/${r.id}`) }, r.id), ` ${r.statement}`))) : h('p', {}, 'No requirement names this system directly.'),
      storyIds.size ? storiesTable(tab, rows.filter((r) => storyIds.has(r.id)), 'Stories that will build the connection') : null,
    );
  }
  if (kind) return notFound(tab, rest.join('/'));

  return h(
    'div',
    {},
    ...tabHead(tab, 'What this system connects to. An indicator turns colour only when the system itself reports; grey means nobody has checked.'),
    systems.length
      ? [
          section(
            `Systems (${systems.length})`,
            table(
              ['System', 'Status', 'Last checked'],
              systems.map((name) => {
                const st = statusOf(data, name);
                return [h('a', { href: link(`systems/system/${slug(name)}`) }, name), dot(st), st.checked];
              }),
              'Connection status',
            ),
            h('div', { class: 'grid grid--2' }, systems.map((name) => card({ to: `systems/system/${slug(name)}`, label: 'System', value: name, note: `${requirementsNaming(plan, name).length} requirement(s) name it. ${statusOf(data, name).label}.`, wide: true }))),
          ),
        ]
      : empty({ title: 'The plan names no outside systems', next: 'Integration requirements are added to the plan and synced.' }),
    source('.colaberry/plan.json → derived.systems and requirements'),
  );
}
