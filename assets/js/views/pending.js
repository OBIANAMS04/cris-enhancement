// A tab that is reachable but not built yet. It is not locked: the build is waiting on the owner's review.
import { h } from '../ui.js';

export function renderPending(tab) {
  return h(
    'div',
    {},
    h('h1', { tabindex: '-1' }, tab.label),
    h(
      'div',
      { class: 'pending' },
      h('p', { class: 'pending__title' }, 'Not built yet — say ', h('strong', {}, 'build the rest'), ' when Overview looks right.'),
      h('p', {}, 'The build stopped after the Overview so you can review it first. Nothing here needs unlocking and nothing is missing on your side.'),
      h('p', {}, h('strong', {}, 'What will be here: '), tab.summary),
      h('p', { class: 'source' }, 'It will read ', h('code', {}, tab.reads), ' at runtime.'),
      h('p', {}, h('a', { href: '#/overview' }, '← Back to Overview')),
    ),
  );
}
