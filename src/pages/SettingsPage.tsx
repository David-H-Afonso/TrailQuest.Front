import { useState, type FormEvent } from 'react';
import type { Dashboard, Journey, Settings } from '../models/adventure';
import type { AppUser } from '../models/account';
import { apiRoutes } from '../environments/apiRoutes';
import { useSaveSettingsMutation, useUpdateJourneyMutation } from '../services/adventureApi';
import { getErrorMessage } from '../utils/errors';
import { AccountPanel, UsersPanel } from '../components/account/AccountPanels';
import { GarminConnectionPanel } from '../components/account/GarminConnectionPanel';
import { GarminSyncPanel } from '../components/account/GarminSyncPanel';
import { GarminDataExportPanel } from '../components/account/GarminDataExportPanel';
import { IntegrationPanel } from '../components/account/IntegrationPanel';
import { Button } from '../components/elements/Button';
import { Icon } from '../components/elements/Icon';
import { PageHeading } from '../components/elements/PageHeading';
import type { ToastMessage } from '../components/elements/Toast';
import { shiftDate } from '../utils/format';
import { version } from '../../package.json';

type Feedback = (message: ToastMessage) => void;

function PreferencesForm({ dashboard, onFeedback }: { dashboard: Dashboard; onFeedback: Feedback }) {
  const [values, setValues] = useState<Settings>(dashboard.settings);
  const [error, setError] = useState('');
  const [saveSettings, { isLoading }] = useSaveSettingsMutation();
  async function submit(event: FormEvent) {
    event.preventDefault(); setError('');
    try { await saveSettings({ profile: dashboard.profileId, settings: values }).unwrap(); onFeedback({ text: 'Tus preferencias están guardadas.' }); }
    catch (failure) { setError(getErrorMessage(failure)); }
  }
  return <section className="settings-panel panel"><div className="settings-panel__heading"><span className="settings-icon"><Icon name="footprints" /></span><div><h2>A tu medida</h2><p>Un objetivo que encaje con tu día a día.</p></div></div>
    <form className="form-stack" onSubmit={submit}><div className="form-columns">
      <label className="field">Objetivo diario de pasos<input type="number" min="1000" max="50000" step="100" value={values.dailyStepGoal} onChange={(event) => setValues({ ...values, dailyStepGoal: Number(event.target.value) })} required /><span className="field-help">Entre 1.000 y 50.000 pasos.</span></label>
      <label className="field">Longitud de cada paso (cm)<input type="number" min="30" max="150" step="0.1" value={values.stepLengthCm} onChange={(event) => setValues({ ...values, stepLengthCm: Number(event.target.value) })} required /><span className="field-help">Un paso, no una zancada de dos pasos.</span></label>
    </div><p className="field-help">Estimamos los kilómetros al guardar pasos manuales. Cambiar esta medida no recalcula tu historial; Garmin conserva la distancia que reporta.</p>
      <label className="field">Zona horaria<input type="text" list="time-zone-options" value={values.timeZoneId} onChange={(event) => setValues({ ...values, timeZoneId: event.target.value })} required maxLength={100} /><datalist id="time-zone-options"><option value="Europe/Madrid" /><option value="Atlantic/Canary" /><option value="Asia/Tokyo" /><option value="UTC" /></datalist><span className="field-help">Determina cuándo empieza y termina cada día.</span></label>
      <button type="button" className="text-link align-start" onClick={() => setValues({ ...values, timeZoneId: Intl.DateTimeFormat().resolvedOptions().timeZone })}>Usar la zona del dispositivo <Icon name="arrow-right" size={15} /></button>
      {error && <p role="alert" className="form-error">{error}</p>}
      <div className="settings-panel__actions"><Button type="submit" icon="check" loading={isLoading}>Guardar preferencias</Button></div>
    </form>
  </section>;
}

function JourneyDateForm({ dashboard, journey, onFeedback }: { dashboard: Dashboard; journey: Journey; onFeedback: Feedback }) {
  const [startedOn, setStartedOn] = useState(journey.startedOn);
  const [updateJourney, { isLoading }] = useUpdateJourneyMutation();
  const [error, setError] = useState('');
  async function submit(event: FormEvent) {
    event.preventDefault(); setError('');
    try {
      await updateJourney({ profile: dashboard.profileId, routeId: journey.routeId, startedOn }).unwrap();
      onFeedback({ text: 'La fecha de esta aventura se ha actualizado.' });
    } catch (failure) { setError(getErrorMessage(failure)); }
  }
  return <section className="settings-panel panel"><div className="settings-panel__heading"><span className="settings-icon"><Icon name="calendar" /></span><div><h2>El comienzo de esta aventura</h2><p>Solo afecta a la ruta que estás viendo.</p></div></div>
    <form className="form-stack" onSubmit={submit}><label className="field">Contar pasos desde<input type="date" min="2000-01-01" max={dashboard.today} value={startedOn} onChange={(event) => setStartedOn(event.target.value)} required /></label>
      <p className="field-help">Cambiar esta fecha recalcula el recorrido con los días guardados desde entonces. Los sellos y logros ya conseguidos no se borran.</p>
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="settings-panel__actions"><Button variant="secondary" type="submit" icon="calendar" loading={isLoading}>Guardar fecha de inicio</Button></div>
    </form>
  </section>;
}

