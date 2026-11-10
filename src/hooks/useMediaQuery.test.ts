import { act, renderHook } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { useMediaQuery } from './useMediaQuery';

it('updates compact controls when the viewport media query changes', () => {
  let matches = false;
  const events = new EventTarget();
  const media = {
    get matches() { return matches; },
    addEventListener: events.addEventListener.bind(events),
    removeEventListener: events.removeEventListener.bind(events),
  };
  vi.stubGlobal('matchMedia', vi.fn(() => media));
  try {
    const { result, unmount } = renderHook(() => useMediaQuery('(max-width: 1024px)'));
    expect(result.current).toBe(false);
    act(() => { matches = true; events.dispatchEvent(new Event('change')); });
    expect(result.current).toBe(true);
    act(() => { matches = false; events.dispatchEvent(new Event('change')); });
    expect(result.current).toBe(false);
    unmount();
  } finally { vi.unstubAllGlobals(); }
});
