// The shell: header, the nine tabs, the Real/Sample switch, the "Data as of" stamp, and the router.
// Every tab is a page with its own address (#/tab) and every card opens its own page one level down (#/tab/...).
import { loadReal, dataAge } from './data.js';
import { buildSample } from './sample.js';
import { h, env, link } from './ui.js';
import { TABS } from './tabs.js';
import { renderOverview } from './views/overview.js';
import { renderPending } from './views/pending.js';
import { renderOutcomes } from './views/outcomes.js';
import { renderUsers } from './views/users.js';
import { renderGuardrails } from './views/guardrails.js';
import { renderSystems } from './views/systems.js';
import { renderProject } from './views/project.js';
import { renderAgents } from './views/agents.js';
import { renderKnowledge } from './views/knowledge.js';
import { renderDataModel } from './views/datamodel.js';
import { BUILD_PAUSED_AT_OVERVIEW } from './tabs.js';

const VIEWS = { outcomes: renderOutcomes, users: renderUsers, guardrails: renderGuardrails, systems: renderSystems, project: renderProject, agents: renderAgents, knowledge: renderKnowledge, 'data-model': renderDataModel };

const MODE_KEY = 'command-center-mode';
const app = document.getElementById('app');
const state = { real: null, mode: readMode() };

function readMode() {
  try {
    return localStorage.getItem(MODE_KEY) === 'sample' ? 'sample' : 'real';
  } catch {
    return 'real'; // storage blocked: the page still works, it just starts in Real each time
  }
}

function setMode(mode) {
  state.mode = mode;
  try {
    localStorage.setItem(MODE_KEY, mode);
  } catch {
    // storage blocked: the choice lasts for this visit only
  }
  render();
}

function route() {
  // Only "#/..." is a page address. Anything else (no hash, a plain anchor) is the Overview.
  const path = location.hash.startsWith('#/') ? location.hash.slice(2) : '';
  const parts = path.split('/').filter(Boolean).map(decodeURIComponent);
  return { tabId: parts[0] ?? 'overview', rest: parts.slice(1) };
}

function stamp(data, now) {
  const age = dataAge((data.sample ? data.realManifest : data.manifest)?.generated_at, now);
  const lead = data.sample ? 'Sample data shown, made up in your browser. Real data' : 'Data';
  if (!age.known) return h('p', { class: 'stamp stamp--unknown' }, `${lead} age unknown: .colaberry/manifest.json has no readable date.`);
  if (age.level === 'stale') {
    return h('p', { class: 'stamp stamp--stale', role: 'status' }, h('strong', {}, `${lead} as of ${age.absolute} (${age.relative}). `), 'That is over a week old. Sync from the portal to refresh.');
  }
  return h('p', { class: 'stamp' }, `${lead} as of ${age.absolute} (${age.relative})`);
}

function modeSwitch() {
  const button = (mode, label) => h('button', { type: 'button', class: 'switch__btn', 'aria-pressed': String(state.mode === mode), 'data-mode': mode }, label);
  const group = h('div', { class: 'switch', role: 'group', 'aria-label': 'Data shown' }, button('real', 'Real'), button('sample', 'Sample'));
  group.addEventListener('click', (event) => {
    const mode = event.target.closest('button')?.dataset.mode;
    if (mode && mode !== state.mode) setMode(mode);
  });
  return group;
}

function view(tab, data, ctx, rest) {
  if (!tab) {
    return h('div', {}, h('h1', { tabindex: '-1' }, 'Page not found'), h('p', {}, 'There is no tab at this address. ', h('a', { href: link('overview') }, 'Go to the Overview'), '.'));
  }
  if (tab.id === 'overview') return renderOverview(data, ctx, rest);
  if (BUILD_PAUSED_AT_OVERVIEW || !VIEWS[tab.id]) return renderPending(tab);
  if (!data.plan || !data.progress) {
    return h('div', {}, h('h1', { tabindex: '-1' }, tab.label), h('p', {}, 'This tab is drawn from .colaberry/plan.json and .colaberry/progress.json, and at least one could not be read. The message at the top of the page says which and why.'));
  }
  return VIEWS[tab.id](tab, data, ctx, rest);
}

function render({ moveFocus = false } = {}) {
  const now = new Date();
  const { tabId, rest } = route();
  const tab = TABS.find((t) => t.id === tabId);
  const data = state.mode === 'sample' ? buildSample(state.real, now) : state.real;
  env.sample = data.sample;
  document.body.dataset.mode = state.mode;
  const projectName = state.real.plan?.project?.name ?? state.real.plan?.project_name ?? null;
  document.title = `${tab ? tab.label : 'Not found'} · ${projectName ?? 'Command Center'}`;

  const parts = [
    h(
      'header',
      { class: 'top' },
      h('div', { class: 'top__row' }, h('a', { class: 'top__brand', href: link('overview') }, h('span', { class: 'top__kicker' }, 'Command Center'), projectName ? h('span', { class: 'top__name' }, projectName) : null), h('span', { class: 'top__tools' }, h('a', { class: 'top__link', href: 'workspace/' }, 'Open the workspace →'), modeSwitch())),
      stamp(data, now),
      h('nav', { class: 'tabs', 'aria-label': 'Tabs' }, TABS.map((t) => h('a', { href: link(t.id), 'aria-current': t.id === tabId ? 'page' : null }, t.label))),
    ),
    data.sample
      ? h('p', { class: 'sample-banner', role: 'status' }, h('strong', {}, 'Sample data. '), 'Everything on this page is made up to show its shape. None of it was produced by this project. Switch to Real to see what the project has actually produced.')
      : null,
    data.errors.length ? h('div', { class: 'errors', role: 'alert' }, h('strong', {}, 'Some data could not be read:'), h('ul', {}, data.errors.map((e) => h('li', {}, e)))) : null,
    h('main', { id: 'main' }, view(tab, data, { now }, rest)),
    h('footer', { class: 'foot' }, 'Built from the files in ', h('code', {}, '.colaberry/'), ' in this repo, read when the page loads. No number, connection or result is shown unless the project produced it.'),
  ];
  // replaceChildren would print a null as the word "null", so absent parts are dropped first.
  app.replaceChildren(...parts.filter(Boolean));
  app.removeAttribute('aria-busy');
  if (moveFocus) app.querySelector('h1')?.focus();
}

// The skip link moves focus to the content without changing the page address, which belongs to the router.
document.querySelector('.skip')?.addEventListener('click', (event) => {
  event.preventDefault();
  const main = document.getElementById('main');
  if (!main) return;
  main.tabIndex = -1;
  main.focus();
});

window.addEventListener('hashchange', () => {
  if (!state.real) return; // still loading: the first render will show the new address
  render({ moveFocus: true });
  window.scrollTo(0, 0);
});

state.real = await loadReal();
render();
