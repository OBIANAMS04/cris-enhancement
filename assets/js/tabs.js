// The nine tabs, in order. `summary` and `reads` describe the tab itself; no plan content lives here.

/**
 * STORY-000 asks for the Overview first, then a stop for review. While this is true the Overview carries a
 * banner and the other eight tabs say they are not built yet. Set to false when the rest is built.
 */
export const BUILD_PAUSED_AT_OVERVIEW = true;

export const TABS = [
  { id: 'overview', label: 'Overview', built: true },
  {
    id: 'outcomes',
    label: 'Outcomes',
    summary: 'The numbers this project has to move, one card per measure, each opening its own page.',
    reads: 'plan.derived.measures',
  },
  {
    id: 'users',
    label: 'Users and use case',
    summary: 'Who the system is for and what each role is trying to get done, with the story sentences each role came from.',
    reads: 'plan.derived.roles and plan.stories[].narrative',
  },
  {
    id: 'guardrails',
    label: 'Guardrails',
    summary: 'What must never happen, and whether anything in the build enforces each promise yet.',
    reads: 'plan.derived.guardrails, plan.requirements[].fulfilled_by and the verification state in progress.json',
  },
  {
    id: 'systems',
    label: 'Systems',
    summary: 'What this connects to, one row per system, each with a status indicator that stays grey until the system itself reports.',
    reads: 'plan.derived.systems',
  },
  {
    id: 'project',
    label: 'Project management',
    summary: 'A Gantt view of the releases and, under it, every task with its due date and its first-given date.',
    reads: 'plan.releases, plan.schedule, plan.stories[].due_on and due_baseline_on, and progress.json',
  },
  {
    id: 'agents',
    label: 'AI agents',
    summary: 'Who owns each story, and the design of each agent once one is scoped. No run history is shown until an agent has run.',
    reads: 'plan.agents and plan.stories[].owner_agent',
  },
  {
    id: 'knowledge',
    label: 'Knowledge base',
    summary: 'Requirements, stories and decisions, a traceability table, and a question panel that answers from this data and says which tab it came from.',
    reads: 'plan.requirements and plan.stories',
  },
  {
    id: 'data-model',
    label: 'Data model',
    summary: 'The tables behind the system, with their fields and relationships, derived from the requirements.',
    reads: 'plan.requirements',
  },
];
