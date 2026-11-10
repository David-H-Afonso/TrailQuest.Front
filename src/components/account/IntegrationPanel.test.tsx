import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { expect, it, vi } from 'vitest';
import { IntegrationPanel } from './IntegrationPanel';
import { createAppStore } from '../../store';
import { privateRequests } from '../../services/privateRequests';

vi.mock('../../services/adventureApi', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../services/adventureApi')>();
  return { ...actual, useGetGrantsQuery: () => ({ currentData: [] }), useRevokeGrantMutation: () => [vi.fn(), {}] };
});
vi.mock('../../services/privateRequests', () => ({ privateRequests: { createGrant: vi.fn() } }));

it('shows a one-time application credential outside Redux and removes it when dismissed', async () => {
  vi.mocked(privateRequests.createGrant).mockResolvedValue({ token: 'synthetic-one-time-credential', grant: { id:'fixture',application:'Fixture',scopes:['steps:read'],expiresAtUtc:'2026-12-01T00:00:00Z' } });
  const store = createAppStore();
  render(<Provider store={store}><IntegrationPanel accountId="fixture-user" /></Provider>);
  await userEvent.type(screen.getByLabelText('Aplicación autorizada'),'Fixture');
  await userEvent.click(screen.getByLabelText('Pasos y distancia diaria'));
  await userEvent.click(screen.getByRole('button',{name:'Crear permiso revocable'}));
  await waitFor(() => expect(screen.getByLabelText('Token para el backend autorizado')).toHaveValue('synthetic-one-time-credential'));
  expect(screen.getByLabelText('Token para el backend autorizado')).toHaveAttribute('type','password');
  expect(JSON.stringify(store.getState())).not.toContain('synthetic-one-time-credential');
  await userEvent.click(screen.getByRole('button',{name:'Ya lo he guardado'}));
  expect(screen.queryByLabelText('Token para el backend autorizado')).not.toBeInTheDocument();
});
