import { useId, useState } from 'react';
import type { MetricSample, MetricSeries, TrackPoint } from '../../models/health';
import { formatNumber } from '../../utils/format';
import { hourlySamples } from '../../utils/samples';
import { useMediaQuery } from '../../hooks/useMediaQuery';

export function MetricChart({ series, timeZone }: { series: MetricSeries; timeZone: string }) {
  const [hourly, setHourly] = useState(false);
  const titleId = useId();
  const compact = useMediaQuery('(max-width: 600px)');
  const width = compact ? 360 : 780;
  const samples = hourly ? hourlySamples(series.samples) : series.samples;
  if (!samples.length) return <p className="field-help">No hay lecturas registradas para este periodo.</p>;
  const times = samples.map(x => new Date(x.atUtc).getTime());
  const minTime = Math.min(...times), maxTime = Math.max(...times);
  const low = Math.min(...samples.map(x => x.value)), high = Math.max(...samples.map(x => x.value));
  const position = (sample: MetricSample) => `${45 + (new Date(sample.atUtc).getTime() - minTime) / Math.max(1, maxTime - minTime) * (width-90)},${185 - (sample.value - low) / Math.max(1, high - low) * 140}`;
  const time = (value: string) => new Intl.DateTimeFormat('es-ES', { timeZone, hour: '2-digit', minute: '2-digit', timeZoneName: 'shortOffset' }).format(new Date(value));
  const segments: MetricSample[][] = [];
  samples.forEach((sample, index) => { if (!index || times[index] - times[index - 1] > 7200000) segments.push([]); segments[segments.length - 1].push(sample); });
  return <section className="metric-chart"><div className="chart-options"><span>{formatNumber(low)}–{formatNumber(high)} {series.unit}</span><label className="inline-check"><input type="checkbox" checked={hourly} onChange={event => setHourly(event.target.checked)} />Media por hora</label></div>
    <svg viewBox={`0 0 ${width} 230`} role="img" aria-labelledby={titleId}><title id={titleId}>{series.label}: {samples.length} {hourly ? 'medias de muestras por hora' : 'lecturas'}, de {formatNumber(low)} a {formatNumber(high)} {series.unit}. Tabla disponible a continuación.</title>
      {[45,115,185].map(y => <line key={y} x1="45" x2={width-45} y1={y} y2={y} stroke="var(--line)" />)}
      <text x="5" y="48">{formatNumber(high)}</text><text x="5" y="188">{formatNumber(low)}</text>
      {segments.map((points, index) => <polyline key={index} points={points.map(position).join(' ')} fill="none" stroke="var(--teal)" strokeWidth="3" strokeLinejoin="round" />)}
      {samples.length < 50 && samples.map(sample => { const [x,y] = position(sample).split(','); return <circle key={sample.atUtc} cx={x} cy={y} r="4" fill="var(--teal)" />; })}
      <text x="45" y="220">{time(samples[0].atUtc)}</text><text x={width-45} y="220" textAnchor="end">{time(samples[samples.length - 1].atUtc)}</text>
    </svg><details className="data-details"><summary>Ver lecturas · {samples.length}</summary><p className="field-help">{hourly?'Media de las muestras disponibles por hora.':'Lecturas registradas, sin rellenar los huecos.'} Zona horaria: {timeZone}.</p><div className="table-scroll"><table><caption className="sr-only">Lecturas de {series.label}</caption><thead><tr><th scope="col">Hora</th><th scope="col">Valor ({series.unit})</th></tr></thead><tbody>{samples.slice(0,200).map(x => <tr key={x.atUtc}><td>{time(x.atUtc)}</td><td>{formatNumber(Math.round(x.value * 100) / 100)}</td></tr>)}</tbody></table></div>{samples.length > 200 && <p className="field-help">Primeras 200 lecturas de {samples.length}.</p>}</details>
  </section>;
}

export function TrackSchematic({ points }: { points: TrackPoint[] }) {
  if (points.length < 2) return <p className="field-help">Esta actividad no contiene un trazado GPS utilizable.</p>;
  const stride = Math.max(1, Math.ceil(points.length / 3000));
  const reduced = points.filter((_p, i) => i % stride === 0 || i === points.length - 1);
  const latitudes = reduced.map(x => x.latitude), longitudes = reduced.map(x => x.longitude);
  const minLat = Math.min(...latitudes), maxLat = Math.max(...latitudes), minLon = Math.min(...longitudes), maxLon = Math.max(...longitudes);
  const lonScale = Math.cos((minLat + maxLat) / 2 * Math.PI / 180);
  const scale = Math.min(640 / Math.max(.000001, (maxLon - minLon) * lonScale), 300 / Math.max(.000001, maxLat - minLat));
  const project = (point: TrackPoint) => [380 + (point.longitude - (minLon + maxLon) / 2) * lonScale * scale, 185 - (point.latitude - (minLat + maxLat) / 2) * scale];
  const start = project(reduced[0]), end = project(reduced[reduced.length - 1]);
  return <figure className="recorded-track"><svg viewBox="0 0 760 370" role="img" aria-label={`Trazado GPS de ${points.length} puntos. Esquema geográfico sin callejero, norte arriba.`}>
    <rect width="760" height="370" rx="12" fill="#eef4f1" />{[100,200,300,400,500,600,700].map(x => <path key={x} d={`M${x} 0v370M0 ${x / 2}h760`} stroke="#d8e4de" />)}
    <polyline points={reduced.map(p => project(p).join(',')).join(' ')} fill="none" stroke="var(--teal)" strokeWidth="4" strokeLinejoin="round" />
    <circle cx={start[0]} cy={start[1]} r="7" fill="var(--teal)" stroke="white" strokeWidth="3" /><circle cx={end[0]} cy={end[1]} r="7" fill="#b35c3b" stroke="white" strokeWidth="3" /><text x="720" y="28">N ↑</text>
  </svg><figcaption>Esquema de coordenadas registradas · sin enviar tu recorrido a un proveedor de mapas.</figcaption></figure>;
}
