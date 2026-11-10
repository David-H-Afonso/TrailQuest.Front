import { useEffect, useState } from 'react';
import { Link, Route, Routes, useLocation } from 'react-router-dom';
import type { Checkpoint, ProfileId } from './models/adventure';
import type { AppUser } from './models/account';
import { adventureApi, useAdvanceDemoMutation, useGetDashboardQuery, useGetDemoStatusQuery, useGetRoutesQuery, useGetSessionQuery, useResetDemoMutation } from './services/adventureApi';
import { accountService } from './services/accountService';
import { useAppDispatch, useAppSelector } from './store';
import { readSavedProfile, selectAccountProfile } from './store/profileSlice';
import { getErrorMessage } from './utils/errors';
import { AppShell } from './layouts/AppShell';
import { AdventurePage } from './pages/AdventurePage';
import { ExplorePage } from './pages/ExplorePage';
import { JournalPage } from './pages/JournalPage';
import { PassportPage } from './pages/PassportPage';
import { SettingsPage } from './pages/SettingsPage';
import { SignInPage } from './pages/SignInPage';
import { HealthPage } from './pages/HealthPage';
import { ActivitiesPage } from './pages/ActivitiesPage';
import { ChallengesPage } from './pages/ChallengesPage';
import { FriendsPage } from './pages/FriendsPage';
import { CheckpointDialog } from './components/adventure/CheckpointDialog';
import { StepEditor } from './components/activity/StepEditor';
import { Button } from './components/elements/Button';
import { Modal } from './components/elements/Modal';
import { Toast, type ToastMessage } from './components/elements/Toast';

export default function App() {
  const dispatch = useAppDispatch();
  const { currentData: session, error, refetch } = useGetSessionQuery(undefined, { refetchOnFocus: true });
  const { currentData: demoStatus, error: demoError, refetch: refetchDemoStatus } = useGetDemoStatusQuery();
  useEffect(() => {
    const expire = () => dispatch(adventureApi.util.resetApiState());
    window.addEventListener('trailquest:session-expired', expire);
    return () => window.removeEventListener('trailquest:session-expired', expire);
  }, [dispatch]);
  useEffect(() => {
    if (!session?.expiresAtUtc) return;
    const timer = window.setTimeout(() => dispatch(adventureApi.util.resetApiState()), Math.max(0, new Date(session.expiresAtUtc).getTime() - Date.now()));
    return () => window.clearTimeout(timer);
  }, [dispatch, session?.expiresAtUtc]);
  if (error || (session?.user && demoError)) return <main className="fatal-error"><h1>No se ha podido abrir la sesión</h1><p>Comprueba que el servicio de TrailQuest esté disponible e inténtalo de nuevo.</p><Button icon="refresh" onClick={() => { void refetch(); void refetchDemoStatus(); }}>Reintentar</Button></main>;
  if (!session || (session.user && !demoStatus)) return <main className="loading-state" role="status"><img src="/favicon.svg" alt="" width="48" height="48" /><h1>Abriendo tu cuaderno…</h1></main>;
  const reset = () => dispatch(adventureApi.util.resetApiState());
  return session.user ? <AuthenticatedApp key={session.user.id} user={session.user} demoAvailable={demoStatus?.available === true} onSessionClosed={reset} /> : <SignInPage key={session.setupRequired ? 'setup' : 'login'} setupRequired={session.setupRequired} onSignedIn={reset} />;
}

