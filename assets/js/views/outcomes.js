// Tab 2, Outcomes: the numbers this project has to move. Source: plan.derived.measures ({ id, statement }).
// The files hold the target a project commits to, never a measured value, so no value is ever shown here.
import { h, card, empty, section, source } from '../ui.js';
import { tabHead, subPage, notFound } from './common.js';

export function renderOutcomes(tab, data, ctx, rest) {
  const measures = data.plan?.derived?.measures ?? [];
  const [kind, id] = rest;
  if (kind === 'measure') {
    const m = measures.find((x) => x.id === id);
    if (!m) return notFound(tab, `measure/${id}`);
    return subPage(
      tab,
      m.id,
      h('p', { class: 'lede' }, m.statement),
      empty({
        title: 'No measured value yet',
        body: 'The plan holds what this project committed to move. The value itself will come from the system once it runs and reports.',
        next: 'The story that produces this number is built and starts reporting it.',
      }),
    );
  }
  if (kind === 'measures') {
    return subPage(
      tab,
      'Measures',
      empty({
        title: 'The plan carries no measures yet',
        body: 'A measure is a requirement with a number in it: a target the system has to reach, such as a response time or a resolution rate. When the plan has them, each gets a card here, and each card opens a page for that measure.',
        next: 'Measurable targets are agreed and added to the plan, then synced into this repo. None of the 20 requirements in the plan names a number today.',
      }),
    );
  }
  if (kind) return notFound(tab, rest.join('/'));

  return h(
    'div',
    {},
    ...tabHead(tab, 'The numbers this project has to move. Each measure is a target from the plan; its value will come from the running system.'),
    section(
      'Measures',
      measures.length
        ? h('div', { class: 'grid grid--2' }, measures.map((m) => card({ to: `outcomes/measure/${m.id}`, label: m.id, value: null, note: m.statement })))
        : h(
            'div',
            { class: 'grid grid--2' },
            card({ to: 'outcomes/measures', label: 'Measures', value: 'None in the plan yet', note: 'The plan names no numeric target, so there is nothing to track here yet. Open for what will appear and what has to happen first.', tone: 'empty', wide: true }),
          ),
    ),
    source('.colaberry/plan.json → derived.measures'),
  );
}
