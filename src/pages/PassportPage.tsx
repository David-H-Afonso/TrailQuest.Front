import { useState, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import type { AdventureRoute, Checkpoint, Dashboard, Journey } from '../models/adventure';
import { formatDate, formatInstantDate, formatKm, formatPercent } from '../utils/format';
import { PageHeading } from '../components/elements/PageHeading';
import { Progress } from '../components/elements/Progress';
import { Button } from '../components/elements/Button';
import { Modal } from '../components/elements/Modal';
import type { ToastMessage } from '../components/elements/Toast';
import { CheckpointDialog } from '../components/adventure/CheckpointDialog';
import { MediaGallery } from '../components/adventure/MediaGallery';
import { ShareDialog } from '../components/community/ShareDialog';
import { contentAsset } from '../utils/content';
import { useLeaveJourneyMutation, useStartJourneyMutation, useUpdateJourneyContentMutation } from '../services/adventureApi';
import { getErrorMessage } from '../utils/errors';

function UpdateEdition({ profile, routeId, onFeedback }: { profile: Dashboard['profileId']; routeId: string; onFeedback?: (message: ToastMessage) => void }) {
  const [update, {isLoading}] = useUpdateJourneyContentMutation();
  async function apply() { try { await update({profile,routeId}).unwrap(); onFeedback?.({text:'Ficha actualizada.'}); } catch(error) { onFeedback?.({text:getErrorMessage(error),error:true}); } }
  return <Button variant="secondary" loading={isLoading} onClick={() => void apply()}>Actualizar ficha</Button>;
}

export function PassportPage({ dashboard, route, routes = route ? [route] : [], onFeedback }: {
  dashboard: Dashboard; route?: AdventureRoute; routes?: AdventureRoute[]; onCheckpoint?: (stop: Checkpoint) => void; onFeedback?: (message: ToastMessage) => void;
}) {
  const [selectedId,setSelectedId] = useState(dashboard.currentJourney?.routeId ?? dashboard.journeys[0]?.routeId ?? '');
  const [checkpoint,setCheckpoint] = useState<Checkpoint | null>(null);
  const [sharing,setSharing] = useState(false);
  const [action,setAction] = useState<'leave' | 'resume' | null>(null);
  const [error,setError] = useState('');
  const [leave,{isLoading:leaving}] = useLeaveJourneyMutation();
  const [start,{isLoading:starting}] = useStartJourneyMutation();
  const journey = dashboard.journeys.find(item => item.routeId === selectedId) ?? dashboard.currentJourney ?? dashboard.journeys[0];
  const definition = journey?.definition ?? routes.find(item => item.id === journey?.routeId) ?? route;
  const active = dashboard.currentJourney;
  const inactive = dashboard.journeys.filter(item => item.routeId !== active?.routeId);
  const selectedActive = !!journey && journey.routeId === active?.routeId;
  const latest = routes.find(item => item.id === journey?.routeId);
  const visits = new Set(journey?.visits.map(item => item.checkpointId));
  const next = definition?.checkpoints.find(item => item.id === journey?.nextCheckpointId);
  const completed = !!journey && journey.progressPercent >= 100;
  const hasNewEdition = latest && latest.contentVersion !== (journey?.contentVersion ?? definition?.contentVersion);
  const busy = leaving || starting;

  async function confirmAction() {
    if (!journey) return;
    if (dashboard.journeyPolicy !== 'single-active') { setError('Actualiza la API para gestionar un único pasaporte activo. No se ha cambiado ninguna aventura.'); return; }
    setError('');
    try {
      if (action === 'leave') await leave({profile:dashboard.profileId,routeId:journey.routeId}).unwrap();
      else await start({profile:dashboard.profileId,routeId:journey.routeId,replacingRouteId:active?.routeId}).unwrap();
      setCheckpoint(null);setSharing(false);setAction(null);
      onFeedback?.({text:action === 'leave' ? 'Has salido del pasaporte. Tu avance y sellos se conservan.' : 'Pasaporte retomado.'});
    } catch(failure) { setError(getErrorMessage(failure)); }
  }

  function bookButton(item: Journey) {
    const book = item.definition ?? routes.find(candidate => candidate.id === item.routeId) ?? route;
    if (!book) return null;
    const current = item.routeId === active?.routeId;
    return <button type="button" className="passport-picker__item" key={item.routeId} aria-pressed={journey?.routeId === item.routeId} aria-label={`Ver pasaporte ${current ? 'activo' : 'guardado'} de ${book.name}`} onClick={() => {setSelectedId(item.routeId);setCheckpoint(null);setSharing(false);setAction(null);setError('');}}>
      {book.setting === 'real' && book.cover ? <img src={contentAsset(book.id,book.cover)} alt="" width="80" height="70" /> : <span className="passport-picker__fiction" aria-hidden="true">{book.passport.regionLabel.slice(0,1)}</span>}
      <span><strong>{book.passport.title || book.name}</strong><small>{current ? 'Activo' : 'Inactivo'} · {item.visits.length} de {book.checkpoints.length} sellos · {formatPercent(item.progressPercent)}</small></span>
    </button>;
  }

  return <>
    <PageHeading title="Pasaportes" actions={<Link className="button button--secondary" to="/explore">Explorar rutas</Link>} />
    {active ? <nav className="passport-picker passport-picker--active" aria-label="Pasaporte activo">{bookButton(active)}</nav>
      : <section className="empty-passport empty-passport--compact panel"><h2>No tienes un pasaporte activo</h2><p>Puedes elegir una ruta nueva o retomar un pasaporte guardado.</p><Link className="button button--primary" to="/explore">Elegir ruta</Link></section>}
    {inactive.length > 0 && <details className="passport-history" open={!selectedActive || undefined}><summary>Pasaportes inactivos · {inactive.length}</summary><nav className="passport-picker" aria-label="Pasaportes guardados">{inactive.map(bookButton)}</nav></details>}
    {journey && definition && <>
      <div className="passport-actions"><span className={`badge ${selectedActive ? 'badge--green' : ''}`}>{selectedActive ? 'Pasaporte activo' : 'Avance guardado · inactivo'}</span><Button variant="secondary" onClick={() => {setError('');setAction(selectedActive ? 'leave' : 'resume');}}>{selectedActive ? 'Salir del pasaporte' : 'Retomar pasaporte'}</Button></div>
      <section className="passport-detail" style={{'--passport-accent':definition.passport.color} as CSSProperties} aria-label={`Progreso de ${definition.name}`}>
        <header className={`passport-summary ${definition.setting === 'fiction' ? 'passport-summary--fiction' : ''}`}>
          {definition.cover && definition.setting === 'real' && <img className="passport-summary__photo" src={contentAsset(definition.id,definition.cover)} alt={definition.gallery?.find(item => item.file === definition.cover)?.alt ?? definition.name} width="1280" height="853" />}
          <div className="passport-summary__body"><span className="route-region">{definition.region}{definition.setting === 'fiction' ? ' · Ficción' : ''}</span><h2>{definition.name}</h2><p>{definition.description}</p>
            <div className="passport-progress-value"><strong>{formatKm(journey.distanceKm)}</strong><span>de {formatKm(definition.distanceKm)}</span><b>{formatPercent(journey.progressPercent)}</b></div><Progress value={journey.progressPercent} label={`Progreso de ${definition.name}`} />
            <div className="passport-progress-meta"><strong>{visits.size} de {definition.checkpoints.length} sellos</strong><span>Desde {formatDate(journey.startedOn)}</span></div>
            {!selectedActive ? <p className="passport-paused-note">Este pasaporte no suma pasos mientras está inactivo. Al retomarlo conservarás este avance y los sellos conseguidos.</p>
              : next ? <button className="passport-next" type="button" onClick={() => setCheckpoint(next)}><span>Próximo sello<strong>{next.name}</strong></span><b>Faltan {formatKm(journey.nextCheckpointRemainingKm)}</b><span aria-hidden="true">→</span></button> : <div className="passport-completed"><strong>Ruta completada</strong><Button variant="secondary" onClick={() => setSharing(true)}>Compartir pasaporte</Button></div>}
          </div>
        </header>
        <p className="passport-context">{definition.setting === 'real' ? 'Recorrido virtual: los sellos se consiguen con la distancia de tus pasos, no por visitar físicamente los lugares.' : 'Aventura de ficción. Cada etapa se desbloquea con la distancia de tus pasos.'}</p>
        {hasNewEdition && <div className="edition-update"><span>Hay fotos y textos nuevos para esta ruta. El progreso se conserva.</span><UpdateEdition profile={dashboard.profileId} routeId={definition.id} onFeedback={onFeedback}/></div>}
        <div className="passport-stops-heading"><h2>Sellos del recorrido</h2><span>{completed ? 'Todos conseguidos' : `${definition.checkpoints.length - visits.size} pendientes`}</span></div>
        <div className="passport-stops">{definition.checkpoints.map((stop,index) => {
          const earned = visits.has(stop.id); const startStop = stop.distanceKm === 0; const isNext = selectedActive && stop.id === next?.id;
          const visit = journey.visits.find(item => item.checkpointId === stop.id);
          const photo = stop.image ?? stop.gallery?.[0]?.file;
          const status = earned ? startStop ? 'Inicio' : 'Conseguido' : isNext ? 'Próximo' : 'Pendiente';
          return <button type="button" className={`passport-stop ${earned ? 'is-earned' : ''} ${isNext ? 'is-next' : ''}`} key={stop.id} onClick={() => setCheckpoint(stop)} aria-label={`${stop.name}, ${status.toLocaleLowerCase()}, ${formatKm(stop.distanceKm)}`}>
            {photo ? <div className="passport-stop__photo"><img src={contentAsset(definition.id,photo)} alt="" width="640" height="420" loading="lazy" /><span className="passport-stop__state">{status}</span></div> : <div className="passport-stop__abstract"><span>{definition.setting === 'fiction' ? definition.passport.regionLabel.slice(0,2) : String(index+1).padStart(2,'0')}</span><span className="passport-stop__state">{status}</span></div>}
            <div className="passport-stop__body"><div><h3>{stop.name}</h3><span className="passport-stop__local">{stop.localName}</span></div><span className="postmark" aria-hidden="true"><strong>{startStop ? 'SALIDA' : formatKm(stop.distanceKm)}</strong><small>{earned ? 'TRAILQUEST' : 'POR CONSEGUIR'}</small></span>
              <p>{earned ? startStop ? 'Se añade al comenzar la ruta' : `Conseguido el ${visit ? formatInstantDate(visit.unlockedAtUtc,dashboard.settings.timeZoneId) : '—'}` : `Faltan ${formatKm(Math.max(0,stop.distanceKm-journey.distanceKm))}`}</p><span className="passport-stop__action">{earned ? 'Ver sello y lugar' : 'Ver requisito'} <span aria-hidden="true">→</span></span>
            </div>
          </button>;
        })}</div>
        <details className="passport-about"><summary>Sobre esta ruta y créditos</summary><p>{definition.introduction}</p><MediaGallery adventureId={definition.id} media={definition.gallery ?? []} /><p className="field-help">{definition.attribution}</p><ul>{definition.references?.map(item => <li key={item.url}><a href={item.url} target="_blank" rel="noopener noreferrer">{item.title}</a></li>)}</ul></details>
      </section>
      {checkpoint && <CheckpointDialog stop={checkpoint} route={definition} journey={journey} profile={dashboard.profileId} onClose={() => setCheckpoint(null)} onFeedback={onFeedback} />}
      {sharing && <ShareDialog request={{kind:'journey',sourceId:definition.id,includeTrack:false}} profile={dashboard.profileId} onClose={() => setSharing(false)} onPublished={onFeedback} />}
      {action && <Modal title={action === 'leave' ? '¿Salir de este pasaporte?' : '¿Retomar este pasaporte?'} onClose={() => setAction(null)}>
        {action === 'leave' ? <p><strong>{definition.name}</strong> dejará de sumar pasos. Su avance, fecha de inicio y sellos quedarán guardados; tu historial personal no se borra.</p>
          : <><p>Conservarás el avance y los sellos de <strong>{definition.name}</strong>. Se contarán los nuevos pasos registrados desde hoy, sin sumar el periodo inactivo.</p>{active && <p className="passport-switch-notice">Tu pasaporte actual quedará inactivo al confirmar.</p>}</>}
        {error && <p role="alert" className="form-error">{error}</p>}
        <div className="modal__actions"><Button variant="secondary" onClick={() => setAction(null)} disabled={busy}>Cancelar</Button><Button onClick={() => void confirmAction()} loading={busy}>{action === 'leave' ? 'Salir y guardar avance' : 'Retomar pasaporte'}</Button></div>
      </Modal>}
    </>}
    <details className="passport-achievements"><summary>Logros · {dashboard.achievements.filter(item => item.unlocked).length} de {dashboard.achievements.length}</summary><div className="compact-achievements">{dashboard.achievements.map(item => <div key={item.id}><strong>{item.name}</strong><span>{item.description}</span><b>{item.unlocked ? 'Conseguido' : 'Pendiente'}</b></div>)}</div></details>
  </>;
}
