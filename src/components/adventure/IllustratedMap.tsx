import type { AdventureRoute, Journey } from '../../models/adventure';
import { splitAdventureRoute } from '../../utils/geometry';
import { contentAsset } from '../../utils/content';

export function IllustratedMap({ route, journey }: { route: AdventureRoute; journey: Journey }) {
  const { completed, current } = splitAdventureRoute(route, journey.distanceKm);
  const visited = new Set(journey.visits.map(x => x.checkpointId));
  const color = route.passport.color;
  return <div className="fantasy-map-wrapper"><svg viewBox="0 0 1000 540" className="fantasy-map" role="img" aria-label={`${route.map.label}. ${Math.round(journey.progressPercent)} por ciento completado.`}>
    <rect width="1000" height="540" fill="#eef0e1" />
    {route.map.artwork && <image href={contentAsset(route.id, route.map.artwork)} width="1000" height="540" />}
    <polyline points={route.coordinates.map(x => x.join(',')).join(' ')} fill="none" stroke="#fffdf5" strokeWidth="12" strokeLinejoin="round" />
    <polyline points={route.coordinates.map(x => x.join(',')).join(' ')} fill="none" stroke={color} strokeWidth="3" strokeDasharray="5 8" />
    <polyline points={completed.map(x => x.join(',')).join(' ')} fill="none" stroke={color} strokeWidth="6" strokeLinejoin="round" />
    {route.checkpoints.map((stop, index) => <g key={stop.id} transform={`translate(${stop.position[0]} ${stop.position[1]})`}><circle r="15" fill={visited.has(stop.id) ? color : '#fffdf5'} stroke="#fff" strokeWidth="3" /><text y="5" textAnchor="middle" fill={visited.has(stop.id) ? '#fff' : '#173746'} fontSize="12" fontWeight="700">{index + 1}</text><text y={index % 2 ? 35 : -27} textAnchor="middle" className="fantasy-map__place">{stop.name}</text></g>)}
    <circle cx={current[0]} cy={current[1]} r="15" fill="#b35c3b" stroke="#fff" strokeWidth="4" />
  </svg><span className="map-caption">{route.map.label} · progreso virtual</span></div>;
}
