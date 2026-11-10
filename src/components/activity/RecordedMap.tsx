import { useEffect } from 'react';
import { latLngBounds } from 'leaflet';
import { MapContainer, Polyline, CircleMarker, ZoomControl, useMap } from 'react-leaflet';
import type { TrackPoint } from '../../models/health';
import { PolicyTileLayer, type MapFailure } from '../adventure/PolicyTileLayer';
import 'leaflet/dist/leaflet.css';

function Tiles({ onFailure }: { onFailure: (failure: MapFailure) => void }) {
  const map = useMap();
  useEffect(() => { const layer = new PolicyTileLayer(onFailure); layer.addTo(map); return () => { layer.remove(); }; }, [map,onFailure]);
  useEffect(() => { const observer = new ResizeObserver(() => map.invalidateSize()); observer.observe(map.getContainer()); return () => observer.disconnect(); }, [map]);
  return null;
}
export default function RecordedMap({ points, onFailure }: { points: TrackPoint[]; onFailure: (failure: MapFailure) => void }) {
  const coordinates = points.filter((_p,i) => i % Math.max(1,Math.ceil(points.length / 5000)) === 0 || i === points.length - 1).map(point => [point.latitude,point.longitude] as [number,number]);
  if (coordinates.length < 2) return null;
  return <div className="recorded-street-map"><MapContainer bounds={latLngBounds(coordinates)} boundsOptions={{padding:[25,25]}} scrollWheelZoom={false} zoomControl={false} minZoom={3} maxZoom={19}>
    <ZoomControl zoomInTitle="Acercar mapa" zoomOutTitle="Alejar mapa" /><Tiles onFailure={onFailure} /><Polyline positions={coordinates} pathOptions={{color:'#147d80',weight:4}} /><CircleMarker center={coordinates[0]} radius={6} pathOptions={{color:'#147d80',fillOpacity:1}} /><CircleMarker center={coordinates[coordinates.length-1]} radius={6} pathOptions={{color:'#b35c3b',fillOpacity:1}} />
  </MapContainer></div>;
}
