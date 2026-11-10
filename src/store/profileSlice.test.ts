import { afterEach, describe, expect, it, vi } from 'vitest';
import reducer, { readSavedProfile, setProfile } from './profileSlice';

afterEach(() => localStorage.clear());

describe('profile selection', () => {
  it('defaults unknown stored values to personal without requiring demo fixtures', () => {
    localStorage.setItem('trailquest.profile', 'unrelated');
    expect(readSavedProfile()).toBe('personal');
    expect(readSavedProfile(undefined, 'demo')).toBe('demo');
  });
  it('remembers only an explicit personal selection', () => {
    localStorage.setItem('trailquest.profile', 'personal');
    expect(readSavedProfile()).toBe('personal');
    expect(reducer({ active: 'demo' }, setProfile('personal'))).toEqual({ active: 'personal' });
  });
  it('still opens safely when browser storage is unavailable', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('Storage unavailable.'); });
    expect(readSavedProfile()).toBe('personal');
  });
});
