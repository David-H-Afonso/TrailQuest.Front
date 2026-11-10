import { Link } from 'react-router-dom';
import type { AdventureRoute, Checkpoint, Dashboard } from '../models/adventure';
import { formatDate, formatKm, formatNumber, formatPercent, sourceLabel } from '../utils/format';
import { RouteMap } from '../components/adventure/RouteMap';
import { contentAsset } from '../utils/content';
import { WeekChart } from '../components/activity/WeekChart';
import { Button } from '../components/elements/Button';
import { Icon } from '../components/elements/Icon';
import { PageHeading } from '../components/elements/PageHeading';
import { Progress } from '../components/elements/Progress';

export function AdventurePage({ dashboard, route, onRegister, onCheckpoint, onSimulate, simulating }: {
  dashboard: Dashboard; route?: AdventureRoute; onRegister: () => void;
  onCheckpoint: (stop: Checkpoint) => void; onSimulate: () => void; simulating: boolean;
}) {
  const { currentJourney: journey, todayActivity: activity, settings, totals } = dashboard;
  if (!journey || !route) return <>
    <PageHeading title="Mi aventura" actions={<Button onClick={onRegister}>Registrar pasos</Button>} />
    <section className="empty-passport panel"><h2>No tienes un pasaporte activo</h2><p>Elige una aventura para empezar. Tus pasos y sellos guardados se conservan.</p><Link className="button button--primary" to="/explore">Explorar rutas</Link></section>
    <section className="standalone-steps panel"><h2>Pasos de hoy</h2><strong>{formatNumber(activity.steps)}</strong><span> de {formatNumber(settings.dailyStepGoal)} · {formatKm(activity.distanceKm)}</span></section>
    <WeekChart days={dashboard.week} goal={settings.dailyStepGoal} />
  </>;
  const next = route.checkpoints.find((stop) => stop.id === journey.nextCheckpointId);
  const dailyPercent = Math.min(100, activity.steps / settings.dailyStepGoal * 100);
  const visited = new Set(journey.visits.map((visit) => visit.checkpointId));
  const isDemo = dashboard.profileId === 'demo';

  return <>
    <PageHeading eyebrow={formatDate(dashboard.today, { weekday: 'long', day: 'numeric', month: 'long' })}
      title="Mi aventura"
      actions={<Button icon="plus" onClick={onRegister}>Registrar pasos</Button>} />
    {isDemo ? <section className="demo-controls" aria-label="Modo de prueba"><span>Avanzar en la ruta de prueba</span>
      <Button variant="secondary" compact icon="footprints" onClick={onSimulate} loading={simulating}>Simular +1.000 pasos</Button></section>
      : totals.steps === 0 && <section className="empty-start"><div><strong>Aún no hay pasos registrados</strong><p>Conecta Garmin o añade un total diario.</p></div><Link to="/settings" className="text-link">Conectar Garmin <Icon name="arrow-right" size={16} /></Link></section>}

    <div className="mobile-activity-summary"><Icon name="footprints" size={23} /><div><strong>{formatNumber(activity.steps)} pasos hoy</strong><span>de {formatNumber(settings.dailyStepGoal)} · {formatKm(activity.distanceKm)}</span></div><span className={`source-tag source-tag--${activity.source}`}>{sourceLabel[activity.source]}</span></div>
    <div className="adventure-layout">
      <div className="journey-column">
        <section className={`journey-card panel ${route.kind === 'fantasy' ? 'journey-card--fantasy' : ''}`} aria-labelledby="journey-title">
          <div className="journey-card__header"><div><span className="route-region"><Icon name={route.kind === 'city' ? 'map-pin' : 'mountain'} size={14} />{route.region}</span><h2 id="journey-title">{route.name}</h2><p>{route.subtitle}</p></div>
            <Link to="/explore" className="icon-button" aria-label="Cambiar de aventura"><Icon name="arrow-up-right" size={22} /></Link></div>
          <RouteMap route={route} journey={journey} onCheckpoint={onCheckpoint} />
          <div className="journey-card__progress"><div className="journey-progress-label"><span><strong>{formatKm(journey.distanceKm)}</strong> de {formatKm(route.distanceKm)}</span><span className="progress-percent">{formatPercent(journey.progressPercent)}</span></div>
            <Progress value={journey.progressPercent} label={`Progreso de ${route.name}`} />
            <div className="journey-progress-meta"><span><Icon name="flag" size={14} />{journey.remainingKm === 0 ? 'Has completado esta aventura' : `${formatKm(journey.remainingKm)} hasta el destino`}</span><span>Desde el {formatDate(journey.startedOn)}</span></div>
          </div>
        </section>

        <section className="next-stop-ticket" aria-labelledby="next-stop-title">
          <div className="next-stop-ticket__art">{(next?.image??route.cover)&&route.setting==='real'&&<img src={contentAsset(route.id,(next?.image??route.cover)!)} alt="" width="300" height="220" loading="lazy" />}</div>
          <div className="next-stop-ticket__body"><span className="eyebrow">{next ? 'Tu próxima parada' : 'Un viaje para recordar'}</span><h2 id="next-stop-title">{next?.name ?? 'Has llegado a tu destino'}</h2><p>{next ? `${next.localName} · ${next.category}` : 'Cada pequeño paseo te ha traído hasta aquí.'}</p>
            {next ? <button className="text-link" onClick={() => onCheckpoint(next)}>Ver parada <Icon name="arrow-right" size={16} /></button> : <Link to="/explore" className="text-link">Elegir otra aventura <Icon name="arrow-right" size={16} /></Link>}</div>
          <div className="next-stop-ticket__distance"><strong>{next ? formatKm(journey.nextCheckpointRemainingKm) : 'Completada'}</strong><span>{next ? 'para el próximo sello' : 'Ruta terminada'}</span></div>
        </section>

        <section className="itinerary panel" aria-label="Paradas del recorrido"><div className="section-label"><h2>Sellos del recorrido</h2><Link to="/passport" className="text-link">Ver pasaporte <Icon name="arrow-right" size={16} /></Link></div>
          <ol className="itinerary__stops">{route.checkpoints.map((stop, index) => <li key={stop.id} className={visited.has(stop.id) ? 'is-visited' : stop.id === next?.id ? 'is-next' : ''}>
            <button type="button" onClick={() => onCheckpoint(stop)} aria-label={`${stop.name}, ${visited.has(stop.id) ? 'descubierto' : `en el kilómetro ${stop.distanceKm}`}`}>
              <span className="itinerary__dot">{visited.has(stop.id) ? <Icon name="check" size={12} /> : index + 1}</span><span className="itinerary__name">{stop.name}</span><span className="itinerary__km">{formatKm(stop.distanceKm)}</span>
            </button></li>)}</ol>
        </section>
      </div>

      <div className="activity-column">
        <section className="goal-card panel"><div className="section-label"><h2>Tus pasos de hoy</h2><span className={`source-tag source-tag--${activity.source}`}>{sourceLabel[activity.source]}</span></div>
          <div className="goal-ring" role="img" aria-label={`${formatNumber(activity.steps)} de ${formatNumber(settings.dailyStepGoal)} pasos de objetivo diario`}>
            <svg viewBox="0 0 176 176" aria-hidden="true"><circle cx="88" cy="88" r="73" className="goal-ring__track" /><circle cx="88" cy="88" r="73" pathLength="100" strokeDasharray={`${dailyPercent} 100`} className="goal-ring__fill" /></svg>
            <div className="goal-ring__content"><Icon name={dailyPercent >= 100 ? 'check' : 'footprints'} size={22} /><strong>{formatNumber(activity.steps)}</strong><span>de {formatNumber(settings.dailyStepGoal)} pasos</span></div>
          </div>
          <div className="daily-distance"><span><Icon name="signpost" size={16} />{activity.isDistanceEstimated ? 'Distancia estimada' : 'Distancia de Garmin'}</span><strong>{formatKm(activity.distanceKm)}</strong></div>
          <p className="goal-card__message">{dailyPercent >= 100 ? 'Objetivo cumplido. El resto del camino es un extra.' : `${formatNumber(Math.max(0, settings.dailyStepGoal - activity.steps))} pasos para tu objetivo. A tu ritmo.`}</p>
        </section>
        <WeekChart days={dashboard.week} goal={settings.dailyStepGoal} />
        <section className="travel-totals" aria-label="Tu actividad acumulada"><div><Icon name="compass" /><strong>{formatKm(totals.distanceKm)}</strong><span>acumulados</span></div><div><Icon name="sun" /><strong>{formatNumber(totals.activeDays)}</strong><span>días en movimiento</span></div></section>
      </div>
    </div>
  </>;
}
