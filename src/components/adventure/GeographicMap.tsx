import { useEffect } from 'react';
import { divIcon, latLngBounds } from 'leaflet';
import { MapContainer, Marker, Polyline, Tooltip, ZoomControl, useMap } from 'react-leaflet';
import { PolicyTileLayer, type MapFailure } from './PolicyTileLayer';
import type { AdventureRoute, Checkpoint, Journey } from '../../models/adventure';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { splitAdventureRoute } from '../../utils/geometry';
import 'leaflet/dist/leaflet.css';

function MapSizing({ route, compact }: { route: AdventureRoute; compact: boolean }) {
  const map = useMap();
  useEffect(() => {
    const refit = () => {
      map.invalidateSize();
      map.fitBounds(latLngBounds(route.coordinates), { padding: [35, 40], animate: false });
    };
    const observer = new ResizeObserver(refit);
    observer.observe(map.getContainer());
    return () => observer.disconnect();
  }, [map, route]);
  useEffect(() => { if (compact) map.dragging.disable(); else map.dragging.enable(); }, [map, compact]);
  return null;
}

function StreetTiles({ onFailure }: { onFailure: (failure: MapFailure) => void }) {
  const map = useMap();
  useEffect(() => {
    const layer = new PolicyTileLayer(onFailure);
    layer.addTo(map);
    return () => { layer.remove(); };
  }, [map, onFailure]);
  return null;
}

export default function GeographicMap({ route, journey, onCheckpoint, onFailure }: { route: AdventureRoute; journey: Journey; onCheckpoint: (stop: Checkpoint) => void; onFailure: (failure: MapFailure) => void }) {
  const compact = useMediaQuery('(max-width: 1024px)');
  const { completed, current } = splitAdventureRoute(route, journey.distanceKm);
  const visited = new Set(journey.visits.map((visit) => visit.checkpointId));
  return <div className="city-map-wrapper">
    <MapContainer bounds={latLngBounds(route.coordinates)} boundsOptions={{ padding: [35, 40] }}
      scrollWheelZoom={false} zoomControl={false} className="city-map" attributionControl={true} minZoom={10} maxZoom={18}>
      <ZoomControl position="topleft" zoomInTitle="Acercar mapa" zoomOutTitle="Alejar mapa" />
      <StreetTiles onFailure={onFailure} />
      <Polyline positions={route.coordinates} pathOptions={{ color: '#ffffff', weight: 9, opacity: 0.9 }} />
      <Polyline positions={route.coordinates} pathOptions={{ color: '#839ba2', weight: 4, dashArray: '5 8', opacity: 0.85 }} />
      <Polyline positions={completed} pathOptions={{ color: route.passport.color, weight: 5, opacity: 1 }} />
      {route.checkpoints.map((stop, index) => <Marker key={`${stop.id}-${compact ? 'static' : 'interactive'}`} position={stop.position}
        title={stop.name} interactive={!compact} keyboard={!compact}
        eventHandlers={compact ? undefined : {
          click: () => onCheckpoint(stop),
          keydown: (event) => {
            const key = event.originalEvent;
            if (key.key === 'Enter' || key.key === ' ') {
              key.preventDefault();
              key.stopPropagation();
              if (!key.repeat) onCheckpoint(stop);
            }
          },
        }}
        icon={divIcon({ className: 'checkpoint-map-icon', html: `<span aria-hidden="true" class="map-stop ${visited.has(stop.id) ? 'map-stop--visited' : ''}">${visited.has(stop.id) ? '✓' : index + 1}</span>`, iconSize: [25, 25], iconAnchor: [12, 12] })}>
        {(index === 0 || index === route.checkpoints.length - 1) && <Tooltip permanent direction={index === 0 ? 'left' : 'right'} offset={[12, 0]}>{stop.name}</Tooltip>}
      </Marker>)}
      <Marker position={current} interactive={false} keyboard={false} zIndexOffset={1000}
        icon={divIcon({ className: 'traveler-map-icon', html: '<span aria-hidden="true" class="map-traveler"><span></span></span>', iconSize: [30, 30], iconAnchor: [15, 15] })}>
        <Tooltip permanent direction="top" offset={[0, -18]} className="traveler-tooltip">Estás aquí</Tooltip>
      </Marker>
      <MapSizing route={route} compact={compact} />
    </MapContainer>
    <span className="map-caption"><span className="status-dot" />{compact ? 'Ruta virtual · paradas en el itinerario' : 'Recorrido virtual · no es tu ubicación'}</span>
  </div>;
}
