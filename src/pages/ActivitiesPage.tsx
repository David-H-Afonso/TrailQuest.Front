import { lazy,Suspense,useState,type FormEvent } from 'react';
import type { Dashboard } from '../models/adventure';
import { adventureApi,useGetActivityQuery,useGetHealthQuery } from '../services/adventureApi';
import { useAppDispatch } from '../store';
import { PageHeading } from '../components/elements/PageHeading';
import { Button } from '../components/elements/Button';
import { Modal } from '../components/elements/Modal';
import type { ToastMessage } from '../components/elements/Toast';
import { DataState } from '../components/activity/DataState';
import { TrackSchematic } from '../components/activity/MetricChart';
import { ShareDialog } from '../components/community/ShareDialog';
import { formatInstantDate,formatKm,formatNumber,shiftDate } from '../utils/format';
import { sportLabel } from '../utils/activities';
import { getErrorMessage } from '../utils/errors';
import { privateRequests } from '../services/privateRequests';
import { PeriodFilter } from '../components/activity/PeriodFilter';

const RecordedMap=lazy(()=>import('../components/activity/RecordedMap'));

function ActivityReader({id,dashboard,accountId,close,onFeedback}:{id:number;dashboard:Dashboard;accountId:string;close:()=>void;onFeedback?:(message:ToastMessage)=>void}) {
  const {currentData:data,error}=useGetActivityQuery({profile:dashboard.profileId,accountId,id});
  const [streetMap,setStreetMap]=useState(false);
  const [mapFailure,setMapFailure]=useState(false);
  const [sharing,setSharing]=useState(false);
  const strength=data?.activity.sport.toLowerCase().includes('strength');
  return <Modal title={data?.activity.name??'Actividad'} eyebrow={data?sportLabel(data.activity.sport):undefined} className="activity-reader" onClose={close}>
    {!data?<DataState error={error}/>:<>
      <p className="activity-recorded-at">{new Intl.DateTimeFormat('es-ES',{timeZone:dashboard.settings.timeZoneId,dateStyle:'long',timeStyle:'short'}).format(new Date(data.activity.startedAtUtc))}</p>
      <div className="activity-facts"><span><strong>{data.activity.durationSeconds==null?'—':formatNumber(Math.round(data.activity.durationSeconds/60))}</strong>minutos</span><span><strong>{strength?data.activity.volumeKg==null?'—':`${formatNumber(data.activity.volumeKg)} kg`:data.activity.distanceMeters==null?'—':formatKm(data.activity.distanceMeters/1000)}</strong>{strength?'volumen registrado':'distancia'}</span><span><strong>{strength?data.activity.repetitions==null?'—':formatNumber(data.activity.repetitions):data.activity.caloriesKcal==null?'—':formatNumber(data.activity.caloriesKcal)}</strong>{strength?'repeticiones':'kcal'}</span></div>
      {data.activity.exercises.length>0&&<div className="table-scroll exercise-table"><table><caption>Ejercicios</caption><thead><tr><th>Ejercicio</th><th>Series</th><th>Repeticiones</th><th>Carga máx.</th><th>Volumen</th></tr></thead><tbody>{data.activity.exercises.map((exercise,index)=><tr key={index}><td>{exercise.name.replaceAll('_',' ')}</td><td>{exercise.sets??'—'}</td><td>{exercise.repetitions??'—'}</td><td>{exercise.maxWeightKg==null?'—':`${formatNumber(exercise.maxWeightKg)} kg`}</td><td>{exercise.volumeKg==null?'—':`${formatNumber(exercise.volumeKg)} kg`}</td></tr>)}</tbody></table></div>}
      {data.track.length>0&&<section className="activity-route"><header className="panel-heading"><h3>Recorrido</h3><Button variant="secondary" compact onClick={()=>{setStreetMap(!streetMap||mapFailure);setMapFailure(false);}}>{streetMap&&!mapFailure?'Ver esquema':'Abrir callejero'}</Button></header>{streetMap&&!mapFailure?<Suspense fallback={<p role="status">Cargando mapa…</p>}><RecordedMap points={data.track} onFailure={()=>setMapFailure(true)}/></Suspense>:<TrackSchematic points={data.track}/>}<p className="field-help">El esquema es privado. Al abrir el callejero, OpenStreetMap puede conocer la zona consultada.</p>{mapFailure&&<p role="status" className="map-unavailable">El callejero no está disponible. Se muestra el esquema del recorrido.</p>}</section>}
      <details className="data-details"><summary>Datos de la grabación</summary><p className="field-help">{data.activity.source==='demo'?'Datos de prueba':data.activity.source==='file'?'Archivo importado':'Garmin'} · {data.track.length} puntos GPS{data.activity.originalStatus==='pending'?' · Original pendiente de importar':''}</p>{!data.track.length&&<p className="field-help">Sin trazado GPS.</p>}{data.track.length>0&&<div className="table-scroll"><table><thead><tr><th>Latitud</th><th>Longitud</th><th>Hora UTC</th><th>Altitud</th></tr></thead><tbody>{data.track.slice(0,200).map((point,index)=><tr key={index}><td>{point.latitude.toFixed(5)}</td><td>{point.longitude.toFixed(5)}</td><td>{point.atUtc??'—'}</td><td>{point.elevationMeters??'—'}</td></tr>)}</tbody></table></div>}{['imported','no-track'].includes(data.activity.originalStatus)&&data.activity.source!=='demo'&&<a className="text-link" href={`/api/v1/profiles/${dashboard.profileId}/activities/${id}/original`}>Descargar original</a>}</details>
      <div className="modal__actions"><Button variant="secondary" onClick={close}>Cerrar</Button><Button onClick={()=>setSharing(true)}>Compartir actividad</Button></div>
      {sharing&&<ShareDialog request={{kind:'activity',sourceId:String(id),includeTrack:false}} profile={dashboard.profileId} onClose={()=>setSharing(false)} onPublished={message=>{onFeedback?.(message);close();}}/>}
    </>}
  </Modal>;
}

