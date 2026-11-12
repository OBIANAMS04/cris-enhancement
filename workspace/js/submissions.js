// STORY-008: the Submissions page: record responses received, see errors and address them, track each response.
import { h, table, section, empty } from '../../assets/js/ui.js';
import { head, when, person, badge, flash, act, field, form, button, onClick } from './common.js';
import { submitResponse, verifyReceipt, setResponseStatus, submissionErrors, addressSubmissionError, trackingLog, submissions as listSubmissions, STATUS_FLOW } from '../../lib/submissions.js';

export function submissionsPage(page, rest, ctx) {
  const sol = ctx.solicitation;
  if (!sol || sol.error) return h('div', {}, ...head(page, 'Submissions'), h('div', { class: 'notice notice--bad', role: 'alert' }, 'The solicitation settings (content/solicitation.json) could not be read, so no response can be recorded.'));
  if (rest[0]) return responsePage(page, rest[0], ctx);
  const s = ctx.store;
  const list = listSubmissions(s).reverse();
  const errors = submissionErrors(s).reverse();
  const inputs = sol.required_documents.map((kind, i) => h('input', { type: 'file', name: `doc${i}`, id: `doc${i}` }));
  return h(
    'div',
    {},
    ...head(page, 'Submissions', 'Responses received for the solicitation. Each is checked before it is stored: on time, every required document, accepted file types. A stored response gets a receipt that proves its documents have not changed.'),
    h('p', { class: 'notice notice--warn', role: 'note' }, h('strong', {}, 'Euna Procurement: '), sol.euna?.note ?? 'not connected.', ` Closing time: ${sol.closes_note}.`),
    flash(ctx),
    section(
      'Record a response',
      form('form', [
        field('Respondent', h('input', { name: 'respondent', required: true, placeholder: 'Vendor A Demo' })),
        ...sol.required_documents.map((kind, i) => field(kind, inputs[i], 'Required.')),
        h('div', { class: 'actions' }, button('Record the response')),
      ], async (fd) => {
        const documents = [];
        for (let i = 0; i < sol.required_documents.length; i++) {
          const file = fd.get(`doc${i}`);
          if (file && file.size) documents.push({ kind: sol.required_documents[i], file: { name: file.name, bytes: new Uint8Array(await file.arrayBuffer()), media_type: file.type } });
        }
        act(ctx, () => submitResponse(s, ctx.blobs, sol, { respondent: fd.get('respondent'), documents, actor: ctx.actor }), (r) => ({ tone: 'ok', title: `${r.id} recorded for ${r.respondent}.`, body: `Receipt ${r.receipt_hash.slice(0, 16)}…` }));
      }),
    ),
    section('Responses', list.length ? table(['Response', 'Respondent', 'Status', 'Submitted', 'Received by', 'Receipt'], list.map((r) => [h('a', { href: `#/submissions/${r.id}` }, r.id), r.respondent, badge(r.status), when(r.submitted_at), person(ctx, r.received_by), h('span', { class: 'hash' }, `${r.receipt_hash.slice(0, 12)}…`)])) : empty({ title: 'No responses yet', body: 'Responses recorded here are tracked from receipt to award.' })),
    section(
      'Submission errors',
      errors.length
        ? errors.map((i) => h('div', { class: 'form' }, h('p', {}, h('strong', {}, i.id), ' ', badge(i.status), ` · ${when(i.detected_at)} · `, i.title), i.status === 'resolved' ? h('p', {}, h('strong', {}, 'Addressed: '), i.root_cause) : form('form form--inline', [field('Cause and action taken', h('input', { name: 'cause', required: true })), h('div', { class: 'actions' }, button('Mark addressed', 'btn btn--quiet'))], (fd) => act(ctx, () => addressSubmissionError(s, i.id, { actor: ctx.actor, root_cause: fd.get('cause') }), `${i.id} addressed.`))))
        : empty({ title: 'No errors', body: 'A submission that fails is logged here until it is addressed.' }),
    ),
  );
}

function responsePage(page, id, ctx) {
  const s = ctx.store;
  const r = s.get('SolicitationResponse', id);
  if (!r) return h('div', {}, h('h1', { tabindex: '-1' }, 'No such response'), h('p', {}, h('a', { href: '#/submissions' }, 'Back to Submissions'), '.'));
  const docs = s.list('ResponseDocument', (d) => d.response === id);
  const verdict = h('span', { class: 'pill pill--unknown' }, 'Checking the receipt…');
  verifyReceipt(s, ctx.blobs, id).then((v) => {
    verdict.className = `pill pill--${v.ok ? 'ok' : 'bad'}`;
    verdict.textContent = v.ok ? 'Documents match the receipt' : `Receipt check failed: ${v.reason}`;
  });
  const next = STATUS_FLOW[r.status] ?? [];
  return h(
    'div',
    {},
    h('nav', { class: 'crumbs', 'aria-label': 'Breadcrumb' }, h('a', { href: '#/submissions' }, 'Submissions'), ' › ', h('span', { 'aria-current': 'page' }, id)),
    ...head(page, `${id}: ${r.respondent}`, `Submitted ${when(r.submitted_at)}, received by ${person(ctx, r.received_by)}.`),
    flash(ctx),
    h('p', {}, 'Status: ', badge(r.status), ' ', verdict, ' ', h('span', { class: 'hash' }, r.receipt_hash)),
    next.length ? h('div', { class: 'actions' }, next.map((to) => onClick(h('button', { type: 'button', class: 'btn btn--quiet' }, `Move to ${to}`), () => act(ctx, () => setResponseStatus(s, id, to, { actor: ctx.actor }), `${id} is now ${to}.`)))) : null,
    section('Documents', table(['Document', 'Kind', 'File', 'Size'], docs.map((d) => [d.id, d.kind, d.title, `${Math.max(1, Math.round(d.size_bytes / 1024))} KB`]))),
    section('Tracking', table(['When', 'Who', 'What'], trackingLog(s, id).reverse().map((e) => [when(e.at), person(ctx, e.actor), e.action]), 'Every step of this response, from the audit log')),
  );
}
