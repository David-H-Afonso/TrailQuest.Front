import type { Dashboard } from '../models/adventure';
import { formatDate, formatKm, formatNumber, sourceLabel } from '../utils/format';
import { Button } from '../components/elements/Button';
import { Icon } from '../components/elements/Icon';
import { PageHeading } from '../components/elements/PageHeading';

export function JournalPage({ dashboard, onRegister }: { dashboard: Dashboard; onRegister: (date?: string) => void }) {
  return <>
    <PageHeading eyebrow="Tu diario de viaje" title="Los pequeños pasos se quedan."
      description="Un total por día, sin duplicados. Puedes añadir o corregir una fecha cuando lo necesites."
      actions={<Button icon="plus" onClick={() => onRegister()}>Registrar pasos</Button>} />
    <div className="journal-summary"><div><span>Pasos acumulados</span><strong>{formatNumber(dashboard.totals.steps)}</strong></div><div><span>Distancia acumulada</span><strong>{formatKm(dashboard.totals.distanceKm)}</strong></div><div><span>Días en movimiento</span><strong>{formatNumber(dashboard.totals.activeDays)}</strong></div><div><span>Objetivos diarios cumplidos</span><strong>{formatNumber(dashboard.totals.goalDays)}</strong></div></div>
    <section className="journal panel"><div className="section-label"><h2>Actividad registrada</h2><span className="muted">{dashboard.history.length} registros recientes</span></div>
      {dashboard.history.length === 0 ? <div className="empty-state"><span className="empty-state__icon"><Icon name="book" size={34} /></span><h3>La primera página está en blanco</h3><p>Registra tus pasos de hoy o sincroniza Garmin desde Ajustes. Aquí verás cómo crece tu viaje.</p><Button variant="secondary" icon="plus" onClick={() => onRegister()}>Escribir el primer día</Button></div>
        : <div className="table-scroll"><table className="activity-table"><caption className="sr-only">Últimos 90 días registrados. El total de un día sustituye al anterior.</caption><thead><tr><th scope="col">Día</th><th scope="col">Pasos</th><th scope="col">Distancia</th><th scope="col">Origen</th><th scope="col"><span className="sr-only">Acciones</span></th></tr></thead><tbody>
          {dashboard.history.map((day) => <tr key={day.date}><th scope="row"><span className="activity-table__date">{formatDate(day.date, { day: 'numeric', month: 'long' })}{day.date === dashboard.today && <span className="badge">Hoy</span>}</span><span className="activity-table__weekday">{formatDate(day.date, { weekday: 'long', year: 'numeric' })}</span></th><td className="table-number">{formatNumber(day.steps)}{day.steps >= dashboard.settings.dailyStepGoal && <span className="goal-check" title="Objetivo diario cumplido"><Icon name="check" size={14} /></span>}</td><td>{formatKm(day.distanceKm)}<span className="table-caption">{day.isDistanceEstimated ? 'Estimada' : 'Reportada por Garmin'}</span></td><td><span className={`source-tag source-tag--${day.source}`}>{sourceLabel[day.source]}</span></td><td><button className="text-link" onClick={() => onRegister(day.date)} aria-label={`Editar pasos del ${formatDate(day.date)}`}>Editar <Icon name="chevron" size={14} /></button></td></tr>)}
        </tbody></table></div>}
      <p className="journal__note"><Icon name="shield" size={16} /> Mostramos los 90 registros más recientes. La exportación de Ajustes incluye todo tu historial.</p>
    </section>
  </>;
}