export function ActivitiesPage({dashboard,accountId,onFeedback}:{dashboard:Dashboard;accountId:string;onFeedback?:(message:ToastMessage)=>void}) {
  const dispatch=useAppDispatch();
  const [selected,setSelected]=useState<number|null>(null);
  const [filter,setFilter]=useState('all');
  const [importing,setImporting]=useState(false);
  const [errorText,setErrorText]=useState('');
  const [importOpen,setImportOpen]=useState(false);
  const [period,setPeriod]=useState({startDate:shiftDate(dashboard.today,-27),endDate:dashboard.today});
  const {currentData:data,error,refetch}=useGetHealthQuery({profile:dashboard.profileId,accountId,...period});
  const activities=data?.activities.filter(item=>filter==='all'||(filter==='strength'?item.sport.toLowerCase().includes('strength'):item.trackPoints>0))??[];
  const strengthCount=activities.filter(item=>item.sport.toLowerCase().includes('strength')).length;
  const minutes=activities.reduce((sum,item)=>sum+(item.durationSeconds??0),0)/60;
  const volume=activities.reduce((sum,item)=>sum+(item.volumeKg??0),0);
  async function importFile(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();setImporting(true);setErrorText('');
    try {await privateRequests.importActivity(dashboard.profileId,new FormData(event.currentTarget));dispatch(adventureApi.util.invalidateTags(['Health']));setImportOpen(false);onFeedback?.({text:'Actividad importada.'});}
    catch(failure){setErrorText(getErrorMessage(failure));}finally{setImporting(false);}
  }
  return <>
    <PageHeading title="Actividad" actions={<><PeriodFilter today={dashboard.today} value={period} onChange={setPeriod}/><Button variant="secondary" onClick={()=>setImportOpen(true)}>Importar archivo</Button></>}/>
    {data&&activities.length>0&&<div className="activity-period-summary"><div><strong>{activities.length}</strong><span>actividades</span></div><div><strong>{formatNumber(Math.round(minutes))} <small>min</small></strong><span>tiempo registrado</span></div><div><strong>{strengthCount}</strong><span>sesiones de fuerza</span></div>{volume>0&&<div><strong>{formatNumber(volume)} <small>kg</small></strong><span>volumen de fuerza</span></div>}</div>}
    <div className="activity-toolbar"><div className="segmented-control" role="group" aria-label="Filtrar actividades">{[['all','Todas'],['strength','Fuerza'],['gps','Con GPS']].map(([value,label])=><button type="button" key={value} aria-pressed={filter===value} onClick={()=>setFilter(value)}>{label}</button>)}</div><span>{activities.length} {activities.length===1?'actividad':'actividades'}</span></div>
    {!data?<DataState error={error} retry={()=>void refetch()}/>:!activities.length?<DataState empty title="No hay actividades en este periodo"/>:<div className="activity-list">{activities.map(item=><button type="button" className="activity-record panel" key={item.id} onClick={()=>setSelected(item.id)}><span className="activity-record__date">{formatInstantDate(item.startedAtUtc,dashboard.settings.timeZoneId)}</span><span className="activity-record__body"><strong>{item.name}</strong><span>{sportLabel(item.sport)}{item.trackPoints>0?' · GPS':''}</span></span><span className="activity-record__stats"><strong>{item.durationSeconds==null?'—':formatNumber(Math.round(item.durationSeconds/60))}<small> min</small></strong><span>{item.volumeKg!=null?`${formatNumber(item.volumeKg)} kg`:item.distanceMeters!=null?formatKm(item.distanceMeters/1000):'—'}</span></span><span aria-hidden="true">→</span></button>)}</div>}
    {selected!=null&&<ActivityReader id={selected} dashboard={dashboard} accountId={accountId} close={()=>setSelected(null)} onFeedback={onFeedback}/>}
    {importOpen&&<Modal title="Importar actividad" onClose={()=>setImportOpen(false)}><form className="form-stack" onSubmit={event=>void importFile(event)}><label className="field">Nombre (opcional)<input name="name" maxLength={120}/></label><label className="field">Grabación<input name="file" type="file" accept=".fit,.gpx,.tcx,.zip" required/></label><p className="field-help">FIT, GPX, TCX o ZIP · máximo 32 MB. Los archivos repetidos no duplican la actividad.</p>{errorText&&<p role="alert" className="form-error">{errorText}</p>}<Button type="submit" loading={importing}>Importar</Button></form></Modal>}
  </>;
}
