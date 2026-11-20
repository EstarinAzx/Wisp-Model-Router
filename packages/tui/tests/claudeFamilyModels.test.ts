import { expect, test } from 'bun:test';
import { latestClaudeFamilies } from '../src/claudeFamilyModels';

test('family bind selects stable published versions numerically and requires all four', () => {
  const released = { release_date: '2025-01-01' };
  const models = {
    'claude-opus-5-2': released, 'claude-opus-5-10': released,
    'claude-opus-7': { ...released, status: 'deprecated' },
    'claude-opus-8': { release_date: '2999-01-01' },
    'claude-opus-9-preview': released, 'claude-opus-10-20251001': released,
    'claude-sonnet-6': released, 'claude-haiku-7-1': released, 'claude-fable-8': released,
  };
  expect(latestClaudeFamilies({ anthropic: { models } })).toEqual({
    opus: 'claude-opus-5-10', sonnet: 'claude-sonnet-6', haiku: 'claude-haiku-7-1', fable: 'claude-fable-8',
  });
  expect(latestClaudeFamilies({ anthropic: { models: { 'claude-opus-5': released } } })).toBeUndefined();
  expect(latestClaudeFamilies(undefined)).toBeUndefined();
});
