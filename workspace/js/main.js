// The workspace shell: opens the store, puts in the demo people once, and routes between the Milestone 1 pages.
// The store lives in this browser (localStorage). If the browser refuses storage, the workspace still runs and says
// that what is done here lasts only until the page is closed.
import { h } from '../../assets/js/ui.js';
import { compileSchema } from '../../lib/schema.js';
import { createStore, localStorageBackend, memoryBackend } from '../../lib/store.js';
import { seedPeople } from '../../lib/seed.js';
import { PAGES, renderPage } from './views.js';

const STORE_KEY = 'cris-workspace-v1';
const ACTOR_KEY = 'cris-workspace-actor';
const app = document.getElementById('app');
const ctx = { store: null, articles: [], actor: null, flash: null, persistent: true, timers: new Set(), rerender: () => render() };

async function json(path) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 10000);
  try {
    const res = await fetch(path, { cache: 'no-store', signal: ctrl.signal });
    if (!res.ok) throw new Error(`${path}: HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

function storageWorks() {
  try {
    localStorage.setItem('cris-workspace-probe', '1');
    localStorage.removeItem('cris-workspace-probe');
    return true;
  } catch {
    return false;
  }
}

async function open() {
  const [dataModel, help, people] = await Promise.all([json('../content/data-model.json'), json('../content/help-articles.json'), json('../content/demo-people.json')]);
  const schema = compileSchema(dataModel);
  ctx.persistent = storageWorks();
  const backend = ctx.persistent ? localStorageBackend(STORE_KEY) : memoryBackend();
  try {
    ctx.store = await createStore({ schema, backend });
  } catch {
    // A store this version cannot read: start a fresh one rather than lock the user out, and say so.
    ctx.store = await createStore({ schema, backend: memoryBackend() });
    ctx.persistent = false;
    ctx.flash = { tone: 'warn', title: 'The saved workspace could not be read, so this visit starts empty.', items: [] };
  }
  ctx.articles = help.articles;
  ctx.peopleSeed = people.people;
  await seedPeople(ctx.store, people.people);
  ctx.actor = readActor();
}

function readActor() {
  let id = null;
  try {
    id = localStorage.getItem(ACTOR_KEY);
  } catch {
    // no storage: the first person is used
  }
  const people = ctx.store.list('Person');
  return people.find((p) => p.id === id)?.id ?? people[0]?.id ?? null;
}

function actorPicker() {
  const select = h('select', { id: 'actor' }, ctx.store.list('Person').map((p) => h('option', { value: p.id, selected: p.id === ctx.actor }, p.display_name)));
  select.addEventListener('change', () => {
    ctx.actor = select.value;
    try {
      localStorage.setItem(ACTOR_KEY, ctx.actor);
    } catch {
      // kept for this visit only
    }
    render();
  });
  return h('span', { class: 'actor' }, h('label', { for: 'actor' }, 'Acting as'), select);
}

function route() {
  const path = location.hash.startsWith('#/') ? location.hash.slice(2) : '';
  const parts = path.split('/').filter(Boolean).map(decodeURIComponent);
  return { pageId: parts[0] ?? 'help-desk', rest: parts.slice(1) };
}

export function render({ moveFocus = false } = {}) {
  for (const t of ctx.timers) clearInterval(t);
  ctx.timers.clear();
  const { pageId, rest } = route();
  const page = PAGES.find((p) => p.id === pageId);
  document.title = `${page ? page.label : 'Not found'} · CRIS Workspace`;
  const parts = [
    h(
      'header',
      { class: 'top' },
      h('div', { class: 'top__row' }, h('a', { class: 'top__brand', href: '#/help-desk' }, h('span', { class: 'top__kicker' }, 'Workspace · Milestone 1'), h('span', { class: 'top__name' }, 'Crash Records Information System (CRIS) Enhancement')), actorPicker()),
      h('p', { class: 'stamp' }, h('a', { href: '../' }, '← Command Center'), ' · Every action here is checked against the data model and written to the audit log.'),
      h('nav', { class: 'tabs', 'aria-label': 'Workspace pages' }, PAGES.map((p) => h('a', { href: `#/${p.id}`, 'aria-current': p.id === pageId ? 'page' : null }, p.label))),
    ),
    h(
      'p',
      { class: 'demo-banner', role: 'note' },
      h('strong', {}, 'Demo workspace. '),
      'Synthetic people and data, ',
      ctx.persistent ? 'kept in this browser only.' : 'kept until this page is closed (this browser refuses storage).',
      ' Nothing here reaches TxDOT or any TxDOT system.',
    ),
    h('main', { id: 'main' }, renderPage(page, rest, ctx)),
    h('footer', { class: 'foot' }, 'Tables from ', h('code', {}, 'content/data-model.json'), '; logic in ', h('code', {}, 'lib/'), ', tested with ', h('code', {}, 'node --test tests/'), '.'),
  ];
  app.replaceChildren(...parts.filter(Boolean));
  app.removeAttribute('aria-busy');
  if (moveFocus) app.querySelector('h1')?.focus();
}

document.querySelector('.skip')?.addEventListener('click', (event) => {
  event.preventDefault();
  const main = document.getElementById('main');
  if (!main) return;
  main.tabIndex = -1;
  main.focus();
});

window.addEventListener('hashchange', () => {
  // A page change while the store is still opening: the first render, once it is open, will show the new page.
  if (!ctx.store) return;
  ctx.flash = null;
  render({ moveFocus: true });
  window.scrollTo(0, 0);
});

try {
  await open();
  render();
} catch (err) {
  app.replaceChildren(h('main', { id: 'main' }, h('h1', {}, 'The workspace could not open'), h('div', { class: 'notice notice--bad', role: 'alert' }, h('p', {}, err.message), h('p', {}, 'Nothing was saved. Reload the page to try again.'))));
  app.removeAttribute('aria-busy');
}
