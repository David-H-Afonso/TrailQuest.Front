import { useState, type FormEvent } from 'react';
import { adventureApi, useGetGrantsQuery, useRevokeGrantMutation } from '../../services/adventureApi';
import { useAppDispatch } from '../../store';
import { Button } from '../elements/Button';
import { Icon } from '../elements/Icon';
import { getErrorMessage } from '../../utils/errors';
import { formatDate } from '../../utils/format';
import { privateRequests } from '../../services/privateRequests';
import { InlineFeedback } from '../elements/InlineFeedback';

const scopes = [['steps:read','Pasos y distancia diaria'],['activities:read','Actividades y fuerza'],['wellness:read','Métricas de salud'],['routes:read','Trazados GPS completos (sensibles)']];

export function IntegrationPanel({ accountId }: { accountId: string }) {
  const dispatch = useAppDispatch();
  const { currentData: grants, error } = useGetGrantsQuery(accountId);
  const [revoke] = useRevokeGrantMutation();
  const [application, setApplication] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [days, setDays] = useState(30);
  const [token, setToken] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  async function create(event: FormEvent) {
    event.preventDefault(); setBusy(true); setToken(''); setMessage('');
    try { const result = await privateRequests.createGrant(application, selected, days); setToken(result.token); dispatch(adventureApi.util.invalidateTags(['Grants'])); }
    catch (failure) { setMessage(getErrorMessage(failure)); } finally { setBusy(false); }
  }
  return <section className="settings-panel panel"><div className="settings-panel__heading"><span className="settings-icon"><Icon name="key" /></span><div><h2>Identidad e integraciones</h2><p>Cada aplicación recibe solo los permisos que autorices.</p></div></div><p>Tu cuenta conserva un identificador local estable. No vinculamos personas por su nombre. El inicio de sesión común con OpenID Connect requiere elegir y configurar un proveedor; no está activado.</p><p className="field-help">Estos permisos de lectura son independientes del futuro SSO. Funcionan contra tu API local; no exponen puertos ni autorizan otras aplicaciones a usar tu clave Garmin. Configúralos solo desde un backend de confianza.</p>
    <form className="form-stack" onSubmit={event => void create(event)}><label className="field">Aplicación autorizada<input value={application} maxLength={60} required onChange={event => setApplication(event.target.value)} placeholder="Por ejemplo, MealAgenda" /></label><fieldset className="scope-options"><legend>Permisos explícitos de lectura</legend>{scopes.map(([id,label]) => <label className="inline-check" key={id}><input type="checkbox" checked={selected.includes(id)} onChange={() => setSelected(selected.includes(id) ? selected.filter(x => x !== id) : [...selected,id])} />{label}</label>)}</fieldset><label className="field">Caducidad<select value={days} onChange={event => setDays(Number(event.target.value))}>{[7,30,90].map(x => <option key={x} value={x}>{x} días</option>)}</select></label><Button type="submit" variant="secondary" loading={busy} disabled={!selected.length}>Crear permiso revocable</Button></form>
    {token && <div className="one-time-secret"><strong>Credencial mostrada una sola vez</strong><p>No se guarda en el navegador ni en Redux. El servidor conserva solo su hash. No la pegues en el chat.</p><label className="field">Token para el backend autorizado<input type="password" value={token} readOnly autoComplete="off" /></label><div className="inline-actions"><Button variant="secondary" onClick={() => void navigator.clipboard.writeText(token).then(() => setMessage('Copiado. Guárdalo de forma privada en el backend autorizado.')).catch(() => setMessage('El navegador no permitió copiar. Selecciona el campo y cópialo manualmente.'))}>Copiar</Button><Button variant="ghost" onClick={() => setToken('')}>Ya lo he guardado</Button></div></div>}
    {message && <InlineFeedback message={message} onClose={()=>setMessage('')}/>}{error && <p role="alert">No se pudo leer la lista de permisos.</p>}
    <div className="grant-list">{grants?.map(grant => <div className="grant-row" key={grant.id}><strong>{grant.application}</strong><small>{grant.scopes.join(' · ')}</small><span>Hasta {formatDate(grant.expiresAtUtc.slice(0,10))}</span><Button variant="ghost" compact onClick={() => void revoke(grant.id).unwrap().then(() => setMessage('Permiso revocado.')).catch(failure => setMessage(getErrorMessage(failure)))}>Revocar</Button></div>)}</div>
  </section>;
}
