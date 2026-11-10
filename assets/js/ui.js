// Small DOM helpers shared by every tab. Text from the plan files is always added as text, never as HTML.
import { STATE_LABEL, NOT_CHECKED } from './data.js';

/** Set by main.js before each render so every card can label itself in sample mode. */
export const env = { sample: false };

export function h(tag, attrs = {}, ...kids) {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs ?? {})) {
    if (value === null || value === undefined || value === false) continue;
    if (key === 'class') el.className = value;
    else el.setAttribute(key, value === true ? '' : String(value));
  }
  for (const kid of kids.flat(Infinity)) {
    if (kid === null || kid === undefined || kid === false) continue;
    el.append(kid instanceof Node ? kid : document.createTextNode(String(kid)));
  }
  return el;
}

export const link = (route) => `#/${route}`;

export const sampleTag = () => (env.sample ? h('span', { class: 'tag-sample' }, 'Sample') : null);

/** A card is a link: every card on every tab drills down one level to its own page. */
export function card({ to, label, value, unit, note, tone, wide }) {
  return h(
    'a',
    { class: `card${tone ? ` card--${tone}` : ''}${wide ? ' card--wide' : ''}`, href: link(to) },
    h('span', { class: 'card__top' }, h('span', { class: 'card__label' }, label), sampleTag()),
    value !== undefined && value !== null ? h('span', { class: 'card__value' }, value, unit ? h('span', { class: 'card__unit' }, ` ${unit}`) : null) : null,
    note ? h('span', { class: 'card__note' }, note) : null,
    h('span', { class: 'card__more', 'aria-hidden': 'true' }, 'Open →'),
  );
}

/** Story state as a pill. No verification block means "not checked yet", drawn grey and dashed. */
export function statePill(state) {
  if (!state) return h('span', { class: 'pill pill--unknown' }, NOT_CHECKED);
  return h('span', { class: `pill pill--${state}` }, STATE_LABEL[state] ?? state);
}

export const pill = (text, tone = 'unknown') => h('span', { class: `pill pill--${tone}` }, text);

/** An empty state says what is missing, what will be here, and what has to happen first. */
export function empty({ title, body, next }) {
  return h(
    'div',
    { class: 'empty' },
    h('p', { class: 'empty__title' }, title),
    body ? h('p', {}, body) : null,
    next ? h('p', { class: 'empty__next' }, h('strong', {}, 'What has to happen first: '), next) : null,
  );
}

export function crumbs(trail) {
  return h(
    'nav',
    { class: 'crumbs', 'aria-label': 'Breadcrumb' },
    trail.map((step, i) => [i ? h('span', { 'aria-hidden': 'true' }, ' › ') : null, step.to ? h('a', { href: link(step.to) }, step.label) : h('span', { 'aria-current': 'page' }, step.label)]),
  );
}

export function table(headers, rows, caption) {
  return h(
    'div',
    { class: 'table-wrap' },
    h(
      'table',
      {},
      caption ? h('caption', {}, caption, sampleTag()) : null,
      h('thead', {}, h('tr', {}, headers.map((text) => h('th', { scope: 'col' }, text)))),
      h('tbody', {}, rows.map((cells) => h('tr', {}, cells.map((cell) => h('td', {}, cell))))),
    ),
  );
}

export const section = (title, ...kids) => h('section', { class: 'block' }, h('h2', {}, title), ...kids);

export const source = (text) => h('p', { class: 'source' }, 'Read at runtime from ', h('code', {}, text), '.');
