// STORY-008: response submissions. The procurement officer records each response received for the solicitation. A
// submission is checked before anything is stored: it must arrive before the closing time and include every required
// document, each an accepted file type and size. Then every file is stored and read back by hash, and the response and
// its documents are saved together, with a receipt (SHA-256 over the documents) the respondent can quote. A submission
// that fails is logged as an incident on response submissions and addressed: by a later valid submission from the same
// respondent, or by hand with the cause. Every submission and status change is in the audit log, so each response is
// tracked from receipt to award. Euna Procurement is not connected, so tracking happens here and the page says so.
import { hashBytes, ALLOWED_TYPES, MAX_BYTES } from './documents.js';
import { sha256 } from './store.js';

export class SubmissionError extends Error {
  constructor(message, problems = []) {
    super(message);
    this.name = 'SubmissionError';
    this.problems = problems;
  }
}

export const STATUS_FLOW = { submitted: ['under evaluation'], 'under evaluation': ['awarded', 'not awarded'] };
const COMPONENT = 'Response submissions';
const RECEIVING_ROLES = new Set(['procurement officer', 'TxDOT contract manager']);

function checkFile(doc) {
  const ext = String(doc.file?.name ?? '').toLowerCase().split('.').pop();
  if (!doc.file?.bytes?.length) return `${doc.kind}: the file is empty or missing.`;
  if (doc.file.bytes.length > MAX_BYTES) return `${doc.kind}: the file is over ${MAX_BYTES / 1048576} MB.`;
  if (!ALLOWED_TYPES[ext]) return `${doc.kind}: ".${ext}" files are not accepted.`;
  return null;
}

/** Everything wrong with a submission, before anything is stored. */
export function submissionProblems(store, solicitation, { respondent, documents = [], actor }, now = store.now()) {
  const problems = [];
  const who = store.get('Person', actor);
  if (!who || !RECEIVING_ROLES.has(who.role)) problems.push('Only a procurement officer or the contract manager can record a submission.');
  if (!String(respondent ?? '').trim()) problems.push('Name the respondent.');
  if (now.getTime() > Date.parse(solicitation.closes_at)) problems.push(`The solicitation closed at ${solicitation.closes_at}; late submissions are not accepted.`);
  const kinds = new Set(documents.map((d) => d.kind));
  for (const req of solicitation.required_documents) if (!kinds.has(req)) problems.push(`Missing required document: ${req}.`);
  for (const d of documents) {
    const p = checkFile(d);
    if (p) problems.push(p);
  }
  return problems;
}

async function logFailure(store, { actor, respondent, detail }) {
  const open = store.list('Incident', (i) => i.component === COMPONENT && i.status !== 'resolved' && i.title.includes(`[${respondent}]`))[0];
  if (open) {
    await store.log('submission error repeated', { actor, entity: 'Incident', record_id: open.id, detail });
    return open;
  }
  return store.insert('Incident', { title: `Submission error [${respondent || 'unnamed'}]: ${detail}`.slice(0, 300), severity: '3', status: 'open', detected_at: store.now().toISOString(), component: COMPONENT }, { actor, action: 'submission error logged' });
}

/**
 * Record a response. documents: [{ kind, title?, file: { name, bytes, media_type } }]. `key` makes a retried submission
 * return the first one. On failure the error is logged as an incident and thrown with `incident` attached.
 */
