// STORY-007: the Compliance page: the register of laws, a run of every check, violations, and legal updates.
import { h, table, section, empty } from '../../assets/js/ui.js';
import { head, when, person, badge, flash, act, field, form, button, onClick } from './common.js';
import { syncRules, runCompliance, applyLegalUpdate, complianceStatus, violations, scanDocument } from '../../lib/compliance.js';

const env = () => ({ accessibility: () => scanDocument(document) });

export function compliance(page, rest, ctx) {
  if (!ctx.compliance || ctx.compliance.error) return h('div', {}, ...head(page, 'Compliance'), h('div', { class: 'notice notice--bad', role: 'alert' }, 'The compliance register (content/compliance-rules.json) could not be read, so no check can run.'));
  const s = ctx.store;
  if (!s.list('ComplianceRule').length) {
    // Registering the rules is itself an audited action; do it once, the first time the page opens.
    syncRules(s, ctx.compliance, ctx.actor).then(() => ctx.rerender());
    return h('div', {}, ...head(page, 'Compliance'), h('p', { role: 'status' }, 'Registering the compliance rules…'));
  }
  const status = complianceStatus(s);
  const count = (st) => status.filter((x) => x.state === st).length;
  const v = violations(s);
  return h(
    'div',
    {},
    ...head(page, 'Compliance', 'The federal and state rules CRIS must follow, each with a check the system runs. A failed check is a violation: logged, and shown until a later run passes. When a law changes, the rule is updated and re-checked at once.'),
    h('p', { class: 'notice notice--warn', role: 'note' }, h('strong', {}, 'Source: '), ctx.compliance.note),
    flash(ctx),
    h('div', { class: 'grid grid--3' },
      h('div', { class: `card${v.length ? ' card--warn' : ''}` }, h('span', { class: 'card__label' }, 'Violations open'), h('span', { class: 'card__value' }, v.length)),
      h('div', { class: 'card' }, h('span', { class: 'card__label' }, 'Passing'), h('span', { class: 'card__value' }, count('pass'))),
      h('div', { class: 'card' }, h('span', { class: 'card__label' }, 'Not applicable to this build yet'), h('span', { class: 'card__value' }, count('not applicable'))),
    ),
    h('div', { class: 'actions' }, onClick(h('button', { type: 'button', class: 'btn' }, 'Run every compliance check'), () => act(ctx, () => runCompliance(s, { actor: ctx.actor, env: env() }), (checks) => {
      const fails = checks.filter((c) => c.result === 'fail');
      return fails.length ? { tone: 'bad', title: `${fails.length} violation(s) found and logged.`, items: fails.map((c) => `${c.rule}: ${c.evidence}`) } : { tone: 'ok', title: `All ${checks.length} rules checked: no violations found.` };
    }))),
    section(
      'Register',
      table(['Rule', 'Law', 'Level', 'Latest check', 'Evidence', 'Checked'], status.map((x) => [
        h('strong', {}, x.rule.id),
        [x.rule.title, h('br'), h('a', { href: x.rule.source_url, target: '_blank', rel: 'noopener' }, x.rule.source_reference), x.rule.version > 1 ? ` · version ${x.rule.version}` : ''],
        x.rule.jurisdiction,
        badge(x.state),
        x.last?.evidence ?? 'Not checked yet.',
        x.last ? `${when(x.last.checked_at)} by ${person(ctx, x.last.checked_by)}` : '—',
      ]), 'Every rule and where it stands'),
    ),
    section(
      'Record a legal update',
      form('form', [
        field('Rule', h('select', { name: 'rule' }, status.map((x) => h('option', { value: x.rule.id }, `${x.rule.id} ${x.rule.title}`)))),
        field('What changed', h('input', { name: 'summary', required: true, placeholder: 'Training must now be renewed every 180 days.' })),
        field('New values', h('input', { name: 'params', placeholder: 'valid_days=180' }), 'Optional: name=value pairs the rule\'s check uses, separated by commas. CR-08 uses valid_days; CR-12 uses retain_years.'),
        field('Takes effect', h('input', { name: 'effective', type: 'date' })),
        h('div', { class: 'actions' }, button('Apply and re-check')),
      ], (fd) => {
        const parameters = Object.fromEntries(String(fd.get('params') ?? '').split(',').map((p) => p.split('=').map((x) => x.trim())).filter(([k, val]) => k && val !== undefined).map(([k, val]) => [k, Number.isFinite(Number(val)) ? Number(val) : val]));
        act(ctx, () => applyLegalUpdate(s, fd.get('rule'), { actor: ctx.actor, summary: fd.get('summary'), parameters, effective_on: fd.get('effective'), env: env() }), ({ rule, check }) => ({ tone: check.result === 'fail' ? 'bad' : 'ok', title: `${rule.id} is now version ${rule.version} and was re-checked: ${check.result}.`, body: check.evidence }));
      }),
    ),
    section('Check history', (() => {
      const checks = s.list('ComplianceCheck').reverse().slice(0, 60);
      return checks.length ? table(['Check', 'Rule', 'Version', 'Result', 'When'], checks.map((c) => [c.id, c.rule, c.rule_version ?? 1, badge(c.result), when(c.checked_at)]), 'Latest 60 checks, newest first') : empty({ title: 'No checks yet', body: 'Run the checks above; each result is kept and logged.' });
    })()),
  );
}
