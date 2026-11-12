// The Milestone 1 pages. Each page only calls the functions in lib/ (which hold the rules and are unit-tested) and
// draws what the store returns. Text from the store is always added as text, never as HTML.
import { h } from '../../assets/js/ui.js';
import { helpDesk } from './helpdesk.js';
import { support } from './support.js';
import { monitoring } from './monitoring.js';
import { reports } from './reports.js';
import { features } from './features.js';
import { training } from './training.js';
import { reportingEngine } from './reporting.js';
import { documents } from './documents.js';
import { compliance } from './compliance.js';
import { submissionsPage } from './submissions.js';
import { audit, tables } from './audit.js';

export const PAGES = [
  { id: 'help-desk', label: 'Help desk', story: 'STORY-001', req: 'REQ-002' },
  { id: 'support', label: 'Support dashboard', story: 'STORY-012', req: 'REQ-001' },
  { id: 'monitoring', label: 'Monitoring', story: 'STORY-002', req: 'REQ-003' },
  { id: 'reports', label: 'Performance reports', story: 'STORY-003', req: 'REQ-005' },
  { id: 'features', label: 'Feature development', story: 'STORY-004', req: 'REQ-006' },
  { id: 'training', label: 'Training', story: 'STORY-005', req: 'REQ-007' },
  { id: 'reporting-engine', label: 'Reporting engine', story: 'STORY-006', req: 'REQ-009' },
  { id: 'documents', label: 'Documents', story: 'STORY-013', req: 'REQ-013' },
  { id: 'compliance', label: 'Compliance', story: 'STORY-007', req: 'REQ-010' },
  { id: 'submissions', label: 'Submissions', story: 'STORY-008', req: 'REQ-012' },
  { id: 'audit', label: 'Audit log' },
  { id: 'tables', label: 'Tables' },
];

const RENDER = { 'help-desk': helpDesk, support, monitoring, reports, features, training, 'reporting-engine': reportingEngine, documents, compliance, submissions: submissionsPage, audit, tables };

export function renderPage(page, rest, ctx) {
  if (!page) return h('div', {}, h('h1', { tabindex: '-1' }, 'Page not found'), h('p', {}, 'There is no workspace page at this address. ', h('a', { href: '#/help-desk' }, 'Go to the Help desk'), '.'));
  return RENDER[page.id](page, rest, ctx);
}

