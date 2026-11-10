import { useState, type FormEvent } from 'react';
import type { AppUser } from '../../models/account';
import type { Dashboard } from '../../models/adventure';
import { accountService } from '../../services/accountService';
import { adventureApi, useGetConnectionQuery, useSyncAllGarminMutation } from '../../services/adventureApi';
import { useAppDispatch } from '../../store';
import { getErrorMessage } from '../../utils/errors';
import { formatTimestamp, shiftDate } from '../../utils/format';
import { Button } from '../elements/Button';
import { Icon } from '../elements/Icon';
import { Modal } from '../elements/Modal';
import type { ToastMessage } from '../elements/Toast';

export function GarminConnectionPanel({ user, dashboard, onFeedback, onUsePersonal }: {
  user: AppUser; dashboard: Dashboard; onFeedback: (message: ToastMessage) => void; onUsePersonal: () => void;
}) {
  const { currentData: connection } = useGetConnectionQuery(user.id);
  const dispatch = useAppDispatch();
  const [key, setKey] = useState('');
  const [period, setPeriod] = useState(7);
  const [saving, setSaving] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);
  const [error, setError] = useState('');
  const [replacing, setReplacing] = useState(false);
  const [sync, { isLoading: syncing }] = useSyncAllGarminMutation();
  const configured = connection?.configured ?? dashboard.garmin.configured;
  async function save(event: FormEvent) {
    event.preventDefault(); setError(''); setSaving(true);
    try {
      await accountService.saveGarmin(key);
      dispatch(adventureApi.util.invalidateTags(['Connection', 'Dashboard']));
      setReplacing(false);
      onFeedback({ text: 'Tu clave de Garmin está comprobada y guardada cifrada para esta cuenta.' });
    } catch (failure) { setError(getErrorMessage(failure)); }
    finally { setKey(''); setSaving(false); }
  }
  async function disconnect() {
    setDisconnecting(true);
    try {
      await accountService.disconnectGarmin();
      dispatch(adventureApi.util.invalidateTags(['Connection', 'Dashboard']));
      setConfirmDisconnect(false);
      setReplacing(false); setKey(''); setError('');
      onFeedback({ text: 'Garmin desconectado. Tu historial se conserva.' });
    } catch (failure) { onFeedback({ text: getErrorMessage(failure), error: true }); }
    finally { setDisconnecting(false); }
  }
  async function synchronize() {
    try {
      const result = await sync({ startDate: shiftDate(dashboard.today, -(period - 1)), endDate: dashboard.today }).unwrap();
      onFeedback({ text: result.results.some(x => x.status === 'error') ? 'Importación parcial. Consulta el resultado por conjunto en Tu archivo Garmin.' : 'Conjuntos seleccionados de Garmin importados. Tus pantallas leen ahora la base local.' });
    } catch (failure) { onFeedback({ text: getErrorMessage(failure), error: true }); }
  }
  const keyForm = <form className="form-stack garmin-key-form" onSubmit={save} autoComplete="off"><label className="field">Clave personal de Garmin<input type="password" name="garmin-personal-api-key" autoComplete="new-password" spellCheck={false} autoCapitalize="none" minLength={8} maxLength={4096} value={key} onChange={(event) => setKey(event.target.value)} placeholder="Pega una clave nueva, de forma privada" required disabled={saving || syncing || disconnecting} aria-describedby="garmin-key-help" /></label>
    <p className="field-help" id="garmin-key-help">Se guarda cifrada para tu cuenta y esta instalación. El campo se vacía tras enviarla; la clave guardada nunca se muestra.</p>{error && <p className="form-error" role="alert">{error}</p>}
    <div className="garmin-key-actions"><Button type="submit" loading={saving} disabled={!key.trim() || syncing || disconnecting}>Comprobar y guardar clave</Button></div>
  </form>;
  return <section className="settings-panel panel garmin-panel" id="garmin"><div className="settings-panel__heading"><div><h2>Garmin</h2><p>Conexión de @{user.username}.</p></div><span className={`badge ${configured ? 'badge--green' : ''}`}>{configured ? 'Conectado' : 'Sin conectar'}</span></div>
    <a className="text-link garmin-token-link" href="https://connect.garmin.com/app/settings/personalApiToken" target="_blank" rel="noopener noreferrer">Obtener clave en Garmin Connect <Icon name="arrow-up-right" size={14} /></a>
    <details className="garmin-help"><summary>Cómo obtener y guardar la clave</summary><ol><li>Abre el enlace e inicia sesión en tu cuenta de Garmin Connect.</li><li>Crea una clave de la API personal. Copia el valor cuando Garmin lo muestre y guárdalo en tu gestor de contraseñas.</li><li>Pega la clave en TrailQuest y pulsa Comprobar y guardar clave.</li><li>Elige los conjuntos que quieras importar en Tu archivo Garmin.</li></ol><p className="field-help">Es una clave de API, no tu contraseña de Garmin. No la compartas en chats, issues ni capturas.</p></details>
    {configured ? <details className="garmin-replace" open={replacing} onToggle={event=>{const open=event.currentTarget.open;setReplacing(open);if(!open){setKey('');setError('');}}}><summary>Sustituir la clave</summary>{replacing && keyForm}</details> : keyForm}
    {configured && <div className="garmin-connection-status">{connection?.verifiedAtUtc && <p className="field-help">Comprobada el {formatTimestamp(connection.verifiedAtUtc, dashboard.settings.timeZoneId)}.</p>}<Button variant="ghost" compact onClick={() => setConfirmDisconnect(true)} disabled={saving || syncing || disconnecting}>Desconectar</Button></div>}
    {dashboard.profileId === 'demo' ? <div className="inline-note garmin-profile-note"><Icon name="flask" /><div><p>Puedes configurar tu conexión aquí. Para importar pasos reales, cambia a Mis datos.</p><Button variant="secondary" compact onClick={onUsePersonal}>Cambiar a Mis datos</Button></div></div>
      : <><div className="sync-controls"><label className="field">Periodo<select value={period} onChange={(event) => setPeriod(Number(event.target.value))} disabled={syncing}><option value={7}>Últimos 7 días</option><option value={28}>Últimos 28 días</option></select></label><Button icon="refresh" onClick={() => void synchronize()} disabled={!configured || saving || disconnecting} loading={syncing}>Sincronizar selección de Garmin</Button></div>{dashboard.garmin.lastSyncAtUtc && <p className="field-help">Última sincronización: {formatTimestamp(dashboard.garmin.lastSyncAtUtc, dashboard.settings.timeZoneId)}.</p>}</>}
    <p className="quiet-note"><Icon name="shield" size={16} /> Sincroniza antes el reloj con Connect. La frecuencia opcional se configura en Tu archivo Garmin. En otro equipo o sistema operativo tendrás que configurar tu clave allí también.</p>
    {confirmDisconnect && <Modal title="¿Desconectar tu Garmin?" eyebrow="Solo tu conexión en este equipo" onClose={() => setConfirmDisconnect(false)}><p>Eliminaremos la clave guardada de tu cuenta en esta instalación. No se borra tu historial, no se cambian otras cuentas y no se revoca la clave en Garmin Connect.</p><div className="modal__actions"><Button variant="ghost" onClick={() => setConfirmDisconnect(false)} disabled={disconnecting}>Cancelar</Button><Button variant="danger" loading={disconnecting} onClick={() => void disconnect()}>Eliminar mi conexión</Button></div></Modal>}
  </section>;
}
