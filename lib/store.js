// The workspace store: the tables from the data model, plus an audit log that every write goes through.
//
// - Every insert and update is checked against its table first (lib/schema.js), so a bad record is never stored.
// - Every write appends one AuditEntry in the same step. The entries form a hash chain: each one carries the hash of
//   the one before, so a changed or deleted line is caught by verifyAudit(). If the audit line cannot be written,
//   the record is not written either: both are saved together or neither is.
// - Writes can carry an idempotency key. Running the same write twice returns the first result and stores nothing new.
// - Some tables are append-only (events, samples, reports and the audit log itself): they cannot be updated.
//
// The backend decides where the state lives: memoryBackend() for tests, localStorageBackend() in the browser.
import { check, ValidationError } from './schema.js';

export class StoreError extends Error {
  constructor(message, cause) {
    super(message);
    this.name = 'StoreError';
    this.cause = cause;
  }
}

const PREFIX = { Person: 'P', SupportTicket: 'TKT', TicketEvent: 'EVT', HealthSample: 'HS', Incident: 'INC', Report: 'RPT', Feedback: 'FB', FeatureChange: 'FC', MaintenanceWindow: 'MW', AuditEntry: 'AUD', TrainingSession: 'TS', TrainingAttendance: 'TA', SolicitationResponse: 'RSP', ResponseDocument: 'DOC', ComplianceCheck: 'CC', EvaluationScore: 'ES', ScoringCriterion: 'SC', Risk: 'RISK' };
export const APPEND_ONLY = new Set(['TicketEvent', 'HealthSample', 'Report', 'AuditEntry']);
const GENESIS = '0'.repeat(64);