function AuthenticatedApp({ user, demoAvailable, onSessionClosed }: { user: AppUser; demoAvailable: boolean; onSessionClosed: () => void }) {
  const dispatch = useAppDispatch();
  const selection = useAppSelector((state) => state.profile);
  const preferred = selection.accountId === user.id ? selection.active : readSavedProfile(user.id, 'personal');
  const profile = demoAvailable ? preferred : 'personal';
  const { currentData: dashboard, error, isFetching, refetch } = useGetDashboardQuery({ profile, accountId: user.id });
  const { data: routes, error: routeError, refetch: refetchRoutes } = useGetRoutesQuery();
  const [advanceDemo, { isLoading: simulating }] = useAdvanceDemoMutation();
  const [resetDemo, { isLoading: resetting }] = useResetDemoMutation();
  const [stepEditor, setStepEditor] = useState<{ date?: string } | null>(null);
  const [checkpoint, setCheckpoint] = useState<Checkpoint | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const location = useLocation();
  const route = dashboard?.currentJourney?.definition ?? routes?.find((item) => item.id === dashboard?.currentJourney?.routeId);

  useEffect(() => {
    const titles: Record<string, string> = { '/': 'Mi aventura', '/explore': 'Explorar', '/journal': 'Diario', '/passport': 'Pasaportes', '/health': 'Salud', '/activities': 'Actividad', '/challenges': 'Retos', '/friends': 'Amistades', '/settings': 'Ajustes' };
    document.title = `${titles[location.pathname] ?? 'Tu camino'} · TrailQuest`;
  }, [location.pathname]);

  function changeProfile(next: ProfileId) {
    if (profile === next) return;
    setStepEditor(null); setCheckpoint(null); setConfirmReset(false); setToast(null);
    dispatch(selectAccountProfile({ accountId: user.id, profile: next }));
  }

  async function logout() {
    setLoggingOut(true);
    try { await accountService.logout(); onSessionClosed(); }
    catch (failure) { setToast({ text: getErrorMessage(failure), error: true }); }
    finally { setLoggingOut(false); }
  }

  async function simulate() {
    try { await advanceDemo().unwrap(); setToast({ text: '1.000 pasos de prueba añadidos. Tu viaje sigue.' }); }
    catch (failure) { setToast({ text: getErrorMessage(failure), error: true }); }
  }

  async function restoreDemo() {
    try { await resetDemo().unwrap(); setConfirmReset(false); setToast({ text: 'Prueba reiniciada. Tus datos personales siguen intactos.' }); }
    catch (failure) { setToast({ text: getErrorMessage(failure), error: true }); }
  }

  function register(date?: string) { setStepEditor({ date }); }

  return <AppShell user={user} onLogout={() => void logout()} loggingOut={loggingOut} dashboard={dashboard} profile={profile} demoAvailable={demoAvailable} onProfileChange={changeProfile}
    onRefresh={() => { void refetch(); void refetchRoutes(); dispatch(adventureApi.util.invalidateTags(['Health', 'Sync', 'Community', 'Grants'])); }} refreshing={isFetching}>
    {error || routeError ? <section className="connection-error panel" role="alert"><h1>No se pudieron cargar los datos</h1><p>Comprueba que el servicio esté disponible e inténtalo de nuevo.</p><Button icon="refresh" onClick={() => { void refetch(); void refetchRoutes(); }}>Reintentar</Button></section>
      : !dashboard || !routes ? <div className="loading-state" role="status"><img src="/favicon.svg" alt="" width="48" height="48" /><h1>Abriendo tu cuaderno…</h1><span className="loading-state__line" /></div>
        : <Routes>
          <Route path="/" element={<AdventurePage dashboard={dashboard} route={route} onRegister={() => register()} onCheckpoint={setCheckpoint} onSimulate={() => void simulate()} simulating={simulating} />} />
          <Route path="/explore" element={<ExplorePage key={profile} dashboard={dashboard} routes={routes} onFeedback={setToast} />} />
          <Route path="/journal" element={<JournalPage dashboard={dashboard} onRegister={register} />} />
          <Route path="/passport" element={<PassportPage key={profile} dashboard={dashboard} route={route} routes={routes} onFeedback={setToast} />} />
          <Route path="/health" element={<HealthPage key={profile} dashboard={dashboard} accountId={user.id} />} />
          <Route path="/activities" element={<ActivitiesPage key={profile} dashboard={dashboard} accountId={user.id} onFeedback={setToast} />} />
          <Route path="/challenges" element={<ChallengesPage key={profile} dashboard={dashboard} accountId={user.id} />} />
          <Route path="/friends" element={<FriendsPage key={profile} dashboard={dashboard} accountId={user.id} />} />
          <Route path="/settings" element={<SettingsPage key={profile} user={user} dashboard={dashboard} onFeedback={setToast} onUsePersonal={() => changeProfile('personal')} onResetDemo={() => setConfirmReset(true)} onSessionClosed={onSessionClosed} />} />
          <Route path="*" element={<section className="empty-state"><h1>Este sendero no está en el mapa</h1><p>Puedes volver a tu aventura sin perder el progreso.</p><Link className="button button--primary" to="/">Volver a mi aventura</Link></section>} />
        </Routes>}
    {stepEditor && dashboard && <StepEditor key={`${profile}-${stepEditor.date ?? dashboard.today}`} profile={profile} today={dashboard.today} history={dashboard.history} initialDate={stepEditor.date} onClose={() => setStepEditor(null)} onSaved={() => { setStepEditor(null); setToast({ text: 'Pasos guardados. Tu recorrido está actualizado.' }); }} />}
    {checkpoint && dashboard?.currentJourney && route && <CheckpointDialog stop={checkpoint} route={route} journey={dashboard.currentJourney} profile={profile} onClose={() => setCheckpoint(null)} onFeedback={setToast} />}
    {confirmReset && <Modal title="¿Volvemos al primer paseo?" eyebrow="Solo datos de prueba" onClose={() => setConfirmReset(false)}><p>Restauraremos los ajustes, la aventura inicial y los ejemplos opcionales que sigan instalados. Tus pasos personales, tus logros reales y tu conexión de Garmin no se tocan.</p><div className="modal__actions"><Button variant="ghost" onClick={() => setConfirmReset(false)} disabled={resetting}>Seguir como estoy</Button><Button icon="reset" variant="danger" loading={resetting} onClick={() => void restoreDemo()}>Reiniciar prueba</Button></div></Modal>}
    {toast && <Toast message={toast} onClose={() => setToast(null)} />}
  </AppShell>;
}
