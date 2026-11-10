import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { beforeEach, expect, it, vi } from 'vitest';
import { createAppStore } from '../../store';
import { GarminConnectionPanel } from './GarminConnectionPanel';
import { accountService } from '../../services/accountService';
import { demoDashboard } from '../../test/fixtures';
const state = vi.hoisted(() => ({ configured: false }));

vi.mock('../../services/adventureApi', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../services/adventureApi')>();
  return { ...actual, useGetConnectionQuery: () => ({ currentData: { configured: state.configured, verifiedAtUtc: null } }), useSyncAllGarminMutation: () => [vi.fn(), { isLoading: false }] };
});
vi.mock('../../services/accountService', () => ({ accountService: { saveGarmin: vi.fn() } }));
beforeEach(() => { state.configured=false; vi.mocked(accountService.saveGarmin).mockReset().mockResolvedValue({ configured: true, verifiedAtUtc: null }); });

it('submits a masked key privately, clears the form and keeps it out of Redux state', async () => {
  const store = createAppStore();
  const feedback = vi.fn();
  const user = userEvent.setup();
  render(<Provider store={store}><GarminConnectionPanel user={{ id: 'fixture-user', username: 'fixture-user', displayName: 'Fixture', isOwner: false }} dashboard={{ ...demoDashboard, profileId: 'personal' }} onFeedback={feedback} onUsePersonal={vi.fn()} /></Provider>);
  const input = screen.getByLabelText('Clave personal de Garmin');
  expect(input).toHaveAttribute('type', 'password');
  await user.type(input, 'fixture-private-garmin-key');
  await user.click(screen.getByRole('button', { name: 'Comprobar y guardar clave' }));
  await waitFor(() => expect(feedback).toHaveBeenCalled());
  expect(input).toHaveValue('');
  expect(accountService.saveGarmin).toHaveBeenCalledWith('fixture-private-garmin-key');
  expect(JSON.stringify(store.getState())).not.toContain('fixture-private-garmin-key');
});

it('keeps obtaining a Garmin key visible and explains the steps without reading a secret', async () => {
  render(<Provider store={createAppStore()}><GarminConnectionPanel user={{id:'fixture',username:'fixture',displayName:'Fixture',isOwner:false}} dashboard={demoDashboard} onFeedback={vi.fn()} onUsePersonal={vi.fn()}/></Provider>);
  expect(screen.getByRole('link',{name:/Obtener clave en Garmin Connect/})).toHaveAttribute('href','https://connect.garmin.com/app/settings/personalApiToken');
  expect(screen.getByRole('link',{name:/Obtener clave en Garmin Connect/})).toBeVisible();
  await userEvent.click(screen.getByText('Cómo obtener y guardar la clave'));
  expect(screen.getByText('Abre el enlace e inicia sesión en tu cuenta de Garmin Connect.')).toBeVisible();
  expect(accountService.saveGarmin).not.toHaveBeenCalled();
});

it('does not mount the replacement field until expanded, and clears it when collapsed', async () => {
  state.configured=true;const store=createAppStore();const user=userEvent.setup();
  render(<Provider store={store}><GarminConnectionPanel user={{id:'fixture',username:'fixture',displayName:'Fixture',isOwner:false}} dashboard={demoDashboard} onFeedback={vi.fn()} onUsePersonal={vi.fn()}/></Provider>);
  expect(screen.queryByLabelText('Clave personal de Garmin')).not.toBeInTheDocument();
  await user.click(screen.getByText('Sustituir la clave'));
  const field=await screen.findByLabelText('Clave personal de Garmin');await user.type(field,'synthetic-replacement-value');
  await user.click(screen.getByText('Sustituir la clave'));await waitFor(()=>expect(screen.queryByLabelText('Clave personal de Garmin')).not.toBeInTheDocument());
  await user.click(screen.getByText('Sustituir la clave'));expect(await screen.findByLabelText('Clave personal de Garmin')).toHaveValue('');
  expect(JSON.stringify(store.getState())).not.toContain('synthetic-replacement-value');
});

it('collapses the replacement control again after successfully saving', async () => {
  state.configured=true;const user=userEvent.setup();
  render(<Provider store={createAppStore()}><GarminConnectionPanel user={{id:'fixture',username:'fixture',displayName:'Fixture',isOwner:false}} dashboard={demoDashboard} onFeedback={vi.fn()} onUsePersonal={vi.fn()}/></Provider>);
  await user.click(screen.getByText('Sustituir la clave'));await user.type(await screen.findByLabelText('Clave personal de Garmin'),'synthetic-replacement-value');
  await user.click(screen.getByRole('button',{name:'Comprobar y guardar clave'}));
  await waitFor(()=>expect(screen.queryByLabelText('Clave personal de Garmin')).not.toBeInTheDocument());
  expect(accountService.saveGarmin).toHaveBeenCalledWith('synthetic-replacement-value');
});
