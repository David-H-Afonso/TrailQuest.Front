import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import App from './App';
import { createAppStore } from './store';
import { selectAccountProfile } from './store/profileSlice';
import { useGetDashboardQuery, useGetDemoStatusQuery, useGetRoutesQuery, useGetSessionQuery } from './services/adventureApi';
import type { Session } from './models/account';
import type { Dashboard } from './models/adventure';
import { demoDashboard, routes } from './test/fixtures';

vi.mock('./services/adventureApi', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./services/adventureApi')>();
  return { ...actual, useGetDashboardQuery: vi.fn(), useGetDemoStatusQuery: vi.fn(), useGetRoutesQuery: vi.fn(), useGetSessionQuery: vi.fn() };
});
vi.mock('./components/adventure/RouteMap', () => ({ RouteMap: () => <div data-testid="route-map">Mapa de la aventura</div> }));

function renderApp(session: Session = { user: { id: 'fixture-owner-id', username: 'fixture-owner', displayName: 'Fixture Owner', isOwner: true }, setupRequired: false }, demoStatus: boolean | 'loading' = true, dashboard: Dashboard = demoDashboard) {
  vi.mocked(useGetSessionQuery).mockReturnValue({ currentData: session, refetch: vi.fn() } as unknown as ReturnType<typeof useGetSessionQuery>);
  vi.mocked(useGetDemoStatusQuery).mockReturnValue({ currentData: demoStatus === 'loading' ? undefined : { available: demoStatus }, refetch: vi.fn() } as unknown as ReturnType<typeof useGetDemoStatusQuery>);
  vi.mocked(useGetDashboardQuery).mockClear();
  vi.mocked(useGetRoutesQuery).mockReturnValue({ data: routes, refetch: vi.fn() } as unknown as ReturnType<typeof useGetRoutesQuery>);
  vi.mocked(useGetDashboardQuery).mockImplementation((args) => ({
    currentData: typeof args === 'object' && args.profile === 'demo' ? dashboard : undefined,
    data: demoDashboard,
    isFetching: typeof args !== 'object' || args.profile !== 'demo',
    refetch: vi.fn(),
  }) as unknown as ReturnType<typeof useGetDashboardQuery>);
  const store = createAppStore();
  store.dispatch(selectAccountProfile({ accountId: 'fixture-owner-id', profile: 'demo' }));
  return render(<Provider store={store}><MemoryRouter><App /></MemoryRouter></Provider>);
}

describe('the local app', () => {
  it('does not request a private profile while demo availability is still unknown', () => {
    renderApp(undefined, 'loading');
    expect(useGetDashboardQuery).not.toHaveBeenCalled();
    expect(screen.getByRole('heading', { name: 'Abriendo tu cuaderno…' })).toBeVisible();
  });
  it('works without demo fixtures or a demo selector', () => {
    renderApp(undefined, false);
    expect(screen.queryByRole('button', { name: /^Prueba$/ })).not.toBeInTheDocument();
    expect(useGetDashboardQuery).toHaveBeenCalledWith(expect.objectContaining({ profile: 'personal' }));
  });
  it('keeps the app usable after leaving the final passport instead of loading forever', () => {
    renderApp(undefined,true,{...demoDashboard,currentJourney:null,journeys:[]});
    expect(screen.getByRole('heading',{name:'No tienes un pasaporte activo'})).toBeVisible();
    expect(screen.getByRole('link',{name:/^Explorar rutas$/})).toBeVisible();
    expect(screen.getByRole('button',{name:'Registrar pasos'})).toBeEnabled();
    expect(screen.getByRole('navigation',{name:'Navegación principal'})).toBeVisible();
  });
  it('does not render private activity without a confirmed session', () => {
    renderApp({ user: null, setupRequired: false });
    expect(screen.getByRole('heading', { name: 'Abre tu cuaderno' })).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Simular +1.000 pasos' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Tokio, paso a paso' })).not.toBeInTheDocument();
  });
  it('uses a username pattern compatible with the browser Unicode-sets grammar', () => {
    renderApp({ user: null, setupRequired: false });
    const pattern = screen.getByLabelText('Usuario').getAttribute('pattern')!;
    const expression = new RegExp(`^(?:${pattern})$`, 'v');
    expect(expression.test('test-name_3.A')).toBe(true);
    expect(expression.test('bad name')).toBe(false);
    expect(expression.test('a')).toBe(false);
  });
  it('offers owner setup without silently claiming existing activity', () => {
    renderApp({ user: null, setupRequired: true });
    expect(screen.getByRole('heading', { name: 'Crea tu cuenta propietaria' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Crear cuenta y conservar mi historial' })).toBeEnabled();
    expect(screen.queryByRole('heading', { name: 'Tokio, paso a paso' })).not.toBeInTheDocument();
  });
  it('identifies fictional activity and exposes the core journey', () => {
    renderApp();
    expect(screen.getByText('Datos de prueba', { exact: true })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Tokio, paso a paso' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Simular +1.000 pasos' })).toBeEnabled();
    expect(screen.getByRole('navigation', { name: 'Navegación principal' })).toBeInTheDocument();
  });
  it('never displays cached demo activity as personal data while switching profile', async () => {
    renderApp();
    await userEvent.click(screen.getByRole('button', { name: 'Mis datos' }));
    expect(screen.getByRole('heading', { name: 'Abriendo tu cuaderno…' })).toBeVisible();
    expect(screen.queryByRole('heading', { name: 'Tokio, paso a paso' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Simular +1.000 pasos' })).not.toBeInTheDocument();
  });
});
