import type { AdventureRoute, Journey, Position } from '../../models/adventure';
import { splitAdventureRoute } from '../../utils/geometry';

export function RouteSchematic({ route, journey }: { route: AdventureRoute; journey: Journey }) {
  const latitudes = route.coordinates.map((point) => point[0]);
  const longitudes = route.coordinates.map((point) => point[1]);
  const centerLat = (Math.min(...latitudes) + Math.max(...latitudes)) / 2;
  const centerLon = (Math.min(...longitudes) + Math.max(...longitudes)) / 2;
  const longitudeScale = Math.cos(centerLat * Math.PI / 180);
  const scale = Math.min(850 / Math.max(0.000001, (Math.max(...longitudes) - Math.min(...longitudes)) * longitudeScale), 390 / Math.max(0.000001, Math.max(...latitudes) - Math.min(...latitudes)));
  const project = ([lat, lon]: Position): Position => [500 + (lon - centerLon) * longitudeScale * scale, 265 - (lat - centerLat) * scale];
  const path = (points: Position[]) => points.map((point) => project(point).join(',')).join(' ');
  const progress = splitAdventureRoute(route, journey.distanceKm);
  const current = project(progress.current);
  const visited = new Set(journey.visits.map((visit) => visit.checkpointId));
  return <div className="city-map-wrapper schematic-wrapper">
    <svg viewBox="0 0 1000 540" className="city-schematic" role="img" aria-label={`Esquema de ${route.name}, ${Math.round(journey.progressPercent)} por ciento completado. No es un callejero.`}>
      <rect width="1000" height="540" fill="#edf3f1" />
      {[100,250,400,550,700,850].map((x) => <path key={x} d={`M${x} 0v540M0 ${x / 2}h1000`} stroke="#dce7e3" strokeDasharray="4 8" />)}
      <text x="45" y="48" className="schematic-title">{route.region.toLocaleUpperCase()} · ESQUEMA</text>
      <polyline points={path(route.coordinates)} fill="none" stroke="#fff" strokeWidth="12" strokeLinejoin="round" />
      <polyline points={path(route.coordinates)} fill="none" stroke="#849da1" strokeWidth="4" strokeDasharray="5 8" />
      <polyline points={path(progress.completed)} fill="none" stroke={route.passport?.color ?? route.color} strokeWidth="6" strokeLinejoin="round" />
      {route.checkpoints.map((stop, index) => {
        const [x,y] = project(stop.position);
        return <g key={stop.id} transform={`translate(${x} ${y})`}><circle r="15" fill={visited.has(stop.id) ? '#147d80' : '#fff'} stroke="#fff" strokeWidth="3" /><text y="5" textAnchor="middle" fill={visited.has(stop.id) ? '#fff' : '#385f68'} fontSize="12" fontWeight="700">{index + 1}</text>{(index === 0 || index === route.checkpoints.length - 1) && <text y="-24" textAnchor="middle" className="schematic-place">{stop.name}</text>}</g>;
      })}
      <circle cx={current[0]} cy={current[1]} r="17" fill="#c7653f" stroke="#fff" strokeWidth="4" /><circle cx={current[0]} cy={current[1]} r="4" fill="#fff" />
      <text x="45" y="500" className="schematic-note">La ruta y tu progreso están guardados en este equipo.</text>
    </svg>
    <span className="map-caption">Esquema orientativo · paradas en el itinerario</span>
    <span className="schematic-attribution">{route.attribution}</span>
  </div>;
}
