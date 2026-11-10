import { expect, it } from 'vitest';
import { formatInstantDate } from './format';

it('formats recorded instants in the profile calendar instead of truncating the UTC date', () => {
  expect(formatInstantDate('2026-11-09T23:30:00Z','Europe/Madrid')).toMatch(/^10/);
  expect(formatInstantDate('2026-11-09T23:30:00Z','UTC')).toMatch(/^9/);
});
