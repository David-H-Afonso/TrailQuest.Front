import { useState, type FormEvent } from 'react';
import { accountService } from '../services/accountService';
import { getErrorMessage } from '../utils/errors';
import { Button } from '../components/elements/Button';
import { Icon } from '../components/elements/Icon';
import { TravelArt } from '../components/adventure/TravelArt';

export function SignInPage({ setupRequired, onSignedIn }: { setupRequired: boolean; onSignedIn: () => void }) {
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  async function submit(event: FormEvent) {
    event.preventDefault(); setError('');
    if (setupRequired && password !== confirmation) { setError('Las contraseñas no coinciden.'); return; }
    setPending(true);
    try {
      if (setupRequired) await accountService.setup(username, displayName, password);
      else await accountService.login(username, password);
      setPassword(''); setConfirmation(''); onSignedIn();
    } catch (failure) { setPassword(''); setConfirmation(''); setError(getErrorMessage(failure)); }
    finally { setPending(false); }
  }
  return <main className="sign-in-layout"><section className="sign-in-story"><a href="/" className="brand"><img src="/favicon.svg" alt="" width="40" height="40" /><span>trail<span>quest</span><small>CADA PASO CUENTA</small></span></a><div><span className="eyebrow">Actividad y aventuras</span><h1>Tu actividad, en tu espacio.</h1><p>Pasos, entrenamientos y recorridos guardados en tu instalación privada.</p></div><TravelArt kind="city" /><p className="quiet-note"><Icon name="shield" size={17} /> Acceso privado. Tu contraseña de TrailQuest no se envía a Garmin.</p></section>
    <section className="sign-in-form panel" aria-labelledby="access-title"><span className="eyebrow">{setupRequired ? 'Primera configuración' : 'Bienvenido de nuevo'}</span><h2 id="access-title">{setupRequired ? 'Crea tu cuenta propietaria' : 'Abre tu cuaderno'}</h2><p>{setupRequired ? 'Esta primera cuenta conservará el historial existente y podrá crear las demás cuentas de esta instalación.' : 'Inicia sesión con tu usuario de TrailQuest, no con la contraseña de Garmin.'}</p>
      <form className="form-stack" onSubmit={submit}><label className="field">Usuario<input value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" autoCapitalize="none" spellCheck={false} minLength={3} maxLength={32} pattern={'[a-zA-Z0-9._\\-]{3,32}'} required disabled={pending} /></label>
        {setupRequired && <label className="field">Tu nombre<input value={displayName} onChange={(event) => setDisplayName(event.target.value)} autoComplete="nickname" minLength={2} maxLength={60} required disabled={pending} /></label>}
        <label className="field">Contraseña<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={setupRequired ? 'new-password' : 'current-password'} minLength={setupRequired ? 12 : undefined} maxLength={128} required disabled={pending} /></label>
        {setupRequired && <><label className="field">Repetir contraseña<input type="password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} autoComplete="new-password" minLength={12} maxLength={128} required disabled={pending} /></label><p className="field-help">Usa una frase de al menos 12 caracteres. Guárdala en tu gestor de contraseñas; todavía no hay recuperación por correo.</p></>}
        {error && <p className="form-error" role="alert">{error}</p>}
        <Button type="submit" icon={setupRequired ? 'shield' : 'navigation'} loading={pending}>{setupRequired ? 'Crear cuenta y conservar mi historial' : 'Iniciar sesión'}</Button>
      </form>
      <p className="sign-in-help">{setupRequired ? 'Configura esta instalación tú antes de compartir el acceso. La clave personal de Garmin se añade después, dentro de Ajustes.' : '¿Necesitas una cuenta? La persona propietaria de esta instalación puede crearla desde Ajustes.'}</p>
    </section>
  </main>;
}
