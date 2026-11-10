import { describe, expect, it } from 'vitest';
import { splitAdventureRoute, splitRoute } from './geometry';
import { routes } from '../test/fixtures';

describe('route interpolation', () => {
  it('handles empty, single-point and repeated-point geometry', () => {
    expect(splitRoute([], .5).completed).toEqual([]);
    expect(splitRoute([[5, 6]], .5).current).toEqual([5, 6]);
    expect(splitRoute([[0, 0], [0, 0]], 1).current).toEqual([0, 0]);
  });
  it('clamps progress and interpolates without changing the route', () => {
    const coordinates: [number, number][] = [[0, 0], [10, 0], [10, 10]];
    expect(splitRoute(coordinates, -.5, false).current).toEqual([0, 0]);
    expect(splitRoute(coordinates, .75, false).current).toEqual([10, 5]);
    expect(splitRoute(coordinates, 3, false).current).toEqual([10, 10]);
    expect(coordinates).toHaveLength(3);
  });
  it.each(routes)('places the traveler exactly at every checkpoint in $id', (route) => {
    for (const stop of route.checkpoints) {
      const current = splitAdventureRoute(route, stop.distanceKm).current;
      expect(current[0]).toBeCloseTo(stop.position[0], 5);
      expect(current[1]).toBeCloseTo(stop.position[1], 5);
    }
  });
  it('keeps the traveler at the destination after route completion', () => {
    const route = routes[0];
    expect(splitAdventureRoute(route, route.distanceKm + 100).current).toEqual(route.coordinates.at(-1));
  });
});
