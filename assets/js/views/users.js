// Tab 3, Users and use case: who the system is for and what each role wants.
// Source: plan.derived.roles, and plan.stories[].narrative for the sentence each role came from.
import { h, card, empty, section, source, statePill } from '../ui.js';
import { tabHead, subPage, notFound, slug, model, storyCell, storiesForRole, storyPage } from './common.js';

export function renderUsers(tab, data, ctx, rest) {
  const plan = data.plan;
  const roles = plan?.derived?.roles ?? [];
  const { byId } = model(data);
  const [kind, id] = rest;

  if (kind === 'role') {
    const role = roles.find((r) => slug(r) === id);
    if (!role) return notFound(tab, `role/${id}`);
    const stories = storiesForRole(plan, role);
    return subPage(
      tab,
      role,
      h('p', { class: 'lede' }, stories.length ? `${stories.length} ${stories.length === 1 ? 'story is' : 'stories are'} written for this role.` : 'No story in the plan is written from this role yet.'),
      stories.length
        ? h(
            'ul',
            { class: 'quotes' },
            stories.map((s) => {
              const row = byId.get(s.id);
              return h('li', {}, h('blockquote', {}, s.narrative), h('p', { class: 'quotes__by' }, storyCell(tab, row), ' ', statePill(row?.state ?? null)));
            }),
          )
        : empty({ title: 'Nothing to show for this role yet', body: 'The role is listed in the plan, but no story narrative begins "As a ' + role + '".', next: 'A story is written for this role and the plan is synced.' }),
    );
  }
  if (kind === 'story') {
    const row = byId.get(id);
    return row ? storyPage(tab, row, plan) : notFound(tab, `story/${id}`);
  }
  if (kind) return notFound(tab, rest.join('/'));

  return h(
    'div',
    {},
    ...tabHead(tab, 'Who this system is for and what each of them is trying to get done, taken from how the stories are written.'),
    section(
      `Roles (${roles.length})`,
      roles.length
        ? h(
            'div',
            { class: 'grid grid--3' },
            roles.map((role) => {
              const n = storiesForRole(plan, role).length;
              return card({ to: `users/role/${slug(role)}`, label: 'Role', value: role, note: n ? `${n} ${n === 1 ? 'story' : 'stories'} written for this role.` : 'No story is written from this role yet.', wide: true });
            }),
          )
        : empty({ title: 'The plan lists no roles', next: 'Stories are written "As a <role>, I want …" and the plan is synced.' }),
    ),
    source('.colaberry/plan.json → derived.roles and stories[].narrative'),
  );
}
