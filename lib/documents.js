// STORY-013: the document management system for the solicitation response. Documents are uploaded into a category,
// stored with their SHA-256, and read back once before the upload counts, so a failed store is caught at upload, not
// later. Only the roles that handle the response can upload or open documents; anyone else is refused, and the refusal
// is logged. Opening a document is timed against the 2 second target and checked against its hash. Replacing a
// document keeps the old version, marked superseded. Every upload, replacement, opening and refusal is in the audit log.
import { sha256 } from './store.js';
import { clearance } from './cyber.js';

export class DocumentError extends Error {
  constructor(message, problems = []) {
    super(message);
    this.name = 'DocumentError';
    this.problems = problems;
  }
}

export const CATEGORIES = ['Technical proposal', 'Pricing', 'Forms and certifications', 'HUB subcontracting plan', 'Cyber security training records', 'Other'];
export const ACCESS_ROLES = new Set(['compliance officer', 'procurement officer', 'TxDOT contract manager', 'system administrator']);
export const MAX_BYTES = 10 * 1024 * 1024;
export const TARGET_MS = 2000;
export const ALLOWED_TYPES = { pdf: 'application/pdf', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', txt: 'text/plain', csv: 'text/csv', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg' };
const RESPONSE_KEY = 'response:cris-service-agreement';

/** A content store in memory, for tests. The browser uses IndexedDB with the same three calls. */
export function memoryBlobs() {
  const m = new Map();
  return { put: async (k, bytes) => void m.set(k, new Uint8Array(bytes)), get: async (k) => (m.has(k) ? new Uint8Array(m.get(k)) : null), clear: async () => m.clear(), size: () => m.size };
}

export async function hashBytes(bytes) {
  const d = await globalThis.crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function allowed(store, actor) {
  const p = store.get('Person', actor);
  // STORY-011: vendor staff also need current cyber security training (REQ-020).
  return p && ACCESS_ROLES.has(p.role) && clearance(store, actor).cleared ? p : null;
}

/** The response every document belongs to, created once. */
export async function ensureResponse(store, actor) {
  return store.insert('SolicitationResponse', { solicitation_reference: 'TxDOT Crash Records Information System Service Agreement', respondent: 'Colaberry', status: 'draft' }, { actor, action: 'response file opened', key: RESPONSE_KEY });
}

async function refuse(store, actor, action, record_id) {
  const role = store.get('Person', actor)?.role ?? 'unknown';
  const training = ACCESS_ROLES.has(role) ? clearance(store, actor) : null;
  await store.log('document access refused', { actor, entity: 'ResponseDocument', record_id: record_id || '(new)', detail: { attempted: action, role, reason: training ? training.reason : 'role' } });
  if (training) throw new DocumentError(`Access refused: ${training.reason} Complete the course on the Training page first. The attempt has been logged.`);
  throw new DocumentError(`Access refused: only ${[...ACCESS_ROLES].join(', ')} can ${action} response documents. The attempt has been logged.`);
}

/**
 * Upload a document (or a new version of one, with `replaces`). Returns the stored record.
 * file: { name, bytes (Uint8Array), media_type }
 */
export async function uploadDocument(store, blobs, { actor, title, category, file, replaces }) {
  if (!allowed(store, actor)) return refuse(store, actor, 'upload', replaces);
  const problems = [];
  const ext = String(file?.name ?? '').toLowerCase().split('.').pop();
  if (!file?.bytes?.length) problems.push('Choose a file; an empty file cannot be stored.');
  else if (file.bytes.length > MAX_BYTES) problems.push(`The file is ${(file.bytes.length / 1048576).toFixed(1)} MB; the limit is ${MAX_BYTES / 1048576} MB.`);
  if (file?.name && !ALLOWED_TYPES[ext]) problems.push(`".${ext}" files are not accepted. Use ${Object.keys(ALLOWED_TYPES).join(', ')}.`);
  if (!CATEGORIES.includes(category)) problems.push('Choose a category.');
  const old = replaces ? store.get('ResponseDocument', replaces) : null;
  if (replaces && (!old || old.status === 'superseded')) problems.push(`${replaces} is not a current document.`);
  if (problems.length) throw new DocumentError('The document was not uploaded.', problems);

  const response = await ensureResponse(store, actor);
  const content_hash = await hashBytes(file.bytes);
  const version = old ? (old.version ?? 1) + 1 : 1;
  const blobKey = `${content_hash}`;
  try {
    await blobs.put(blobKey, file.bytes);
    const back = await blobs.get(blobKey);
    if (!back || (await hashBytes(back)) !== content_hash) throw new Error('read-back did not match');
  } catch (err) {
    throw new DocumentError('The document was not uploaded: the document store could not keep it. Nothing was recorded; try again.', [err.message]);
  }
  return store.transaction(async (tx) => {
    const doc = await tx.insert('ResponseDocument', { response: response.id, kind: category, title: (title || file.name).trim(), file_reference: `sha256:${blobKey}`, uploaded_at: store.now().toISOString(), uploaded_by: actor, version, content_hash, size_bytes: file.bytes.length, media_type: file.media_type || ALLOWED_TYPES[ext], status: 'current' }, { actor, action: old ? `document replaced (version ${version})` : 'document uploaded', detail: { name: file.name, category, content_hash, replaces: replaces ?? null } });
    if (old) await tx.update('ResponseDocument', old.id, { status: 'superseded' }, { actor, action: 'document superseded', detail: { by: doc.id } });
    return doc;
  });
}

/**
 * Open a stored document. Times the retrieval against the 2 second target, checks the bytes against the hash, and
 * logs the access. Returns { doc, bytes, ms, intact, withinTarget }.
 */
export async function openDocument(store, blobs, { actor, id, clock = () => globalThis.performance.now() }) {
  if (!allowed(store, actor)) return refuse(store, actor, 'open', id);
  const doc = store.get('ResponseDocument', id);
  if (!doc) throw new DocumentError(`Document ${id} does not exist.`);
  const t0 = clock();
  const bytes = await blobs.get(doc.content_hash);
  const ms = Math.round(clock() - t0);
  if (!bytes) {
    await store.log('document retrieval failed', { actor, entity: 'ResponseDocument', record_id: id, detail: { ms } });
    throw new DocumentError(`${id} could not be retrieved: its content is missing from the document store. The failure has been logged.`);
  }
  const intact = (await hashBytes(bytes)) === doc.content_hash;
  await store.log(intact ? 'document opened' : 'document opened, content did not match its hash', { actor, entity: 'ResponseDocument', record_id: id, detail: { ms, within_target: ms <= TARGET_MS } });
  return { doc, bytes, ms, intact, withinTarget: ms <= TARGET_MS };
}

/** Current documents grouped by category, for the page. */
export function library(store) {
  // Only our own response's documents; responses received from other respondents (STORY-008) are listed with their submission.
  const ours = new Set(store.list('SolicitationResponse', (r) => r.respondent === 'Colaberry').map((r) => r.id));
  const docs = store.list('ResponseDocument', (d) => d.status !== 'superseded' && ours.has(d.response));
  return CATEGORIES.map((c) => ({ category: c, docs: docs.filter((d) => d.kind === c) }));
}

/** Who did what to one document, read from the audit log. */
export const documentLog = (store, id) => store.audit().filter((e) => e.entity === 'ResponseDocument' && e.record_id === id);
