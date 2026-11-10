import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import { waitFor } from '@testing-library/react';
import { PolicyTileLayer } from './PolicyTileLayer';

beforeEach(() => {
  class FixtureURL extends URL {
    static createObjectURL = vi.fn(() => 'blob:fixture-tile');
    static revokeObjectURL = vi.fn();
  }
  vi.stubGlobal('URL', FixtureURL);
});
afterEach(() => vi.unstubAllGlobals());

it('honors Referer and browser caching without sending credentials to the tile provider', async () => {
  const fetcher = vi.fn().mockResolvedValue(new Response('fixture-image', { headers: { 'Content-Type': 'image/png' } }));
  vi.stubGlobal('fetch', fetcher);
  const failure = vi.fn();
  const layer = new PolicyTileLayer(failure);
  layer.getTileUrl = () => 'https://tile.openstreetmap.org/1/1/1.png';
  const done = vi.fn();
  const tile = layer.createTile({ x: 1, y: 1, z: 1 } as never, done) as HTMLImageElement;
  await waitFor(() => expect(tile.src).toContain('blob:fixture-tile'));
  expect(fetcher).toHaveBeenCalledWith('https://tile.openstreetmap.org/1/1/1.png', expect.objectContaining({ cache: 'default', credentials: 'omit', referrerPolicy: 'strict-origin-when-cross-origin' }));
  expect(tile.referrerPolicy).toBe('strict-origin-when-cross-origin');
  tile.dispatchEvent(new Event('load'));
  expect(done).toHaveBeenCalledWith(undefined, tile);
  expect(failure).not.toHaveBeenCalled();
});

it('treats a 403 image as a provider failure instead of painting the blocked image', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('blocked-image', { status: 403, headers: { 'Content-Type': 'image/png' } })));
  const failure = vi.fn();
  const layer = new PolicyTileLayer(failure);
  layer.getTileUrl = () => 'https://tile.openstreetmap.org/1/1/1.png';
  const tile = layer.createTile({ x: 1, y: 1, z: 1 } as never, vi.fn()) as HTMLImageElement;
  await waitFor(() => expect(failure).toHaveBeenCalledWith('blocked'));
  expect(tile.getAttribute('src')).toBeNull();
  expect(fetch).toHaveBeenCalledTimes(1);
});

it('aborts tiles that leave the viewport instead of prefetching or continuing downloads', () => {
  let signal: AbortSignal | undefined;
  vi.stubGlobal('fetch', vi.fn((_url, options: RequestInit) => { signal = options.signal as AbortSignal; return new Promise(() => {}); }));
  const layer = new PolicyTileLayer(vi.fn());
  layer.getTileUrl = () => 'https://tile.openstreetmap.org/1/1/1.png';
  const tile = layer.createTile({ x: 1, y: 1, z: 1 } as never, vi.fn());
  layer.fire('tileunload', { tile });
  expect(signal?.aborted).toBe(true);
});
