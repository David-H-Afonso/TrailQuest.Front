import { describe, expect, it } from 'vitest';
import { getErrorMessage } from './errors';

describe('safe Spanish errors', () => {
  it('translates a known error without exposing upstream details', () => {
    const text = getErrorMessage({ data: { code: 'garmin_auth', title: 'untrusted upstream text' } });
    expect(text).toContain('Garmin no acepta la clave');
    expect(text).not.toContain('untrusted');
  });
  it('offers an installation-neutral recovery action without a hardcoded host', () => {
    expect(getErrorMessage({ status: 'FETCH_ERROR' })).toContain('servicio esté disponible');
    expect(getErrorMessage(null)).toContain('servicio esté disponible');
    expect(getErrorMessage({ data: { code: 'origin_rejected' } })).not.toContain('127.0.0.1');
  });
});
