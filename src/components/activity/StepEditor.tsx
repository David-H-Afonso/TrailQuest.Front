import { useState, type FormEvent } from 'react';
import type { DailySteps, ProfileId } from '../../models/adventure';
import { useSaveDayMutation } from '../../services/adventureApi';
import { getErrorMessage } from '../../utils/errors';
import { sourceLabel } from '../../utils/format';
import { Button } from '../elements/Button';
import { Icon } from '../elements/Icon';
import { Modal } from '../elements/Modal';

export function StepEditor({ profile, today, history, initialDate, onClose, onSaved }: {
  profile: ProfileId; today: string; history: DailySteps[]; initialDate?: string; onClose: () => void; onSaved: () => void;
}) {
  const [date, setDate] = useState(initialDate ?? today);
  const [steps, setSteps] = useState(String(history.find((day) => day.date === (initialDate ?? today))?.steps ?? ''));
  const [error, setError] = useState('');
  const [saveDay, { isLoading }] = useSaveDayMutation();
  const existing = history.find((day) => day.date === date);
  async function submit(event: FormEvent) {
    event.preventDefault();
    setError('');
    const total = Number(steps);
    if (steps.trim() === '' || !Number.isInteger(total) || total < 0 || total > 150000) { setError('Introduce un total de entre 0 y 150.000 pasos.'); return; }
    try { await saveDay({ profile, date, steps: total }).unwrap(); onSaved(); }
    catch (failure) { setError(getErrorMessage(failure)); }
  }
  return <Modal title="Registrar pasos" eyebrow={profile === 'demo' ? 'Datos de prueba' : 'Tu actividad'} onClose={onClose}>
    <form onSubmit={submit} className="form-stack">
      <p className="muted">Introduce el <strong>total de ese día</strong>, no los pasos que quieres añadir. Si ya hay un registro, lo sustituiremos sin duplicarlo.</p>
      <label className="field">Fecha<input type="date" min="2000-01-01" max={today} value={date} required
        onChange={(event) => { const next = event.target.value; setDate(next); setSteps(String(history.find((day) => day.date === next)?.steps ?? '')); }} /></label>
      <label className="field">Pasos del día<input type="number" min="0" max="150000" step="1" inputMode="numeric" placeholder="Por ejemplo, 6500"
        value={steps} onChange={(event) => setSteps(event.target.value)} required aria-describedby="steps-help" /></label>
      <p id="steps-help" className="field-help">{existing ? `Registro actual: ${new Intl.NumberFormat('es-ES').format(existing.steps)} pasos · ${sourceLabel[existing.source]}.` : 'Todavía no hay pasos registrados en esta fecha.'}</p>
      {existing?.source === 'garmin' && <div className="inline-note"><Icon name="watch" /><p>Este cambio será manual. La próxima sincronización de Garmin sustituirá el total por el que tenga tu reloj.</p></div>}
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="modal__actions"><Button variant="ghost" onClick={onClose} disabled={isLoading}>Cancelar</Button><Button type="submit" icon="check" loading={isLoading}>Guardar pasos</Button></div>
    </form>
  </Modal>;
}
