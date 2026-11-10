import type { AdventureRoute, Position } from '../models/adventure';

function segmentLength(a: Position, b: Position, geographic: boolean) {
  if (!geographic) return Math.hypot(b[0] - a[0], b[1] - a[1]);
  const radians = Math.PI / 180;
  const latitude = (a[0] + b[0]) / 2 * radians;
  return Math.hypot((b[0] - a[0]) * radians, (b[1] - a[1]) * radians * Math.cos(latitude));
}

export function splitRoute(coordinates: Position[], fraction: number, geographic = true) {
  if (coordinates.length === 0) return { completed: [] as Position[], current: [0, 0] as Position };
  if (coordinates.length === 1) return { completed: [...coordinates], current: coordinates[0] };
  const lengths = coordinates.slice(1).map((point, index) => segmentLength(coordinates[index], point, geographic));
  const target = lengths.reduce((sum, length) => sum + length, 0) * Math.max(0, Math.min(1, fraction));
  const completed: Position[] = [coordinates[0]];
  let distance = 0;
  for (let index = 0; index < lengths.length; index++) {
    const length = lengths[index];
    if (distance + length >= target) {
      const ratio = length === 0 ? 0 : (target - distance) / length;
      const start = coordinates[index];
      const end = coordinates[index + 1];
      const current: Position = [start[0] + (end[0] - start[0]) * ratio, start[1] + (end[1] - start[1]) * ratio];
      completed.push(current);
      return { completed, current };
    }
    completed.push(coordinates[index + 1]);
    distance += length;
  }
  return { completed, current: coordinates[coordinates.length - 1] };
}

export function splitAdventureRoute(route: AdventureRoute, distanceKm: number) {
  const nextIndex = route.checkpoints.findIndex((stop) => stop.distanceKm > Math.max(0, distanceKm));
  if (nextIndex < 0) return { completed: [...route.coordinates], current: route.coordinates[route.coordinates.length - 1] };
  const previous = route.checkpoints[Math.max(0, nextIndex - 1)];
  const next = route.checkpoints[nextIndex];
  const nearest = (position: Position) => route.coordinates.reduce((best, point, index, coordinates) =>
    segmentLength(point, position, route.map?.kind !== 'illustrated') < segmentLength(coordinates[best], position, route.map?.kind !== 'illustrated') ? index : best, 0);
  const start = nearest(previous.position);
  const end = Math.max(start + 1, nearest(next.position));
  const fraction = (Math.max(0, distanceKm) - previous.distanceKm) / Math.max(0.00001, next.distanceKm - previous.distanceKm);
  const part = splitRoute(route.coordinates.slice(start, end + 1), fraction, route.map?.kind !== 'illustrated');
  return { completed: [...route.coordinates.slice(0, start), ...part.completed], current: part.current };
}
