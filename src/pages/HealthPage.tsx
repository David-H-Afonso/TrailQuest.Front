import { useState } from 'react';
import type { Dashboard } from '../models/adventure';
import { useGetDatasetsQuery, useGetDocumentsQuery, useGetHealthQuery } from '../services/adventureApi';
import { PageHeading } from '../components/elements/PageHeading';
import { MetricChart } from '../components/activity/MetricChart';
import { DataState } from '../components/activity/DataState';
import { formatDate, formatNumber, formatTimestamp, shiftDate } from '../utils/format';
import { PeriodFilter } from '../components/activity/PeriodFilter';

function DocumentInspector({ profile,accountId,dataset }: { profile:Dashboard['profileId'];accountId:string;dataset:string }) {
  const [limit,setLimit] = useState(7);
  const {currentData,error} = useGetDocumentsQuery({profile,accountId,dataset,limit});
  return <div className="document-inspector"><label className="field">Registros recientes<select value={limit} onChange={event=>setLimit(Number(event.target.value))}>{[1,7,31].map(value=><option key={value} value={value}>{value}</option>)}</select></label>
    {!currentData ? <DataState error={error}/> : <>{currentData.map(item=><details key={item.id}><summary>{formatDate(item.date)}</summary><pre>{JSON.stringify(item.data,null,2)}</pre></details>)}<p className="field-help">{currentData.length} registros privados de tu cuenta.</p></>}
  </div>;
}

const highlights = [
  {id:'sleep-hours',label:'Sueño',unit:'h'},
  {id:'resting-heart-rate',label:'Pulso en reposo',unit:'ppm'},
  {id:'body-battery',label:'Body Battery',unit:'/100'},
  {id:'calories-active',label:'Energía activa',unit:'kcal'},
];

export function HealthPage({dashboard,accountId}:{dashboard:Dashboard;accountId:string}) {
  const [date,setDate] = useState('');
  const [dataset,setDataset] = useState('');
  const [seriesId,setSeriesId] = useState('heart-rate');
  const [period,setPeriod] = useState({startDate:shiftDate(dashboard.today,-27),endDate:dashboard.today});
  const {currentData:data,error,refetch} = useGetHealthQuery({profile:dashboard.profileId,accountId,...period});
  const {currentData:datasets} = useGetDatasetsQuery();
  const day = data?.days.find(item=>item.date===date) ?? data?.days.find(item=>item.metrics.length>0) ?? data?.days[0];
  const series = day?.series.find(item=>item.id===seriesId) ?? day?.series[0];
  const extra = day?.metrics.filter(item=>!highlights.some(highlight=>highlight.id===item.id)) ?? [];
  return <>
    <PageHeading title="Salud" actions={<PeriodFilter today={dashboard.today} value={period} onChange={setPeriod} />} />
    {!data ? <DataState error={error} retry={()=>void refetch()} /> : !data.days.length ? <DataState empty title="No hay datos de salud en este periodo" /> : <>
      <div className="health-datebar"><label className="day-select"><span>Día</span><select value={day?.date??''} onChange={event=>setDate(event.target.value)}>{data.days.map(item=><option key={item.date} value={item.date}>{item.date===dashboard.today ? 'Hoy' : formatDate(item.date,{weekday:'long',day:'numeric',month:'short'})}</option>)}</select></label>{data.lastSyncAtUtc&&<span className="view-updated">Sincronizado {formatTimestamp(data.lastSyncAtUtc,dashboard.settings.timeZoneId)}</span>}</div>
      <div className="health-highlights">{highlights.map(item=>{
        const metric=day?.metrics.find(value=>value.id===item.id);const value=metric?.value;
        const sleep=item.id==='sleep-hours'&&value!=null;
        return <article className="health-highlight panel" key={item.id}><span>{item.label}</span><strong>{value==null?'—':sleep?Math.floor(value):formatNumber(value)}<small>{sleep?`h ${Math.round((value-Math.floor(value))*60)} min`:metric?.unit??item.unit}</small></strong>{value==null&&<p>Sin datos</p>}</article>;
      })}</div>
      <section className="health-panel health-chart-panel panel"><header className="panel-heading"><h2>{series?.label??'Evolución del día'}</h2>{day&&day.series.length>0&&<label className="field"><span className="sr-only">Métrica temporal</span><select value={series?.id??''} onChange={event=>setSeriesId(event.target.value)}>{day.series.map(item=><option value={item.id} key={item.id}>{item.label}</option>)}</select></label>}</header>
        {series?<MetricChart key={`${day?.date}-${series.id}`} series={series} timeZone={dashboard.settings.timeZoneId} />:<p className="empty-inline">No hay lecturas por hora para este día.</p>}
      </section>
      {extra.length>0&&<details className="health-extra panel"><summary>Más métricas · {extra.length}</summary><div className="metric-grid">{extra.map(item=><div className="metric-line" key={item.id}><span>{item.label}</span><strong>{item.value==null?'—':formatNumber(item.value)} <small>{item.unit}</small></strong></div>)}</div></details>}
    </>}
    {data&&data.coverage.length>0&&<details className="health-archive panel"><summary>Datos de origen</summary><div className="coverage-list">{data.coverage.map(item=><button type="button" className={`coverage-item ${dataset===item.id?'is-selected':''}`} key={item.id} onClick={()=>setDataset(dataset===item.id?'':item.id)} aria-expanded={dataset===item.id}><span>{datasets?.find(value=>value.id===item.id)?.name??item.id}</span><strong>{item.documents} registros</strong></button>)}</div>{dataset&&<DocumentInspector key={`${dashboard.profileId}-${dataset}`} profile={dashboard.profileId} accountId={accountId} dataset={dataset} />}</details>}
  </>;
}
