// Tab 6, Project management: a Gantt view of the releases and every task with its due date.
// Source: plan.releases, plan.schedule, plan.stories[].due_on and due_baseline_on, and progress.json for state.
// When the plan carries dates the chart is drawn on a calendar; when it does not, it is drawn on the plan's
// week numbers and says so, because those are the only timing the file holds.
import { h, card, empty, section, source, table, link, statePill, pill } from '../ui.js';
import { tabHead, subPage, notFound, model, storyPage, storyCell } from './common.js';
import { releaseRows, releaseWindow, formatDate } from '../data.js';

const SVG = 'http://www.w3.org/2000/svg';
const DAY = 86400000;
function s(tag, attrs, ...kids) {
  const el = document.createElementNS(SVG, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  kids.flat().forEach((kid) => el.append(kid instanceof Node ? kid : document.createTextNode(String(kid))));
  return el;
}

function barTone(r) {
  if (r.stories.length && r.verified === r.stories.length) return 'gantt__bar--done';
  if (r.stories.some((x) => x.state && x.state !== 'not_started')) return 'gantt__bar--active';
  return 'gantt__bar--todo';
}

/** Draws the releases as bars. Returns null when there is no timing at all. */
function gantt(releases, schedule, now) {
  const dated = releases.length && releases.every((r) => r.starts_on && r.ends_on);
  const weeks = releases.length && releases.every((r) => Number.isFinite(r.week_start) && Number.isFinite(r.week_end));
  if (!dated && !weeks) return null;
  const startOf = (r) => (dated ? Date.parse(r.starts_on) : r.week_start - 1);
  const endOf = (r) => (dated ? Date.parse(r.ends_on) + DAY : r.week_end);
  let lo = Math.min(...releases.map(startOf));
  let hi = Math.max(...releases.map(endOf));
  const demo = dated && schedule?.demo_day ? Date.parse(schedule.demo_day) : null;
  if (demo) hi = Math.max(hi, demo + DAY);
  const W = 800, L = 260, R = 20, rowH = 34, top = 30, H = top + releases.length * rowH + 34;
  const x = (v) => L + ((v - lo) / (hi - lo)) * (W - L - R);
  const g = s('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', class: 'gantt', 'aria-label': `Releases on a ${dated ? 'calendar' : 'plan-week'} scale` });
  // Ticks: every 5 days on a calendar, every 4 weeks on week numbers.
  const ticks = [];
  if (dated) for (let t = lo; t <= hi; t += 5 * DAY) ticks.push([t, formatDate(new Date(t).toISOString().slice(0, 10)).replace(/ \d{4}$/, '')]);
  else for (let w = lo; w <= hi; w += 4) ticks.push([w, `Week ${w + 1}`]);
  ticks.forEach(([t, label]) => {
    g.append(s('line', { x1: x(t), x2: x(t), y1: top - 8, y2: H - 30, class: 'gantt__grid' }));
    g.append(s('text', { x: x(t), y: H - 12, class: 'gantt__tick', 'text-anchor': 'middle' }, label));
  });
  releases.forEach((r, i) => {
    const y = top + i * rowH;
    const label = `${r.key} · ${r.name}`;
    g.append(s('text', { x: 0, y: y + 18, class: 'gantt__label' }, label.length > 38 ? `${label.slice(0, 36)}…` : label, s('title', {}, label)));
    const a = s('a', { href: link(`project/release/${r.key}`) });
    a.append(s('rect', { x: x(startOf(r)), y: y + 4, width: Math.max(4, x(endOf(r)) - x(startOf(r))), height: 20, rx: 3, class: `gantt__bar ${barTone(r)}` }, s('title', {}, `${r.key}: ${releaseWindow(r).text ?? ''}`)));
    g.append(a);
  });
  if (dated) {
    const today = now.getTime();
    if (today >= lo && today <= hi) {
      g.append(s('line', { x1: x(today), x2: x(today), y1: top - 14, y2: H - 30, class: 'gantt__today' }));
      g.append(s('text', { x: x(today) + 4, y: top - 16, class: 'gantt__today-label' }, 'Today'));
    }
    if (demo) {
      g.append(s('line', { x1: x(demo), x2: x(demo), y1: top - 14, y2: H - 30, class: 'gantt__demo' }));
      g.append(s('text', { x: x(demo) - 4, y: top - 16, class: 'gantt__demo-label', 'text-anchor': 'end' }, 'Demo day'));
    }
  }
  return { svg: g, dated };
}

