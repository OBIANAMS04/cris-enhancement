// The tables of the workspace, read from content/data-model.json at runtime (the same file the Data model tab shows),
// and a check that a record fits its table before it is stored. Nothing here knows about any one story.
//
// A field is [name, type, note]. The note starting with "optional" makes the field optional; for a choice field the
// note lists the allowed values ("low, normal, high" or "TxDOT or vendor"). A type that names another table is a
// reference to a record in that table.

export class ValidationError extends Error {
  constructor(entity, problems) {
    super(`${entity}: ${problems.join('; ')}`);
    this.name = 'ValidationError';
    this.entity = entity;
    this.problems = problems;
  }
}

const ISO = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2}))?$/;

export const choices = (note) =>
  String(note ?? '')
    .split(/,\s*|\s+or\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

export const isOptional = (note) => /^optional\b/i.test(String(note ?? ''));

/** Build a lookup of tables from the data model file's contents. */
export function compileSchema(dataModel) {
  if (!dataModel?.entities?.length) throw new Error('The data model has no tables.');
  const tables = new Map();
  for (const e of dataModel.entities) {
    tables.set(e.name, { name: e.name, fields: e.fields.map(([name, type, note]) => ({ name, type, note: note ?? '', optional: isOptional(note) })) });
  }
  return { tables, status: dataModel.status, has: (n) => tables.has(n), table: (n) => tables.get(n) };
}

/**
 * Check one record against its table. `exists(table, id)` answers whether a referenced record is there.
 * Returns the list of problems; an empty list means the record fits.
 */
export function check(schema, entity, record, exists = () => true) {
  const t = schema.table(entity);
  if (!t) return [`there is no table called ${entity}`];
  const problems = [];
  const known = new Set(t.fields.map((f) => f.name));
  for (const key of Object.keys(record)) if (!known.has(key)) problems.push(`${key} is not a field of ${entity}`);
  for (const f of t.fields) {
    const v = record[f.name];
    if (v === undefined || v === null || v === '') {
      if (!f.optional) problems.push(`${f.name} is required`);
      continue;
    }
    const type = f.type;
    if (schema.has(type)) {
      if (typeof v !== 'string' || !exists(type, v)) problems.push(`${f.name} points to ${type} ${v}, which does not exist`);
    } else if (type === 'choice') {
      const allowed = choices(f.note.replace(/^optional;?\s*/i, ''));
      if (!allowed.includes(String(v))) problems.push(`${f.name} must be one of: ${allowed.join(', ')}`);
    } else if (type === 'number' || type === 'money') {
      if (typeof v !== 'number' || !Number.isFinite(v)) problems.push(`${f.name} must be a number`);
    } else if (type === 'timestamp' || type === 'date') {
      if (typeof v !== 'string' || !ISO.test(v) || Number.isNaN(Date.parse(v))) problems.push(`${f.name} must be a date`);
    } else if (type === 'yes or no') {
      if (typeof v !== 'boolean') problems.push(`${f.name} must be yes or no`);
    } else if (type === 'text' || type === 'identifier') {
      if (typeof v !== 'string') problems.push(`${f.name} must be text`);
    }
    // json: anything that survives JSON.stringify
  }
  return problems;
}