function ExportPanel({ dashboard, onFeedback }: { dashboard: Dashboard; onFeedback: Feedback }) {
  const [downloading, setDownloading] = useState(false);
  const [partial, setPartial] = useState(false);
  const [startDate, setStartDate] = useState(shiftDate(dashboard.today, -27));
  const [endDate, setEndDate] = useState(dashboard.today);
  async function download() {
    setDownloading(true);
    try {
      const period = partial ? `?${new URLSearchParams({ startDate, endDate })}` : '';
      const response = await fetch(`${apiRoutes.export(dashboard.profileId)}${period}`, { credentials: 'same-origin', cache: 'no-store', headers: { 'X-TrailQuest-Client': 'local-web' } });
      if (response.status === 401) window.dispatchEvent(new Event('trailquest:session-expired'));
      if (!response.ok) throw new Error(getErrorMessage({ data: await response.json().catch(() => ({})) }));
      if (partial && response.headers.get('X-TrailQuest-Export-Range') !== `${startDate}/${endDate}`) {
        await response.body?.cancel();
        throw new Error('Actualiza la API para exportar por fechas. No se ha descargado un archivo con un intervalo incorrecto.');
      }
      const url = URL.createObjectURL(await response.blob());
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `trailquest-${dashboard.profileId}-${dashboard.today}.json`;
      anchor.click();
      URL.revokeObjectURL(url);
      onFeedback({ text: 'Exportación descargada, sin contraseñas ni claves.' });
    } catch (failure) { onFeedback({ text: failure instanceof Error ? failure.message : 'No se pudo descargar la exportación.', error: true }); }
    finally { setDownloading(false); }
  }
  return <section className="settings-panel panel"><div className="settings-panel__heading"><div><h2>Exportar datos</h2><p>Archivo JSON privado del perfil actual.</p></div></div>
    <p className="field-help">Incluye pasos, actividades, salud, preferencias, rutas y logros. No incluye contraseñas, claves ni los archivos originales. Para recuperación completa, conserva los volúmenes de datos y seguridad; el JSON no sustituye esa copia.</p>
    <form className="form-stack" onSubmit={event => { event.preventDefault(); void download(); }}><label className="inline-check"><input type="checkbox" checked={partial} onChange={event => setPartial(event.target.checked)} />Exportar un intervalo</label>
      {partial && <div className="form-columns"><label className="field">Desde<input type="date" min="2000-01-01" max={endDate} required value={startDate} onChange={event => setStartDate(event.target.value)} /></label><label className="field">Hasta<input type="date" min={startDate} max={dashboard.today} required value={endDate} onChange={event => setEndDate(event.target.value)} /></label></div>}
      <Button variant="secondary" icon="download" type="submit" loading={downloading}>Exportar {dashboard.profileId === 'demo' ? 'datos de prueba' : 'mis datos'}</Button>
    </form>
  </section>;
}

export function SettingsPage({ dashboard, user, onFeedback, onUsePersonal, onResetDemo, onSessionClosed }: {
  dashboard: Dashboard; user: AppUser; onFeedback: Feedback; onUsePersonal: () => void; onResetDemo: () => void; onSessionClosed: () => void;
}) {
  const settingsKey = `${dashboard.profileId}-${dashboard.settings.dailyStepGoal}-${dashboard.settings.stepLengthCm}-${dashboard.settings.timeZoneId}`;
  return <>
    <PageHeading title="Ajustes" />
    <div className="settings-grid"><div className="settings-column"><AccountPanel user={user} onSessionClosed={onSessionClosed} /><PreferencesForm key={settingsKey} dashboard={dashboard} onFeedback={onFeedback} />{dashboard.currentJourney && <JourneyDateForm key={`${dashboard.profileId}-${dashboard.currentJourney.routeId}-${dashboard.currentJourney.startedOn}`} dashboard={dashboard} journey={dashboard.currentJourney} onFeedback={onFeedback} />}{user.isOwner && <UsersPanel user={user} onFeedback={onFeedback} />}</div>
      <div className="settings-column"><GarminConnectionPanel user={user} dashboard={dashboard} onFeedback={onFeedback} onUsePersonal={onUsePersonal} /><GarminSyncPanel dashboard={dashboard} accountId={user.id} />{dashboard.profileId === 'personal' && <GarminDataExportPanel dashboard={dashboard} />}<IntegrationPanel accountId={user.id} /><ExportPanel dashboard={dashboard} onFeedback={onFeedback} />
        <details className="settings-panel panel"><summary>Datos de prueba</summary><p className="field-help">Solo afecta al perfil de prueba. Si los ejemplos están desactivados, queda vacío. Tus datos personales y Garmin no cambian.</p><Button variant="ghost" onClick={onResetDemo}>Reiniciar solo la prueba</Button></details>
        <details className="settings-panel panel"><summary>Acerca de TrailQuest</summary><p>Versión de la interfaz: {version}</p><p className="field-help">Código del proyecto con licencia MIT. Los componentes externos conservan sus propias licencias.</p><a className="text-link" href="/licenses/index.html" target="_blank" rel="noopener noreferrer">Licencias y créditos</a></details>
      </div>
    </div>
  </>;
}