function slipText(row) {
  if (!row.due_on || !row.due_baseline_on) return null;
  const d = Math.round((Date.parse(row.due_on) - Date.parse(row.due_baseline_on)) / DAY);
  return d === 0 ? 'On its first date' : d > 0 ? `Slipped ${d} day${d === 1 ? '' : 's'}` : `${-d} day${d === -1 ? '' : 's'} earlier`;
}

export function renderProject(tab, data, ctx, rest) {
  const plan = data.plan;
  const { rows, byId } = model(data);
  const releases = releaseRows(plan, rows);
  const [kind, id] = rest;

  if (kind === 'story') {
    const row = byId.get(id);
    return row ? storyPage(tab, row, plan) : notFound(tab, `story/${id}`);
  }
  if (kind === 'release') {
    const r = releases.find((x) => x.key === id);
    if (!r) return notFound(tab, `release/${id}`);
    return subPage(
      tab,
      `${r.key} · ${r.name}`,
      h('p', { class: 'lede' }, `${r.verified} of ${r.stories.length} stories verified. ${releaseWindow(r).text ?? 'No dates or weeks in the plan.'}`),
      r.goal ? h('p', {}, h('strong', {}, 'Goal: '), r.goal) : null,
      r.demo ? h('p', {}, h('strong', {}, 'What gets demonstrated: '), r.demo) : null,
      r.is_demo_target ? h('p', {}, pill('Demo target', 'submitted'), ' This is the release shown on demo day.') : null,
      taskTable(tab, r.stories),
    );
  }
  if (kind === 'schedule') {
    const sch = plan?.schedule;
    return subPage(
      tab,
      'Schedule',
      sch
        ? table(['', 'Date'], [['Build starts', formatDate(sch.build_start) ?? 'Not set'], ['Build ends', formatDate(sch.build_end) ?? 'Not set'], ['Demo day', formatDate(sch.demo_day) ?? 'Not set']], 'From plan.schedule')
        : empty({ title: 'No schedule in the plan file yet', body: 'Build start, build end and demo day will show here, with today marked on the chart.', next: 'A plan with dates is published and synced. The chart meanwhile uses the plan’s week numbers.' }),
    );
  }
  if (kind) return notFound(tab, rest.join('/'));

  const chart = gantt(releases, plan?.schedule, ctx.now);
  const tasks = releases.flatMap((r) => r.stories);
  return h(
    'div',
    {},
    ...tabHead(tab, 'The releases on one chart, and under it every task with its due date and the date it was first given.'),
    section(
      'Releases',
      chart
        ? [
            h('div', { class: 'chart' }, chart.svg),
            h('p', { class: 'source' }, chart.dated ? 'Drawn on the dates in the plan file.' : 'The plan file has no dates for its releases yet, so the chart is drawn on the plan’s week numbers and today cannot be marked on it.'),
            h('p', { class: 'legend' }, h('span', {}, h('i', { class: 'gantt__key gantt__bar--done' }), 'Every story verified'), h('span', {}, h('i', { class: 'gantt__key gantt__bar--active' }), 'Work under way'), h('span', {}, h('i', { class: 'gantt__key gantt__bar--todo' }), 'Not started or not checked')),
          ]
        : empty({ title: 'The plan has no timing for its releases', next: 'Release dates or week numbers are added to the plan.' }),
      h(
        'div',
        { class: 'grid grid--releases' },
        releases.map((r) => card({ to: `project/release/${r.key}`, label: r.key, value: r.name, note: `${r.verified} of ${r.stories.length} verified · ${releaseWindow(r).text ?? 'no timing'}` })),
        card({ to: 'project/schedule', label: 'Schedule', value: plan?.schedule?.demo_day ? formatDate(plan.schedule.demo_day) : 'Not in the plan yet', note: plan?.schedule ? 'Demo day.' : 'Build start, build end and demo day are empty in the plan file.', tone: plan?.schedule ? null : 'empty' }),
      ),
    ),
    section(`Every task (${tasks.length})`, taskTable(tab, tasks)),
    source('.colaberry/plan.json → releases, schedule, stories[].due_on and due_baseline_on; .colaberry/progress.json → verification.state'),
  );
}

function taskTable(tab, stories) {
  return table(
    ['Task', 'Release', 'Due', 'First given', 'Slippage', 'State'],
    stories.map((r) => [storyCell(tab, r), r.release ?? '—', formatDate(r.due_on) ?? 'No date yet', formatDate(r.due_baseline_on) ?? 'No date yet', slipText(r) ?? '—', statePill(r.state)]),
    'Tasks with their due dates',
  );
}
