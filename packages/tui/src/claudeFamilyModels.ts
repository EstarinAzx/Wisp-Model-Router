import { FAMILY_KEYS, type FamilyKey, type ModelsDevCatalog } from '@wisp/core';

export type ClaudeFamilyModels = Record<FamilyKey, string>;

// Only stable, versioned Anthropic IDs are bind targets. Dated snapshots and preview variants
// can coexist with the public model ID. The picker can still offer them for manual routing.
export const latestClaudeFamilies = (catalog?: ModelsDevCatalog): ClaudeFamilyModels | undefined => {
  const models = catalog?.anthropic?.models;
  if (!models) return;
  const now = Date.now();
  const candidates = Object.keys(models).filter(id => {
    const entry = models[id];
    return entry && (!entry.status || entry.status === 'active') && typeof entry.release_date === 'string'
      && Date.parse(entry.release_date) <= now;
  }).sort((a, b) => b.localeCompare(a, 'en', { numeric: true }));
  const entries = [];
  for (const family of FAMILY_KEYS) {
    const stableId = new RegExp(`^claude-${family}-\\d{1,3}(?:-\\d{1,3})*$`);
    const latest = candidates.find(id => stableId.test(id));
    if (!latest) return;
    entries.push([family, latest]);
  }
  return Object.fromEntries(entries);
};