export async function sha256(text) {
  const bytes = new TextEncoder().encode(text);
  const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function memoryBackend(initial = null) {
  let saved = initial ? JSON.stringify(initial) : null;
  return { load: () => (saved ? JSON.parse(saved) : null), save: (state) => { saved = JSON.stringify(state); }, clear: () => { saved = null; } };
}

export function localStorageBackend(key, storage = globalThis.localStorage) {
  return {
    load() {
      const raw = storage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    },
    save(state) {
      storage.setItem(key, JSON.stringify(state));
    },
    clear() {
      storage.removeItem(key);
    },
  };
}

const emptyState = () => ({ version: 1, tables: {}, counters: {}, keys: {} });
const auditBody = (e) => JSON.stringify([e.seq, e.at, e.actor, e.action, e.entity, e.record_id, e.detail ?? null, e.prev]);

export async function createStore({ schema, backend = memoryBackend(), now = () => new Date() }) {
  let state;
  try {
    state = backend.load() ?? emptyState();
  } catch (err) {
    throw new StoreError('The workspace store could not be opened.', err);
  }

  const rows = (s, t) => (s.tables[t] ??= []);
  const exists = (s) => (t, id) => rows(s, t).some((r) => r.id === id);
  const clone = () => JSON.parse(JSON.stringify(state));

  function nextId(s, table) {
    s.counters[table] = (s.counters[table] ?? 0) + 1;
    return `${PREFIX[table] ?? table.slice(0, 3).toUpperCase()}-${String(s.counters[table]).padStart(4, '0')}`;
  }

  async function appendAudit(s, { actor, action, entity, record_id, detail }) {
    const log = rows(s, 'AuditEntry');
    const prev = log.length ? log[log.length - 1].hash : GENESIS;
    const entry = { id: nextId(s, 'AuditEntry'), seq: log.length + 1, at: now().toISOString(), actor: String(actor ?? 'unknown'), action, entity, record_id: record_id ?? '', detail: detail ?? null, prev };
    entry.hash = await sha256(auditBody(entry));
    const problems = check(schema, 'AuditEntry', entry);
    if (problems.length) throw new ValidationError('AuditEntry', problems);
    log.push(entry);
    return entry;
  }

  // Apply a change to a copy, save the copy, and only then make it the live state.
  async function commit(change) {
    const next = clone();
    const result = await change(next);
    try {
      backend.save(next);
    } catch (err) {
      throw new StoreError('The change was not saved: the workspace store refused it. Nothing was recorded.', err);
    }
    state = next;
    return result;
  }

  const api = {
    now,
    schema,

    insert: (table, record, opts = {}) =>
      opts.key && state.keys[opts.key] ? Promise.resolve(api.get(state.keys[opts.key].table, state.keys[opts.key].id)) : commit((s) => txApi(s).insert(table, record, opts)),
    update: (table, id, patch, opts = {}) => commit((s) => txApi(s).update(table, id, patch, opts)),
    /** An audit line with no record change: for things that must be logged even though nothing was stored, such as a refused access. */
    log: (action, opts = {}) => commit((s) => txApi(s).log(action, opts)),

    /** Several writes saved together: if any fails, none is kept. */
    async transaction(work) {
      return commit(async (s) => work(txApi(s)));
    },

    get: (table, id) => {
      const r = rows(state, table).find((x) => x.id === id);
      return r ? { ...r } : null;
    },
    list: (table, where = () => true) => rows(state, table).filter(where).map((r) => ({ ...r })),
    audit: () => rows(state, 'AuditEntry').map((r) => ({ ...r })),
    async verifyAudit() {
      return verifyChain(rows(state, 'AuditEntry'));
    },
    snapshot: () => clone(),
    reset() {
      state = emptyState();
      backend.save(state);
    },
  };

  // The same operations, working on the copy inside a transaction.
  function txApi(s) {
    return {
      now,
      async insert(table, record, { actor, action = 'created', key, detail } = {}) {
        if (key && s.keys[key]) return { ...rows(s, s.keys[key].table).find((r) => r.id === s.keys[key].id) };
        const rec = { ...record };
        if (schema.table(table)?.fields.some((f) => f.name === 'id') && !rec.id) rec.id = nextId(s, table);
        const problems = check(schema, table, rec, exists(s));
        if (problems.length) throw new ValidationError(table, problems);
        rows(s, table).push(rec);
        await appendAudit(s, { actor, action, entity: table, record_id: rec.id, detail: detail ?? rec });
        if (key) s.keys[key] = { table, id: rec.id };
        return rec;
      },
      async update(table, id, patch, { actor, action = 'updated', detail } = {}) {
        if (APPEND_ONLY.has(table)) throw new StoreError(`${table} records cannot be changed once written.`);
        const list = rows(s, table);
        const i = list.findIndex((r) => r.id === id);
        if (i < 0) throw new StoreError(`${table} ${id} does not exist.`);
        const rec = { ...list[i], ...patch, id };
        const problems = check(schema, table, rec, exists(s));
        if (problems.length) throw new ValidationError(table, problems);
        list[i] = rec;
        await appendAudit(s, { actor, action, entity: table, record_id: id, detail: detail ?? patch });
        return rec;
      },
      get: (table, id) => {
        const r = rows(s, table).find((x) => x.id === id);
        return r ? { ...r } : null;
      },
      list: (table, where = () => true) => rows(s, table).filter(where).map((r) => ({ ...r })),
      log: (action, { actor, entity = '(none)', record_id = '(none)', detail } = {}) => appendAudit(s, { actor, action, entity, record_id, detail }),
      seen: (key) => Boolean(s.keys[key]),
      remember: (key, table, id) => {
        s.keys[key] = { table, id };
      },
      recall: (key) => s.keys[key] ?? null,
    };
  }

  return api;
}

/** Walk the chain from the start. Reports the first line whose hash or link does not match. */
export async function verifyChain(entries) {
  let prev = GENESIS;
  for (let i = 0; i < entries.length; i++) {
    const e = entries[i];
    if (e.seq !== i + 1) return { ok: false, count: entries.length, brokenAt: i + 1, reason: `line ${i + 1} is missing or out of order` };
    if (e.prev !== prev) return { ok: false, count: entries.length, brokenAt: e.seq, reason: `line ${e.seq} does not follow the line before it` };
    if ((await sha256(auditBody(e))) !== e.hash) return { ok: false, count: entries.length, brokenAt: e.seq, reason: `line ${e.seq} was changed after it was written` };
    prev = e.hash;
  }
  return { ok: true, count: entries.length, brokenAt: null, reason: null };
}
