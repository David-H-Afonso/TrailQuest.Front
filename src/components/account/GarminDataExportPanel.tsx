import { useMemo, useRef, useState, type FormEvent } from 'react';
import type { Dashboard } from '../../models/adventure';
import type { GarminExport } from '../../models/health';
import { apiRoutes } from '../../environments/apiRoutes';
import { useGetDatasetsQuery } from '../../services/adventureApi';
import { shiftDate } from '../../utils/format';
import { getErrorMessage } from '../../utils/errors';
import { Button } from '../elements/Button';
import { Icon } from '../elements/Icon';

export function GarminDataExportPanel({ dashboard }: { dashboard: Dashboard }) {
  const { currentData: datasets, error: datasetsError } = useGetDatasetsQuery();
  const [allDatasets, setAllDatasets] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>(['sleep', 'body-battery']);
  const [startDate, setStartDate] = useState(shiftDate(dashboard.today, -6));
  const [endDate, setEndDate] = useState(dashboard.today);
  const [sensitiveConfirmed, setSensitiveConfirmed] = useState(false);
  const [json, setJson] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [preparing, setPreparing] = useState(false);
  const textarea = useRef<HTMLTextAreaElement>(null);

  const selected = useMemo(() => (datasets ?? []).filter(item => allDatasets || selectedIds.includes(item.id)), [datasets, allDatasets, selectedIds]);
  const sensitive = selected.filter(item => item.sensitive);
  const needsSensitiveConfirmation = sensitive.length > 0;
  const canPrepare = selected.length > 0 && startDate <= endDate &&
    (!needsSensitiveConfirmation || sensitiveConfirmed) && !preparing;

  function invalidateJson() {
    setJson('');
    setError('');
    setMessage('');
  }

  function selectAll(checked: boolean) {
    invalidateJson();
    setAllDatasets(checked);
    setSensitiveConfirmed(false);
  }

  function toggleDataset(id: string) {
    invalidateJson();
    setSelectedIds(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id]);
    setSensitiveConfirmed(false);
  }

  async function prepare(event: FormEvent) {
    event.preventDefault();
    if (!canPrepare) return;
    setPreparing(true);
    setError('');
    setMessage('');
    setJson('');
    try {
      const params = new URLSearchParams({ startDate, endDate });
      if (allDatasets) params.set('datasets', 'all');
      else selected.forEach(dataset => params.append('datasets', dataset.id));
      const response = await fetch(`${apiRoutes.garminExport(dashboard.profileId)}?${params}`, {
        credentials: 'same-origin', cache: 'no-store',
        headers: { 'X-TrailQuest-Client': 'local-web' },
      });
      if (response.status === 401) window.dispatchEvent(new Event('trailquest:session-expired'));
      if (!response.ok) {
        const problem = await response.json().catch(() => ({}));
        throw new Error(getErrorMessage({ data: problem }));
      }
      const expectedRange = `${startDate}/${endDate}`;
      if (response.headers.get('X-TrailQuest-Export-Range') !== expectedRange) {
        await response.body?.cancel();
        throw new Error('Actualiza la API para preparar este periodo. No se ha guardado un archivo con fechas distintas.');
      }
      const result = await response.json() as GarminExport;
      if (result.schemaVersion !== 1 || result.startDate !== startDate || result.endDate !== endDate) {
        throw new Error('La respuesta de exportación no coincide con la selección. Actualiza la aplicación e inténtalo de nuevo.');
      }
      const resultIds = [...result.datasets].sort();
      const expectedIds = selected.map(item => item.id).sort();
      if (resultIds.length !== expectedIds.length || resultIds.some((id, index) => id !== expectedIds[index])) {
        throw new Error('El API devolvió conjuntos distintos a los elegidos. No se ha preparado el JSON.');
      }
      const text = JSON.stringify(result, null, 2);
      setJson(text);
      const recordCount = result.days.reduce((total, day) => total + day.steps.length + day.activities.length + day.healthRecords.length, 0);
      setMessage(`${recordCount} registros de ${result.days.length} días preparados. Revísalos antes de compartir.`);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'No se pudo preparar el archivo JSON.');
    } finally {
      setPreparing(false);
    }
  }

  async function copyJson() {
    if (!json) return;
    try {
      if (!navigator.clipboard?.writeText) throw new Error('clipboard_unavailable');
      await navigator.clipboard.writeText(json);
      setMessage('JSON copiado. Revísalo antes de pegarlo en ChatGPT u otro servicio.');
    } catch {
      textarea.current?.focus();
      textarea.current?.select();
      setMessage('No se pudo copiar automáticamente. El JSON está seleccionado; pulsa Ctrl+C o ⌘C.');
    }
  }

  function downloadJson() {
    if (!json) return;
    const url = URL.createObjectURL(new Blob([json], { type: 'application/json;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `trailquest-garmin-${startDate}-${endDate}.json`;
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setMessage('Archivo JSON descargado. Revísalo antes de compartirlo.');
  }

  const options = (isSensitive: boolean) => (datasets ?? []).filter(item => item.sensitive === isSensitive).map(item => (
    <label className="dataset-option" key={item.id} htmlFor={`garmin-export-${item.id}`}>
      <input id={`garmin-export-${item.id}`} aria-label={item.name} type="checkbox" checked={selectedIds.includes(item.id)} onChange={() => toggleDataset(item.id)} />
      <span><strong>{item.name}</strong><small>{item.description}</small><em>{item.granularity}</em></span>
    </label>
  ));

  return <section className="settings-panel panel garmin-data-export">
    <div className="settings-panel__heading"><span className="settings-icon"><Icon name="download" /></span><div><h2>Preparar datos Garmin en JSON</h2><p>Elige un día o un periodo y qué conjuntos incluir.</p></div></div>
    <p className="field-help">Para un solo día, selecciona la misma fecha en ambos campos. Se incluyen actividades resumidas, no coordenadas GPS ni archivos FIT/GPX originales. Las claves de Garmin nunca se exportan.</p>
    <p className="garmin-data-export__privacy">Este archivo contiene datos personales de salud. No se envía automáticamente a ChatGPT: revísalo antes de copiarlo o descargarlo.</p>
    <form className="form-stack" onSubmit={event => void prepare(event)}>
      <div className="form-columns">
        <label className="field">Desde<input aria-label="Desde" type="date" min="2000-01-01" max={endDate} required value={startDate} onChange={event => { invalidateJson(); setStartDate(event.target.value); }} /></label>
        <label className="field">Hasta<input aria-label="Hasta" type="date" min={startDate || '2000-01-01'} max={dashboard.today} required value={endDate} onChange={event => { invalidateJson(); setEndDate(event.target.value); }} /></label>
      </div>
      <label className="inline-check"><input type="checkbox" checked={allDatasets} onChange={event => selectAll(event.target.checked)} />Incluir todos los conjuntos Garmin disponibles</label>
      {!allDatasets && datasets && <>
        <fieldset className="garmin-data-export__fieldset"><legend>Conjuntos a incluir</legend><div className="dataset-options">{options(false)}</div></fieldset>
        <details className="sensitive-datasets"><summary>Conjuntos especialmente sensibles · opcionales</summary><p className="field-help">Incluye solo los que quieras analizar, como peso, alimentación o salud menstrual.</p><div className="dataset-options">{options(true)}</div></details>
      </>}
      {allDatasets && <p className="field-help">Se incluirán también los conjuntos marcados como sensibles: {sensitive.length ? sensitive.map(item => item.name).join(', ') : 'ninguno'}.</p>}
      {needsSensitiveConfirmation && <label className="inline-check garmin-data-export__confirm"><input type="checkbox" checked={sensitiveConfirmed} onChange={event => { invalidateJson(); setSensitiveConfirmed(event.target.checked); }} />Confirmo que quiero incluir los conjuntos sensibles seleccionados</label>}
      {datasetsError && <p className="form-error" role="alert">No se pudo cargar la lista de conjuntos Garmin.</p>}
      {!datasets && !datasetsError && <p role="status">Cargando conjuntos Garmin…</p>}
      {error && <p className="form-error" role="alert">{error}</p>}
      {message && <p role="status" aria-live="polite">{message}</p>}
      <div className="settings-panel__actions"><Button type="submit" variant="secondary" icon="download" loading={preparing} disabled={!canPrepare}>Preparar JSON</Button></div>
    </form>
    {json && <div className="garmin-data-export__result">
      <label className="field" htmlFor="garmin-export-json">JSON preparado<textarea id="garmin-export-json" ref={textarea} className="garmin-data-export__json" value={json} readOnly rows={12} spellCheck={false} onFocus={event => event.currentTarget.select()} /></label>
      <div className="settings-panel__actions"><Button variant="ghost" onClick={() => { setJson(''); setMessage('JSON borrado de esta pantalla.'); }}>Borrar</Button><Button variant="secondary" icon="copy" onClick={() => void copyJson()}>Copiar JSON</Button><Button icon="download" onClick={downloadJson}>Descargar JSON</Button></div>
    </div>}
  </section>;
}
