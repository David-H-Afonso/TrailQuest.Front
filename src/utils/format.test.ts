import { describe, expect, it } from 'vitest';
import { formatDate, formatKm, parseCalendarDate, shiftDate, sourceLabel } from './format';

describe('locale-aware activity formatting', () => {
  it('uses a decimal comma for distances', () => { expect(formatKm(2.736)).toBe('2,7 km'); });
  it('treats a calendar date as a local calendar day, not a UTC timestamp', () => {
    expect(parseCalendarDate('2026-11-09').getDate()).toBe(9);
    expect(formatDate('2026-11-09', { day: 'numeric', month: 'long' })).toBe('9 de noviembre');
  });
  it('moves dates safely across months, years and daylight-saving boundaries', () => {
    expect(shiftDate('2026-01-01', -1)).toBe('2025-12-31');
    expect(shiftDate('2026-03-29', 1)).toBe('2026-03-30');
    expect(shiftDate('2026-11-09', -27)).toBe('2026-10-13');
  });
  it('keeps fixture data explicitly distinguished from real sources', () => {
    expect(sourceLabel.demo).toBe('De prueba');
    expect(sourceLabel.garmin).toBe('Garmin');
  });
});
