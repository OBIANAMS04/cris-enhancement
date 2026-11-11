// Pieces every workspace page uses: dates, names, status badges, page headings, forms and the action runner.
import { h } from '../../assets/js/ui.js';

export const when = (iso) => (iso ? new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '—');
export const person = (ctx, id) => ctx.store.get('Person', id)?.display_name ?? (id || '—');
export const tone = { open: 'warn', 'in progress': 'info', resolved: 'ok', closed: 'ok', met: 'ok', 'on track': 'info', 'at risk': 'warn', breached: 'bad', missed: 'bad', scheduled: 'info', completed: 'ok', cancelled: 'unknown', new: 'info', planned: 'info', declined: 'unknown', reviewed: 'ok', proposed: 'info', approved: 'info', 'in build': 'warn', released: 'ok', mitigated: 'warn' };
export const badge = (text) => h('span', { class: `pill pill--${tone[text] ?? 'unknown'}` }, text);

export function head(page, title, lede) {
  return [
    page.story ? h('p', { class: 'kicker' }, `${page.story} · ${page.req} · `, h('a', { href: `../#/project/story/${page.story}` }, 'story in the Command Center')) : h('p', { class: 'kicker' }, 'Trust'),
    h('h1', { tabindex: '-1' }, title),
    lede ? h('p', { class: 'lede' }, lede) : null,
  ];
}

export function flash(ctx) {
  const f = ctx.flash;
  if (!f) return null;
  return h('div', { class: `notice notice--${f.tone}`, role: f.tone === 'bad' ? 'alert' : 'status' }, h('strong', {}, f.title), f.body ? h('p', {}, f.body) : null, f.items?.length ? h('ul', {}, f.items.map((x) => h('li', {}, x))) : null);
}

/** Run an action, then show what happened: the success message, or exactly why it was refused. */
export async function act(ctx, work, success) {
  try {
    const result = await work();
    ctx.flash = typeof success === 'function' ? success(result) : { tone: 'ok', title: success };
  } catch (err) {
    ctx.flash = { tone: 'bad', title: err.message, items: err.problems ?? [] };
  }
  ctx.rerender();
}

export function field(label, control, hint) {
  const id = control.id || `f-${Math.random().toString(36).slice(2, 8)}`;
  control.id = id;
  return h('div', { class: 'field' }, h('label', { for: id }, label), control, hint ? h('span', { class: 'hint' }, hint) : null);
}

export function form(className, kids, onSubmit) {
  const f = h('form', { class: className, novalidate: true }, kids);
  f.addEventListener('submit', (e) => {
    e.preventDefault();
    // Read the form first: a disabled button's value is left out of the form data, so disabling comes after.
    const data = new FormData(f, e.submitter);
    for (const b of f.querySelectorAll('button[type="submit"]')) b.disabled = true; // a double click submits once
    onSubmit(data, f);
  });
  return f;
}

export const button = (label, cls = 'btn') => h('button', { type: 'submit', class: cls }, label);
export const onClick = (el, fn) => {
  el.addEventListener('click', fn);
  return el;
};

export function download(name, text) {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  const a = h('a', { href: url, download: name });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
