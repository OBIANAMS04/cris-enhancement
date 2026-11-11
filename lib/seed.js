// Put the synthetic people into an empty store, once. Safe to run twice: each person has an idempotency key.
export async function seedPeople(store, people) {
  for (const p of people) {
    await store.insert('Person', { display_name: p.display_name, role: p.role, organization: p.organization, on_duty: p.on_duty ?? false, cyber_training_completed_on: p.cyber_training_completed_on }, { actor: 'setup', action: 'demo person added', key: `seed:${p.display_name}` });
  }
  return store.list('Person');
}
