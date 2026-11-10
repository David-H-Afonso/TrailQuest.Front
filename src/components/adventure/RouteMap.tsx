import { lazy, Suspense, useState } from 'react';
import type { AdventureRoute, Checkpoint, Journey } from '../../models/adventure';
import { IllustratedMap } from './IllustratedMap';
import { TravelArt } from './TravelArt';
import { RouteSchematic } from './RouteSchematic';
import type { MapFailure } from './PolicyTileLayer';
import { Icon } from '../elements/Icon';

const GeographicMap = lazy(() => import('./GeographicMap'));

export function RouteMap({ route, journey, onCheckpoint }: { route: AdventureRoute; journey: Journey; onCheckpoint: (stop: Checkpoint) => void }) {
  const [schematic, setSchematic] = useState(false);
  const [failure, setFailure] = useState<MapFailure | null>(null);
  if (route.map?.kind === 'illustrated') return <IllustratedMap route={route} journey={journey} />;
  if (route.map?.kind === 'schematic') return <RouteSchematic route={route} journey={journey} />;
  const showSchematic = schematic || failure !== null;
  return <div className="map-area"><div className="map-mode-switch" role="group" aria-label="Vista del mapa"><button aria-pressed={!showSchematic} onClick={() => { setFailure(null); setSchematic(false); }}><Icon name="map" size={14} />Callejero</button><button aria-pressed={showSchematic} onClick={() => setSchematic(true)}><Icon name="route" size={14} />Esquema sin conexión</button></div>
    {showSchematic ? <RouteSchematic route={route} journey={journey} /> : <Suspense fallback={<div className="map-loading"><TravelArt kind="city" /><span role="status">Abriendo el mapa de {route.name}…</span></div>}>
      <GeographicMap route={route} journey={journey} onCheckpoint={onCheckpoint} onFailure={setFailure} />
    </Suspense>}
    {failure && <div className="map-failure-note" role="status"><Icon name="help" size={17} /><p><strong>{failure === 'blocked' ? 'El proveedor ha bloqueado el callejero.' : 'No se ha podido cargar el callejero.'}</strong> Sigues viendo tu ruta y tu progreso en el esquema local.</p><button className="text-link" onClick={() => { setFailure(null); setSchematic(false); }}>Reintentar callejero</button></div>}
  </div>;
}
