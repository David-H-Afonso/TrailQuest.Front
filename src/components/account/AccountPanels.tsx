import { useState, type FormEvent } from 'react';
import type { AppUser } from '../../models/account';
import { useAppDispatch } from '../../store';
import { adventureApi, useGetUsersQuery } from '../../services/adventureApi';
import { accountService } from '../../services/accountService';
import { getErrorMessage } from '../../utils/errors';
import { Button } from '../elements/Button';
import { Icon } from '../elements/Icon';
import { Modal } from '../elements/Modal';
import type { ToastMessage } from '../elements/Toast';

export function AccountPanel({ user, onSessionClosed }: { user: AppUser; onSessionClosed: () => void }) {
  const [current, setCurrent] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  async function submit(event: FormEvent) {
    event.preventDefault(); setError('');
    if (password !== confirmation) { setError('Las contraseñas no coinciden.'); return; }
    setPending(true);
    try { await accountService.changePassword(current, password); setCurrent(''); setPassword(''); setConfirmation(''); onSessionClosed(); }
    catch (failure) { setError(getErrorMessage(failure)); }
    finally { setCurrent(''); setPassword(''); setConfirmation(''); setPending(false); }
  }
  return <section className="settings-panel panel"><div className="settings-panel__heading"><span className="settings-icon"><Icon name="shield" /></span><div><h2>Tu cuenta</h2><p>{user.displayName} · @{user.username}</p></div><span className="badge">{user.isOwner ? 'Propietaria' : 'Usuario'}</span></div>
    <p>Tu historial y tu conexión de Garmin están separados de los de las otras cuentas. La contraseña de TrailQuest no es la de Garmin.</p>
    <details className="account-password"><summary>Cambiar mi contraseña</summary><form className="form-stack" onSubmit={submit}>
      <label className="field">Contraseña actual<input type="password" autoComplete="current-password" value={current} onChange={(event) => setCurrent(event.target.value)} maxLength={128} required /></label>
      <label className="field">Nueva contraseña<input type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={12} maxLength={128} required /></label>
      <label className="field">Repetir nueva contraseña<input type="password" autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} minLength={12} maxLength={128} required /></label>
      <p className="field-help">Cerrará todas las sesiones de tu cuenta. Después tendrás que iniciar sesión de nuevo.</p>{error && <p className="form-error" role="alert">{error}</p>}<Button type="submit" icon="check" loading={pending}>Cambiar contraseña y cerrar sesiones</Button>
    </form></details>
  </section>;
}

export function UsersPanel({ user, onFeedback }: { user: AppUser; onFeedback: (message: ToastMessage) => void }) {
  const { currentData: users, isError } = useGetUsersQuery(user.id);
  const dispatch = useAppDispatch();
  const [creating, setCreating] = useState(false);
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault(); setError(''); setPending(true);
    try {
      await accountService.createUser(username, name, password);
      setCreating(false); setUsername(''); setName('');
      dispatch(adventureApi.util.invalidateTags(['Users']));
      onFeedback({ text: 'Cuenta creada. Su historial personal empieza vacío y su Garmin se conecta desde su propia sesión.' });
    } catch (failure) { setError(getErrorMessage(failure)); }
    finally { setPassword(''); setPending(false); }
  }
  return <section className="settings-panel panel"><div className="settings-panel__heading"><span className="settings-icon"><Icon name="book" /></span><div><h2>Cuentas de esta instalación</h2><p>Solo tú puedes crear otras cuentas; sus datos siguen siendo privados.</p></div></div>
    {isError ? <p role="alert" className="form-error">No se ha podido cargar la lista de cuentas.</p> : <ul className="account-user-list">{users?.map((item) => <li key={item.id}><span className="account-avatar">{item.displayName.slice(0, 1).toUpperCase()}</span><div><strong>{item.displayName}</strong><span>@{item.username}</span></div><span className="badge">{item.isOwner ? 'Propietaria' : 'Usuario'}</span></li>)}</ul>}
    <Button variant="secondary" icon="plus" onClick={() => setCreating(true)}>Crear otra cuenta</Button>
    <p className="field-help account-scope-note">Uso local privado. La API personal de Garmin no es una integración comercial multiusuario.</p>
    {creating && <Modal title="Un nuevo cuaderno" eyebrow="Crear cuenta local" onClose={() => { setCreating(false); setPassword(''); }}><form className="form-stack" onSubmit={submit}>
      <label className="field">Usuario de la nueva cuenta<input value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="off" autoCapitalize="none" minLength={3} maxLength={32} pattern={'[a-zA-Z0-9._\\-]{3,32}'} required /></label>
      <label className="field">Nombre<input value={name} onChange={(event) => setName(event.target.value)} autoComplete="off" minLength={2} maxLength={60} required /></label>
      <label className="field">Contraseña inicial<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" minLength={12} maxLength={128} required /></label>
      <p className="field-help">Compártela de forma privada con esa persona y pídele que la cambie al entrar en su cuenta. Su clave de Garmin la introduce ella desde Ajustes.</p>{error && <p className="form-error" role="alert">{error}</p>}
      <div className="modal__actions"><Button variant="ghost" onClick={() => { setCreating(false); setPassword(''); }} disabled={pending}>Cancelar</Button><Button type="submit" icon="plus" loading={pending}>Crear cuenta</Button></div>
    </form></Modal>}
  </section>;
}
