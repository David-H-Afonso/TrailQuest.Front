import type { DailySteps } from '../../models/adventure';
import { formatDate, formatNumber } from '../../utils/format';

export function WeekChart({ days, goal }: { days: DailySteps[]; goal: number }) {
  const max = Math.max(goal, ...days.map((day) => day.steps), 1);
  const total = days.reduce((sum, day) => sum + day.steps, 0);
  return <section className="week-card panel"><div className="section-label"><h2>Los últimos 7 días</h2><span className="tiny-label">PASOS</span></div>
    <p className="week-total">{formatNumber(total)} <span>pasos en el camino</span></p>
    <figure className="week-chart" aria-label={`Actividad de los últimos 7 días: ${formatNumber(total)} pasos en total.`}>
      <div className="week-chart__goal" style={{ bottom: `${26 + 108 * goal / max}px` }}><span>Objetivo</span></div>
      <ol>{days.map((day, index) => <li key={day.date} className={index === days.length - 1 ? 'is-today' : ''}>
        <div className="week-chart__column" title={`${formatDate(day.date)}: ${formatNumber(day.steps)} pasos`}>
          <span className="week-chart__bar" style={{ height: `${Math.max(3, day.steps / max * 108)}px` }} />
        </div><span className="week-chart__day" aria-hidden="true">{formatDate(day.date, { weekday: 'narrow' })}</span>
        <span className="sr-only">{formatDate(day.date)}: {formatNumber(day.steps)} pasos</span>
      </li>)}</ol>
    </figure>
    <p className="week-card__footnote">Los días de descanso también son parte del viaje.</p>
  </section>;
}
