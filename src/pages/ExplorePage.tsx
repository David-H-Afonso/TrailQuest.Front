import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import type { AdventureRoute, Dashboard } from '../models/adventure';
import { useStartJourneyMutation } from '../services/adventureApi';
import { formatDate, formatKm, formatPercent } from '../utils/format';
import { getErrorMessage } from '../utils/errors';
import { Button } from '../components/elements/Button';
import { Modal } from '../components/elements/Modal';
import { PageHeading } from '../components/elements/PageHeading';
import { Progress } from '../components/elements/Progress';
import type { ToastMessage } from '../components/elements/Toast';
import { MediaGallery } from '../components/adventure/MediaGallery';
import { contentAsset } from '../utils/content';

export function ExplorePage({ dashboard, routes, onFeedback }: { dashboard: Dashboard; routes: AdventureRoute[]; onFeedback: (message: ToastMessage) => void }) {
  const [selected, setSelected] = useState<AdventureRoute | null>(null);
  const [startedOn, setStartedOn] = useState(dashboard.today);
  const [error, setError] = useState('');
  const [startJourney, { isLoading }] = useStartJourneyMutation();
  const navigate = useNavigate();
  const active = dashboard.currentJourney;
  const existing = selected && dashboard.journeys.find(item => item.routeId === selected.id);
  const activeName = active?.definition?.name ?? routes.find(item => item.id === active?.routeId)?.name;

  async function submit(event: FormEvent) {
    event.preventDefault(); if (!selected) return;
    if (dashboard.journeyPolicy !== 'single-active') { setError('Actualiza la API para gestionar un único pasaporte activo. No se ha cambiado ninguna aventura.'); return; }
    setError('');
    try {
      await startJourney({ profile: dashboard.profileId, routeId: selected.id, startedOn: existing ? undefined : startedOn, replacingRouteId: active?.routeId }).unwrap();
      setSelected(null); onFeedback({ text: existing ? 'Pasaporte retomado.' : 'Pasaporte activado.' }); navigate('/');
    } catch (failure) { setError(getErrorMessage(failure)); }
  }

  return <>
    <PageHeading title="Explorar rutas" description="Elige tu pasaporte. Solo uno puede estar activo a la vez." />
    <div className="route-grid">{routes.map(route => {
      const journey = dashboard.journeys.find(item => item.routeId === route.id);
      const current = active?.routeId === route.id;
      return <article className={`route-card panel ${route.kind === 'fantasy' ? 'route-card--fantasy' : ''}`} key={route.id}>
        <div className={`route-card__art ${route.setting === 'fiction' ? 'route-card__art--fiction' : ''}`}>{route.cover && route.setting === 'real' ? <img className="route-cover-image" src={contentAsset(route.id,route.cover)} alt={route.gallery?.find(item=>item.file===route.cover)?.alt??route.name} width="1280" height="853" loading="lazy" /> : <span className="fiction-cover-title">{route.passport.regionLabel}</span>}<span className="route-kind badge">{route.setting === 'fiction' ? 'Ficción' : 'Ruta virtual'}</span>{current && <span className="route-current badge badge--green">Pasaporte activo</span>}</div>
        <div className="route-card__body"><span className="route-region">{route.region}</span><h2>{route.name}</h2><p>{route.description}</p>
          <div className="route-card__facts"><span>{formatKm(route.distanceKm)}</span><span>{route.checkpoints.length} sellos</span><span>{route.difficulty}</span></div>
          {journey && <div className="route-card__saved"><div><span>{current ? 'Activo' : 'Avance guardado'} · desde {formatDate(journey.startedOn)}</span><strong>{formatPercent(journey.progressPercent)}</strong></div><Progress value={journey.progressPercent} label={`Progreso guardado en ${route.name}`} /></div>}
          <Button variant={current ? 'secondary' : 'primary'} onClick={() => { if (current) navigate('/'); else { setError(''); setStartedOn(dashboard.today); setSelected(route); } }}>{current ? 'Ver recorrido' : journey ? 'Retomar pasaporte' : 'Empezar ruta'}</Button>
        </div>
      </article>;
    })}</div>
    <p className="route-catalog-note">Al cambiar de pasaporte, el anterior queda inactivo. Sus sellos y su avance se conservan.</p>
    {selected && <Modal title={existing ? `Retomar ${selected.passport.title}` : selected.name} onClose={() => setSelected(null)}>
      <MediaGallery adventureId={selected.id} media={selected.gallery ?? []} />
      <form className="form-stack" onSubmit={event => void submit(event)}>
        {active && <p className="passport-switch-notice">Al confirmar saldrás de <strong>{activeName}</strong>. No se borrarán sus pasos, sellos ni avance guardado.</p>}
        {existing ? <p>Conservarás los {formatKm(existing.distanceKm)} y {existing.visits.length} sellos guardados. Se contarán los nuevos pasos registrados a partir de hoy, sin sumar el tiempo que estuvo inactivo.</p> : <><p>{selected.introduction}</p><label className="field">Contar pasos desde<input type="date" min="2000-01-01" max={dashboard.today} value={startedOn} onChange={event => setStartedOn(event.target.value)} required /></label></>}
        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="modal__actions"><Button variant="secondary" onClick={() => setSelected(null)} disabled={isLoading}>Cancelar</Button><Button type="submit" loading={isLoading}>{existing ? 'Retomar pasaporte' : 'Activar pasaporte'}</Button></div>
      </form>
    </Modal>}
  </>;
}
