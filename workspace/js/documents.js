// STORY-013: the Documents page: upload response documents by category, open them (timed, hash-checked), see who did what.
import { h, table, section, empty } from '../../assets/js/ui.js';
import { head, when, person, badge, flash, act, field, form, button, onClick } from './common.js';
import { uploadDocument, openDocument, library, documentLog, CATEGORIES, ACCESS_ROLES, MAX_BYTES, TARGET_MS, ALLOWED_TYPES } from '../../lib/documents.js';

const size = (n) => (n >= 1048576 ? `${(n / 1048576).toFixed(1)} MB` : n >= 1024 ? `${Math.round(n / 1024)} KB` : `${n} bytes`);

export function documents(page, rest, ctx) {
  if (rest[0]) return documentPage(page, rest[0], ctx);
  const s = ctx.store;
  const lib = library(s);
  const current = lib.flatMap((c) => c.docs);
  const me = s.get('Person', ctx.actor);
  const mayUse = me && ACCESS_ROLES.has(me.role);
  const fileInput = h('input', { name: 'file', type: 'file', required: true, accept: Object.keys(ALLOWED_TYPES).map((x) => `.${x}`).join(',') });
  return h(
    'div',
    {},
    ...head(page, 'Documents', 'Every document the response needs, stored by category. Each file is kept with its fingerprint, opened against a 2 second target, and every upload, opening and refused attempt is logged.'),
    h('p', { class: `notice notice--${mayUse ? 'ok' : 'warn'}`, role: 'note' }, mayUse ? `${me.display_name} may upload and open response documents.` : `Only ${[...ACCESS_ROLES].join(', ')} may upload or open response documents. As ${me?.display_name ?? 'this person'}, any attempt is refused and logged.`),
    ctx.blobs?.persistent === false ? h('p', { class: 'notice notice--warn' }, 'This browser refuses file storage, so uploaded files last only until the page is closed.') : null,
    flash(ctx),
    section(
      'Upload',
      form('form', [
        field('File', fileInput, `${Object.keys(ALLOWED_TYPES).join(', ')}; up to ${MAX_BYTES / 1048576} MB.`),
        field('Title', h('input', { name: 'title', placeholder: 'Taken from the file name if left empty' })),
        field('Category', h('select', { name: 'category' }, CATEGORIES.map((c) => h('option', { value: c }, c)))),
        field('Replaces', h('select', { name: 'replaces' }, [h('option', { value: '' }, 'Nothing: a new document'), ...current.map((d) => h('option', { value: d.id }, `${d.id} ${d.title} (v${d.version})`))]), 'A replacement keeps the old version, marked superseded.'),
        h('div', { class: 'actions' }, button('Upload')),
      ], async (fd) => {
        const f = fd.get('file');
        const bytes = f && f.size ? new Uint8Array(await f.arrayBuffer()) : new Uint8Array();
        act(ctx, () => uploadDocument(s, ctx.blobs, { actor: ctx.actor, title: fd.get('title'), category: fd.get('category'), replaces: fd.get('replaces') || undefined, file: { name: f?.name ?? '', bytes, media_type: f?.type ?? '' } }), (d) => ({ tone: 'ok', title: `${d.id} stored (${size(d.size_bytes)}, version ${d.version}).` }));
      }),
    ),
    ...lib.map((c) => section(`${c.category} (${c.docs.length})`, c.docs.length ? table(['Document', 'Title', 'Version', 'Size', 'Uploaded', ''], c.docs.map((d) => [h('a', { href: `#/documents/${d.id}` }, d.id), d.title, `v${d.version}`, size(d.size_bytes), `${when(d.uploaded_at)} by ${person(ctx, d.uploaded_by)}`, h('a', { href: `#/documents/${d.id}` }, 'Open')])) : h('p', { class: 'muted' }, 'Nothing stored yet.'))),
  );
}

function documentPage(page, id, ctx) {
  const s = ctx.store;
  const d = s.get('ResponseDocument', id);
  if (!d) return h('div', {}, h('h1', { tabindex: '-1' }, 'No such document'), h('p', {}, h('a', { href: '#/documents' }, 'Back to Documents'), '.'));
  const result = h('div', { id: 'open-result' });
  const open = onClick(h('button', { type: 'button', class: 'btn' }, 'Open the document'), async () => {
    try {
      const r = await openDocument(s, ctx.blobs, { actor: ctx.actor, id });
      const preview = /^text\//.test(d.media_type) ? h('pre', { class: 'preview' }, new TextDecoder().decode(r.bytes.slice(0, 4000))) : null;
      const url = URL.createObjectURL(new Blob([r.bytes], { type: d.media_type }));
      result.replaceChildren(h('div', { class: `notice notice--${r.withinTarget && r.intact ? 'ok' : 'warn'}`, role: 'status' }, h('strong', {}, `Retrieved in ${r.ms} ms`), ` (target ${TARGET_MS} ms). `, r.intact ? 'The content matches its fingerprint.' : 'The content does NOT match its fingerprint.', ' The opening is logged.'), preview, h('p', {}, h('a', { href: url, download: d.title }, 'Save a copy')));
    } catch (err) {
      result.replaceChildren(h('div', { class: 'notice notice--bad', role: 'alert' }, err.message));
    }
    ctx.rerenderLog?.();
  });
  const logBox = h('div', {});
  const drawLog = () => logBox.replaceChildren(table(['When', 'Who', 'What'], documentLog(s, id).reverse().map((e) => [when(e.at), person(ctx, e.actor), e.action]), 'Everything done to this document'));
  ctx.rerenderLog = drawLog;
  drawLog();
  return h(
    'div',
    {},
    h('nav', { class: 'crumbs', 'aria-label': 'Breadcrumb' }, h('a', { href: '#/documents' }, 'Documents'), ' › ', h('span', { 'aria-current': 'page' }, id)),
    ...head(page, `${id}: ${d.title}`, `${d.kind} · version ${d.version} · ${size(d.size_bytes)} · uploaded ${when(d.uploaded_at)} by ${person(ctx, d.uploaded_by)}.`),
    h('p', {}, badge(d.status), ' ', h('span', { class: 'hash' }, d.file_reference)),
    h('div', { class: 'actions' }, open),
    result,
    section('Access and changes', logBox),
  );
}
