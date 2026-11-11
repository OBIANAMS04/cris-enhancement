// STORY-013 Document management: uploads are stored, retrieval is timed against 2 s, all access and changes are logged.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { setup } from './helpers.mjs';
import { uploadDocument, openDocument, library, documentLog, memoryBlobs, TARGET_MS, DocumentError } from '../lib/documents.js';

const file = (name, text = 'Technical proposal, draft 1') => ({ name, bytes: new TextEncoder().encode(text), media_type: '' });
const roles = (store) => Object.fromEntries(store.list('Person').map((p) => [p.role, p.id]));

test('STORY-013: an uploaded document is stored in the document management system', async () => {
  const { store } = await setup();
  const blobs = memoryBlobs();
  const r = roles(store);
  const doc = await uploadDocument(store, blobs, { actor: r['compliance officer'], title: 'Technical proposal', category: 'Technical proposal', file: file('proposal.pdf') });
  assert.equal(doc.status, 'current');
  assert.equal(doc.version, 1);
  assert.equal(doc.media_type, 'application/pdf');
  assert.equal(blobs.size(), 1);
  assert.equal(store.list('SolicitationResponse').length, 1);
  assert.equal(library(store).find((c) => c.category === 'Technical proposal').docs.length, 1);
});

test('STORY-013: a stored document is retrieved within 2 seconds and matches its hash', async () => {
  const { store } = await setup();
  const blobs = memoryBlobs();
  const r = roles(store);
  const doc = await uploadDocument(store, blobs, { actor: r['procurement officer'], category: 'Pricing', file: file('pricing.xlsx', 'prices') });
  const got = await openDocument(store, blobs, { actor: r['TxDOT contract manager'], id: doc.id });
  assert.ok(got.ms < TARGET_MS);
  assert.equal(got.withinTarget, true);
  assert.equal(got.intact, true);
  assert.equal(new TextDecoder().decode(got.bytes), 'prices');
});

test('STORY-013 Trust: every upload, replacement, opening and refused attempt is logged', async () => {
  const { store, user } = await setup();
  const blobs = memoryBlobs();
  const r = roles(store);
  const v1 = await uploadDocument(store, blobs, { actor: r['compliance officer'], category: 'Forms and certifications', file: file('forms.pdf', 'v1') });
  const v2 = await uploadDocument(store, blobs, { actor: r['compliance officer'], category: 'Forms and certifications', file: file('forms.pdf', 'v2'), replaces: v1.id });
  assert.equal(v2.version, 2);
  assert.equal(store.get('ResponseDocument', v1.id).status, 'superseded');
  await openDocument(store, blobs, { actor: r['procurement officer'], id: v2.id });
  await assert.rejects(openDocument(store, blobs, { actor: user, id: v2.id }), /Access refused/);
  assert.deepEqual(documentLog(store, v2.id).map((e) => e.action), ['document replaced (version 2)', 'document opened', 'document access refused']);
  assert.ok(documentLog(store, v1.id).some((e) => e.action === 'document superseded'));
  assert.equal((await store.verifyAudit()).ok, true);
});

test('STORY-013 failure paths: refused upload, wrong type, empty file, failed store, missing content', async () => {
  const { store, user } = await setup();
  const r = roles(store);
  const officer = r['compliance officer'];
  await assert.rejects(uploadDocument(store, memoryBlobs(), { actor: user, category: 'Other', file: file('a.pdf') }), /Access refused/);
  await assert.rejects(uploadDocument(store, memoryBlobs(), { actor: officer, category: 'Other', file: file('a.exe') }), (e) => e instanceof DocumentError && /not accepted/.test(e.problems.join()));
  await assert.rejects(uploadDocument(store, memoryBlobs(), { actor: officer, category: 'Other', file: { name: 'a.pdf', bytes: new Uint8Array() } }), (e) => /empty/.test(e.problems.join()));
  const broken = { put: async () => { throw new Error('quota exceeded'); }, get: async () => null };
  await assert.rejects(uploadDocument(store, broken, { actor: officer, category: 'Other', file: file('a.pdf') }), /could not keep it/);
  assert.equal(store.list('ResponseDocument').length, 0, 'a failed store records nothing');
  const blobs = memoryBlobs();
  const doc = await uploadDocument(store, blobs, { actor: officer, category: 'Other', file: file('b.pdf') });
  await blobs.clear();
  await assert.rejects(openDocument(store, blobs, { actor: officer, id: doc.id }), /could not be retrieved/);
  assert.ok(store.audit().some((e) => e.action === 'document retrieval failed'));
});
