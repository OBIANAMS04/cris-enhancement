// The Milestone 1 pages. Each page only calls the functions in lib/ (which hold the rules and are unit-tested) and
// draws what the store returns. Text from the store is always added as text, never as HTML.
import { h } from '../../assets/js/ui.js';
import { helpDesk } from './helpdesk.js';
import { support } from './support.js';
import { monitoring } from './monitoring.js';
import { reports } from './reports.js';
import { features } from './features.js';
import { audit, tables } from './audit.js';

export const PAGES = [
  { id: 'help-desk', label: 'Help desk', story: 'STORY-001', req: 'REQ-002' },
  { id: 'support', label: 'Support dashboard', story: 'STORY-012', req: 'REQ-001' },
  { id: 'monitoring', label: 'Monitoring', story: 'STORY-002', req: 'REQ-003' },
  { id: 'reports', label: 'Performance reports', story: 'STORY-003', req: 'REQ-005' },
  { id: 'features', label: 'Feature development', story: 'STORY-004', req: 'REQ-006' },
  { id: 'audit', label: 'Audit log' },
  { id: 'tables', label: 'Tables' },
];

const RENDER = { 'help-desk': helpDesk, support, monitoring, reports, features, audit, tables };

export function renderPage(page, rest, ctx) {
  if (!page) return h('div', {}, h('h1', { tabindex: '-1' }, 'Page not found'), h('p', {}, 'There is no workspace page at this address. ', h('a', { href: '#/help-desk' }, 'Go to the Help desk'), '.'));
  return RENDER[page.id](page, rest, ctx);
}