export async function submitResponse(store, blobs, solicitation, { respondent, documents = [], actor, key }) {
  const problems = submissionProblems(store, solicitation, { respondent, documents, actor });
  if (problems.length) {
    const err = new SubmissionError('The submission was not accepted.', problems);
    err.incident = await logFailure(store, { actor, respondent: String(respondent ?? '').trim(), detail: problems.join(' ') });
    throw err;
  }
  const name = respondent.trim();
  const hashes = [];
  try {
    for (const d of documents) {
      const h = await hashBytes(d.file.bytes);
      await blobs.put(h, d.file.bytes);
      const back = await blobs.get(h);
      if (!back || (await hashBytes(back)) !== h) throw new Error(`read-back of ${d.kind} did not match`);
      hashes.push(h);
    }
  } catch (cause) {
    const err = new SubmissionError('The submission was not stored: the document store could not keep a file. Nothing was recorded.', [cause.message]);
    err.incident = await logFailure(store, { actor, respondent: name, detail: `Storage failed: ${cause.message}` });
    throw err;
  }
  const receipt_hash = await sha256(JSON.stringify(documents.map((d, i) => [d.kind, hashes[i]])));
  const response = await store.transaction(async (tx) => {
    if (key && tx.seen(key)) return tx.get('SolicitationResponse', tx.recall(key).id);
    const at = store.now().toISOString();
    const r = await tx.insert('SolicitationResponse', { solicitation_reference: solicitation.reference, respondent: name, status: 'submitted', submitted_at: at, receipt_hash, received_by: actor }, { actor, action: 'response submitted', detail: { respondent: name, receipt_hash, documents: documents.length } });
    for (let i = 0; i < documents.length; i++) {
      const d = documents[i];
      await tx.insert('ResponseDocument', { response: r.id, kind: d.kind, title: (d.title || d.file.name).trim(), file_reference: `sha256:${hashes[i]}`, uploaded_at: at, uploaded_by: actor, version: 1, content_hash: hashes[i], size_bytes: d.file.bytes.length, media_type: d.file.media_type || ALLOWED_TYPES[d.file.name.toLowerCase().split('.').pop()], status: 'current' }, { actor, action: 'submission document stored' });
    }
    if (key) tx.remember(key, 'SolicitationResponse', r.id);
    return r;
  });
  // A valid submission addresses any open error for the same respondent.
  for (const inc of store.list('Incident', (i) => i.component === COMPONENT && i.status !== 'resolved' && i.title.includes(`[${name}]`))) {
    await store.update('Incident', inc.id, { status: 'resolved', resolved_at: store.now().toISOString(), root_cause: `Addressed: ${response.id} submitted correctly.` }, { actor, action: 'submission error addressed' });
  }
  return response;
}

export async function addressSubmissionError(store, id, { actor, root_cause }) {
  const inc = store.get('Incident', id);
  if (!inc || inc.component !== COMPONENT) throw new SubmissionError(`${id} is not a submission error.`);
  if (inc.status === 'resolved') throw new SubmissionError(`${id} is already resolved.`);
  if (!String(root_cause ?? '').trim()) throw new SubmissionError('Say what caused it and what was done.');
  return store.update('Incident', id, { status: 'resolved', resolved_at: store.now().toISOString(), root_cause: root_cause.trim() }, { actor, action: 'submission error addressed' });
}

/** Move a response along: submitted → under evaluation → awarded / not awarded. */
export async function setResponseStatus(store, id, to, { actor }) {
  const r = store.get('SolicitationResponse', id);
  if (!r) throw new SubmissionError(`${id} does not exist.`);
  if (!(STATUS_FLOW[r.status] ?? []).includes(to)) throw new SubmissionError(`${id} is ${r.status}; it cannot move to ${to}.`);
  return store.update('SolicitationResponse', id, { status: to }, { actor, action: `response ${to}` });
}

/** Check a stored response still matches its receipt: every document present and unchanged. */
export async function verifyReceipt(store, blobs, id) {
  const r = store.get('SolicitationResponse', id);
  const docs = store.list('ResponseDocument', (d) => d.response === id);
  const pairs = [];
  for (const d of docs) {
    const bytes = await blobs.get(d.content_hash);
    if (!bytes || (await hashBytes(bytes)) !== d.content_hash) return { ok: false, reason: `${d.kind} is missing or changed.` };
    pairs.push([d.kind, d.content_hash]);
  }
  return (await sha256(JSON.stringify(pairs))) === r.receipt_hash ? { ok: true } : { ok: false, reason: 'The documents do not match the receipt.' };
}

export const submissions = (store) => store.list('SolicitationResponse', (r) => r.status !== 'draft');
export const submissionErrors = (store) => store.list('Incident', (i) => i.component === COMPONENT);
/** The tracking history of one response, from the audit log. */
export const trackingLog = (store, id) => store.audit().filter((e) => e.record_id === id || (e.entity === 'ResponseDocument' && store.get('ResponseDocument', e.record_id)?.response === id));
