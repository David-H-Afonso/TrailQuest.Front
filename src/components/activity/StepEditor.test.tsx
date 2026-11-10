import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { StepEditor } from './StepEditor';
import { demoDashboard } from '../../test/fixtures';

const { saveDay } = vi.hoisted(() => ({ saveDay: vi.fn() }));
vi.mock('../../services/adventureApi', () => ({ useSaveDayMutation: () => [saveDay, { isLoading: false }] }));
beforeEach(() => { saveDay.mockReturnValue({ unwrap: () => Promise.resolve() }); });

describe('editing a daily total', () => {
  it('prefills the existing total and sends its replacement, not a delta', async () => {
    const user = userEvent.setup();
    const onSaved = vi.fn();
    render(<StepEditor profile="demo" today={demoDashboard.today} history={demoDashboard.history} onClose={vi.fn()} onSaved={onSaved} />);
    expect(screen.getByRole('dialog')).toBeVisible();
    const input = screen.getByRole('spinbutton', { name: 'Pasos del día' });
    expect(input).toHaveValue(3800);
    await user.clear(input);
    await user.type(input, '4200');
    await user.click(screen.getByRole('button', { name: 'Guardar pasos' }));
    await waitFor(() => expect(onSaved).toHaveBeenCalledOnce());
    expect(saveDay).toHaveBeenCalledWith({ profile: 'demo', date: '2026-11-09', steps: 4200 });
  });
  it('shows a useful error and keeps the editor open after a failed save', async () => {
    saveDay.mockReturnValue({ unwrap: () => Promise.reject({ data: { code: 'invalid_steps' } }) });
    const onSaved = vi.fn();
    render(<StepEditor profile="personal" today={demoDashboard.today} history={demoDashboard.history} onClose={vi.fn()} onSaved={onSaved} />);
    await userEvent.click(screen.getByRole('button', { name: 'Guardar pasos' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('150.000 pasos');
    expect(onSaved).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog')).toBeVisible();
  });
  it('offers an explicit close action', async () => {
    const onClose = vi.fn();
    render(<StepEditor profile="demo" today={demoDashboard.today} history={[]} onClose={onClose} onSaved={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: 'Cerrar ventana' }));
    expect(onClose).toHaveBeenCalledOnce();
  });
});
