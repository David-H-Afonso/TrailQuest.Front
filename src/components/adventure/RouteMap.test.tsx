import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import { RouteMap } from './RouteMap';
import { demoDashboard, routes } from '../../test/fixtures';

vi.mock('./GeographicMap', () => ({ default: ({ onFailure }: { onFailure: (failure: string) => void }) => <button onClick={() => onFailure('blocked')}>Simular bloqueo del proveedor</button> }));

it('keeps an explicitly labeled local itinerary available after a provider block', async () => {
  render(<RouteMap route={routes[0]} journey={demoDashboard.currentJourney} onCheckpoint={vi.fn()} />);
  await userEvent.click(await screen.findByRole('button', { name: 'Simular bloqueo del proveedor' }));
  expect(await screen.findByRole('img', { name: /Esquema de Tokio/ })).toBeVisible();
  expect(screen.getByRole('status')).toHaveTextContent('El proveedor ha bloqueado el callejero');
  expect(screen.getByRole('button', { name: 'Reintentar callejero' })).toBeVisible();
  expect(screen.queryByRole('button', { name: 'Simular bloqueo del proveedor' })).not.toBeInTheDocument();
});
