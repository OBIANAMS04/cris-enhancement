// Trust, shared by every story: the audit log with its chain check, and the tables of the data model.
import { h, table, section } from '../../assets/js/ui.js';
import { head, when, person, flash, onClick, download } from './common.js';


export function audit(page, rest, ctx) {
  const s = ctx.store;
  const only = rest[0];
  const lines = s.audit().filter((e) => !only || e.record_id === only).reverse();
  const verdict = h('p', { class: 'notice notice--warn', role: 'status' }, 'Checking the chain…');
  s.verifyAudit().then((v) => {
    verdict.className = `notice notice--${v.ok ? 'ok' : 'bad'}`;
    verdict.textContent = v.ok ? `The chain is intact: all ${v.count} lines match their hashes and follow on from each other.` : `The chain is broken: ${v.reason}.`;
  });
  let armed = false;
  const reset = h('button', { type: 'button', class: 'btn btn--danger' }, 'Start a new, empty demo');
  reset.addEventListener('click', async () => {
    if (!armed) {
      armed = true;
      reset.textContent = 'Press again to wipe this browser’s demo data';
      return;
    }
    s.reset();
    await ctx.blobs?.clear?.();
    const { seedPeople } = await import('../../lib/seed.js');
    await seedPeople(s, ctx.peopleSeed);
    ctx.flash = { tone: 'ok', title: 'A new, empty demo store was started.' };
    ctx.rerender();
  });
  return h(
    'div',
    {},
    ...head(page, only ? `Audit log for ${only}` : 'Audit log', 'Every action anyone takes in the workspace, in order. Each line carries the hash of the line before, so a changed or missing line breaks the chain and is reported here.'),
    flash(ctx),
    verdict,
    only ? h('p', {}, h('a', { href: '#/audit' }, 'Show every line')) : null,
    table(['#', 'When', 'Who', 'Action', 'Table', 'Record', 'Hash'], lines.slice(0, 300).map((e) => [e.seq, when(e.at), person(ctx, e.actor), e.action, e.entity, e.record_id, h('span', { class: 'hash' }, `${e.hash.slice(0, 12)}…`)]), `${lines.length} lines, newest first${lines.length > 300 ? ' (latest 300 shown)' : ''}`),
    section(
      'Keep or start over',
      h('div', { class: 'actions' }, onClick(h('button', { type: 'button', class: 'btn btn--quiet' }, 'Download the audit log'), () => download('audit-log.json', JSON.stringify(s.audit(), null, 2))), reset),
      h('p', { class: 'source' }, 'Starting over only affects the demo data in this browser.'),
    ),
  );
}

export function tables(page, rest, ctx) {
  const s = ctx.store;
  const all = [...s.schema.tables.values()];
  const snap = s.snapshot();
  return h(
    'div',
    {},
    ...head(page, 'Tables', `The ${all.length} tables of the data model, created as proposed in the Command Center's Data model tab. Milestone 1 writes to the ones with rows.`),
    table(['Table', 'Fields', 'Rows here', ''], all.map((t) => [t.name, t.fields.length, (snap.tables[t.name] ?? []).length, h('a', { href: `../#/data-model/entity/${t.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}` }, 'Fields and source')])),
  );
}
