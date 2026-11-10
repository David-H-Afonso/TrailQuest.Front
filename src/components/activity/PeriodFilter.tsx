import { useState, type FormEvent } from 'react';
import { formatDate, shiftDate } from '../../utils/format';
import { Button } from '../elements/Button';

export interface StoredPeriod { startDate: string; endDate: string }
export function PeriodFilter({ today,value,onChange }: { today:string;value:StoredPeriod;onChange:(period:StoredPeriod)=>void }) {
  const [draft,setDraft] = useState(value);
  const [editing,setEditing] = useState(false);
  const [error,setError] = useState('');
  const preset = [7,28,90,365].find(days => value.startDate === shiftDate(today,1-days) && value.endDate === today);
  function choose(selected:string) { if(selected==='custom'){setDraft(value);setEditing(true);return;} const days=Number(selected);onChange({startDate:shiftDate(today,1-days),endDate:today});setEditing(false);setError(''); }
  function submit(event:FormEvent) { event.preventDefault();const days=(Date.parse(draft.endDate)-Date.parse(draft.startDate))/86400000+1;if(!Number.isFinite(days)||days<1||days>366){setError('El periodo debe tener entre 1 y 366 días.');return;}onChange(draft);setEditing(false);setError(''); }
  return <div className="period-control"><label className="period-select"><span className="sr-only">Periodo</span><select value={editing ? 'custom' : preset ?? 'custom'} onChange={event=>choose(event.target.value)}><option value={7}>Últimos 7 días</option><option value={28}>Últimos 28 días</option><option value={90}>Últimos 90 días</option><option value={365}>Último año</option><option value="custom">Elegir fechas…</option></select></label><span className="period-caption">{formatDate(value.startDate)} — {formatDate(value.endDate)}</span>
    {editing && <form className="period-custom" onSubmit={submit}><label className="field">Desde<input type="date" min="2000-01-01" max={draft.endDate} value={draft.startDate} required onChange={event=>setDraft({...draft,startDate:event.target.value})} /></label><label className="field">Hasta<input type="date" min={draft.startDate} max={today} value={draft.endDate} required onChange={event=>setDraft({...draft,endDate:event.target.value})} /></label><Button variant="secondary" type="submit">Aplicar</Button><Button variant="ghost" onClick={()=>setEditing(false)}>Cancelar</Button>{error&&<p role="alert" className="form-error">{error}</p>}</form>}
  </div>;
}
