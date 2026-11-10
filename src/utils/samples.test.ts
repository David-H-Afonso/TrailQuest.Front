import { describe, expect, it } from 'vitest';
import { hourlySamples } from './samples';

describe('recorded samples', () => {
  it('averages only measured values and does not fabricate missing hours', () => {
    expect(hourlySamples([{ atUtc: '2026-11-09T08:05:00Z', value: 60 }, { atUtc: '2026-11-09T08:55:00Z', value: 80 }, { atUtc: '2026-11-09T11:00:00Z', value: 75 }])).toEqual([{ atUtc: '2026-11-09T08:00:00.000Z', value: 70 }, { atUtc: '2026-11-09T11:00:00.000Z', value: 75 }]);
  });
  it('keeps repeated local hours as distinct UTC buckets across daylight saving', () => {
    expect(hourlySamples([{ atUtc: '2026-10-25T01:10:00+02:00', value: 60 }, { atUtc: '2026-10-25T01:10:00+01:00', value: 70 }])).toHaveLength(2);
    expect(hourlySamples([])).toEqual([]);
  });
});
