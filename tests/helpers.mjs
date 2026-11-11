// Shared set-up for the workspace tests: a store on the real data model, the demo people, and a clock the test moves.
import { readFile } from 'node:fs/promises';
import { compileSchema } from '../lib/schema.js';
import { createStore, memoryBackend } from '../lib/store.js';
import { seedPeople } from '../lib/seed.js';

export { memoryBackend };

const read = async (p) => JSON.parse(await readFile(new URL(`../${p}`, import.meta.url), 'utf8'));

export const dataModel = () => read('content/data-model.json');
export const articles = async () => (await read('content/help-articles.json')).articles;

export function clock(iso = '2026-11-11T15:00:00.000Z') {
  let t = Date.parse(iso);
  const now = () => new Date(t);
  now.advance = (hours) => {
    t += hours * 3600 * 1000;
  };
  now.set = (s) => {
    t = Date.parse(s);
  };
  return now;
}

export async function setup({ now = clock(), backend = memoryBackend() } = {}) {
  const schema = compileSchema(await dataModel());
  const store = await createStore({ schema, backend, now });
  const people = await seedPeople(store, (await read('content/demo-people.json')).people);
  const by = (role) => people.find((p) => p.role === role).id;
  return { store, now, backend, schema, user: by('TxDOT user'), manager: by('TxDOT manager'), staff: by('TxDOT staff member'), admin: by('system administrator'), dev: by('developer') };
}

// A fetch that answers every URL except those in `down`, a clock that moves 40 ms per reading, and two targets.
export const fakeFetch = (down = new Set()) => async (url) => {
  if (down.has(url)) throw new Error('connection refused');
  return { ok: true, status: 200 };
};
export const tick = () => {
  let t = 0;
  return () => (t += 40);
};
export const targets = [{ component: 'Web', url: 'a' }, { component: 'API', url: 'b' }];

