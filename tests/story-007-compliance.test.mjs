// STORY-007 Compliance: a check finds no violations, a legal update changes the system, every check is logged.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { setup } from './helpers.mjs';
import { syncRules, runCompliance, applyLegalUpdate, complianceStatus, violations, scanDocument, ComplianceError } from '../lib/compliance.js';
import { scheduleSession, holdSession, takeCheck, courseById } from '../lib/training.js';

const register = JSON.parse(await readFile(new URL('../content/compliance-rules.json', import.meta.url), 'utf8'));
const materials = JSON.parse(await readFile(new URL('../content/training-materials.json', import.meta.url), 'utf8'));
const cleanPage = { accessibility: () => [] };

test('STORY-007: the register is complete and each rule names a verified source', () => {
  assert.ok(register.rules.length >= 8);
  for (const r of register.rules) {
    assert.match(r.id, /^CR-\d\d$/);
    assert.ok(['federal', 'state', 'local'].includes(r.jurisdiction), r.id);
    assert.match(r.source_url, /^https:\/\//, r.id);
    assert.ok(r.source_reference && r.check, r.id);
  }
});

test('STORY-007: a compliance check of the workspace finds no violations', async () => {
  const { store, admin } = await setup();
  await syncRules(store, register, admin);
  const checks = await runCompliance(store, { actor: admin, env: cleanPage });
  assert.equal(checks.length, register.rules.length);
  assert.deepEqual(checks.filter((c) => c.result === 'fail'), []);
  const by = Object.fromEntries(checks.map((c) => [c.rule, c.result]));
  assert.equal(by['CR-08'], 'pass', 'vendor staff trained within a year');
  assert.equal(by['CR-10'], 'pass', 'audit controls hold');
  assert.equal(by['CR-02'], 'not applicable', 'no crash report releases in this build');
  assert.match(checks.find((c) => c.rule === 'CR-02').evidence, /holds no crash reports/);
  assert.equal(violations(store).length, 0);
});

test('STORY-007: a legal update is applied to the system and re-checked at once', async () => {
  const ctx = await setup();
  const { store, admin } = ctx;
  await syncRules(store, register, admin);
  await runCompliance(store, { actor: admin, env: cleanPage });
  // The law tightens: training must now be within 30 days. Both vendor staff trained on 1 Oct, 41 days ago.
  const { rule, check } = await applyLegalUpdate(store, 'CR-08', { actor: admin, summary: 'Training must be renewed every 30 days.', parameters: { valid_days: 30 }, effective_on: '2026-11-11' });
  assert.equal(rule.version, 2);
  assert.equal(check.rule_version, 2);
  assert.equal(check.result, 'fail');
  assert.equal(violations(store).length, 1);
  assert.ok(store.audit().some((e) => e.action === 'compliance violation found'));
  // The system is brought into line: vendor staff complete the cyber security course.
  const s = await scheduleSession(store, materials, { course: 'COURSE-CYBER', scheduled_at: '2026-11-11T16:00:00.000Z', trainer: admin });
  ctx.now.set('2026-11-11T17:00:00.000Z');
  await holdSession(store, s.id, { actor: admin, recording_reference: 'rec/cyber.mp4' });
  const answers = courseById(materials, 'COURSE-CYBER').questions.map((q) => q.answer);
  for (const p of [ctx.admin, ctx.dev]) await takeCheck(store, materials, { session: s.id, person: p, answers });
  await runCompliance(store, { actor: admin, env: cleanPage });
  assert.equal(violations(store).length, 0);
});

test('STORY-007: a check made before a legal update shows as stale until it is re-run', async () => {
  const { store, admin } = await setup();
  await syncRules(store, register, admin);
  await runCompliance(store, { actor: admin, env: cleanPage });
  await store.update('ComplianceRule', 'CR-13', { version: 2 }, { actor: admin, action: 'legal update recorded elsewhere' });
  assert.equal(complianceStatus(store).find((x) => x.rule.id === 'CR-13').state, 'stale');
});

test('STORY-007 Trust: every compliance check is logged with its evidence, and a broken audit trail is a violation', async () => {
  const { store, admin } = await setup();
  await syncRules(store, register, admin);
  const checks = await runCompliance(store, { actor: admin, env: cleanPage });
  for (const c of checks) assert.ok(store.audit().some((e) => e.record_id === c.id), c.rule);
  assert.ok(checks.every((c) => c.evidence.length > 10));
  await assert.rejects(runCompliance(store, {}), ComplianceError);
  const failing = await runCompliance(store, { actor: admin, env: { accessibility: () => ['a select named "x" has no label'] } });
  assert.equal(failing.find((c) => c.rule === 'CR-13').result, 'fail');
});

test('STORY-007: the accessibility scan finds unlabeled controls and images without alt text', () => {
  const fake = {
    documentElement: { getAttribute: () => 'en' },
    querySelectorAll: (sel) => (sel === 'img' ? [{ hasAttribute: () => false, getAttribute: () => 'x.png' }] : sel === 'button' ? [] : [{ labels: [], getAttribute: () => null, type: 'text', tagName: 'INPUT', name: 'q', closest: () => null }]),
  };
  assert.equal(scanDocument(fake).length, 2);
});
