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

it('falls back to manual copy when HTTP has no Clipboard API', async () => {
  const descriptor = Object.getOwnPropertyDescriptor(navigator, 'clipboard');
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined });
  try {
    vi.mocked(privateRequests.createGrant).mockResolvedValue({ token: 'synthetic-http-credential', grant: { id:'fixture',application:'Fixture',scopes:['steps:read'],expiresAtUtc:'2026-12-01T00:00:00Z' } });
    render(<Provider store={createAppStore()}><IntegrationPanel accountId="fixture-user" /></Provider>);
    await userEvent.type(screen.getByLabelText('Aplicación autorizada'),'Fixture');
    await userEvent.click(screen.getByLabelText('Pasos y distancia diaria'));
    await userEvent.click(screen.getByRole('button',{name:'Crear permiso revocable'}));
    await userEvent.click(await screen.findByRole('button',{name:'Copiar'}));
    expect(await screen.findByText('El navegador no permitió copiar. Selecciona el campo y cópialo manualmente.')).toBeVisible();
  } finally {
    if (descriptor) Object.defineProperty(navigator, 'clipboard', descriptor);
    else Reflect.deleteProperty(navigator, 'clipboard');
  }
});
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
