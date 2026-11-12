import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { createAppStore } from '../../store';
import { demoDashboard } from '../../test/fixtures';
import { GarminDataExportPanel } from './GarminDataExportPanel';

const state = vi.hoisted(() => ({ datasets: [] as { id: string; name: string; description: string; sensitive: boolean; granularity: string }[] }));
let originalClipboard: PropertyDescriptor | undefined;
let originalCreateObjectUrl: PropertyDescriptor | undefined;
let originalRevokeObjectUrl: PropertyDescriptor | undefined;

vi.mock('../../services/adventureApi', async importOriginal => {
  const actual = await importOriginal<typeof import('../../services/adventureApi')>();
  return { ...actual, useGetDatasetsQuery: () => ({ currentData: state.datasets, error: undefined }) };
});

const exportFixture = (startDate: string, endDate: string, datasets: string[]) => ({
  schemaVersion: 1,
  exportedAtUtc: '2026-11-09T12:00:00Z',
  profileId: 'personal',
  startDate,
  endDate,
  datasets,
  sensitiveDatasets: [],
  privacy: { includesCredentials: false, includesOriginalActivityFiles: false, includesGpsTracks: false },
  days: [{ date: endDate, steps: [], activities: [], healthRecords: [{ dataset: 'sleep', data: { sleepTimeSeconds: 28800 } }] }],
});

const mockResponse = (body: ReturnType<typeof exportFixture>) => new Response(JSON.stringify(body), {
  status: 200, headers: { 'X-TrailQuest-Export-Range': `${body.startDate}/${body.endDate}`, 'Content-Type': 'application/json' },
});

function renderPanel() {
  return render(<Provider store={createAppStore()}><GarminDataExportPanel dashboard={{ ...demoDashboard, profileId: 'personal', today: '2026-11-09' }} /></Provider>);
}

beforeEach(() => {
  originalClipboard = Object.getOwnPropertyDescriptor(navigator, 'clipboard');
  originalCreateObjectUrl = Object.getOwnPropertyDescriptor(URL, 'createObjectURL');
  originalRevokeObjectUrl = Object.getOwnPropertyDescriptor(URL, 'revokeObjectURL');
  state.datasets = [
    { id: 'sleep', name: 'Sueño', description: 'Fases y puntuaciones.', sensitive: false, granularity: 'Diaria' },
    { id: 'body-battery', name: 'Body Battery', description: 'Energía estimada.', sensitive: false, granularity: 'Muestras temporales' },
    { id: 'weight', name: 'Peso y composición', description: 'Peso registrado.', sensitive: true, granularity: 'Por registro' },
  ];
  vi.stubGlobal('fetch', vi.fn());
});

afterEach(() => {
  vi.unstubAllGlobals();
  for (const [target, key, descriptor] of [
    [navigator, 'clipboard', originalClipboard],
    [URL, 'createObjectURL', originalCreateObjectUrl],
    [URL, 'revokeObjectURL', originalRevokeObjectUrl],
  ] as const) {
    if (descriptor) Object.defineProperty(target, key, descriptor);
    else Reflect.deleteProperty(target, key);
  }
});

it('prepares only the selected sleep and Body Battery day, then copies the JSON', async () => {
  const user = userEvent.setup();
  const fetchMock = vi.mocked(fetch);
  const body = exportFixture('2026-11-09', '2026-11-09', ['sleep', 'body-battery']);
  fetchMock.mockResolvedValue(mockResponse(body));
  const writeText = vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
  renderPanel();

  fireEvent.change(screen.getByLabelText('Desde'), { target: { value: '2026-11-09' } });
  fireEvent.change(screen.getByLabelText('Hasta'), { target: { value: '2026-11-09' } });
  await user.click(screen.getByRole('button', { name: 'Preparar JSON' }));

  await screen.findByLabelText('JSON preparado');
  const requestUrl = new URL(String(fetchMock.mock.calls[0][0]), 'http://trailquest.local');
  expect(requestUrl.searchParams.get('startDate')).toBe('2026-11-09');
  expect(requestUrl.searchParams.get('endDate')).toBe('2026-11-09');
  expect(requestUrl.searchParams.getAll('datasets')).toEqual(['sleep', 'body-battery']);
  await user.click(screen.getByRole('button', { name: 'Copiar JSON' }));
  await waitFor(() => expect(writeText).toHaveBeenCalledWith(JSON.stringify(body, null, 2)));
  expect(screen.getByRole('status')).toHaveTextContent('JSON copiado');
});

it('requires explicit acknowledgement before exporting all, including sensitive datasets', async () => {
  const user = userEvent.setup();
  const fetchMock = vi.mocked(fetch);
  const body = exportFixture('2026-11-03', '2026-11-09', ['sleep', 'body-battery', 'weight']);
  fetchMock.mockResolvedValue(mockResponse(body));
  renderPanel();

  await user.click(screen.getByRole('checkbox', { name: /Incluir todos los conjuntos Garmin/ }));
  expect(screen.getByText(/Peso y composición/)).toBeVisible();
  const prepare = screen.getByRole('button', { name: 'Preparar JSON' });
  expect(prepare).toBeDisabled();
  await user.click(screen.getByRole('checkbox', { name: /Confirmo que quiero incluir/ }));
  expect(prepare).toBeEnabled();
  await user.click(prepare);
  await screen.findByLabelText('JSON preparado');
  const requestUrl = new URL(String(fetchMock.mock.calls[0][0]), 'http://trailquest.local');
  expect(requestUrl.searchParams.getAll('datasets')).toEqual(['all']);
});

it('falls back to selecting JSON for manual copy on HTTP and clears it when the period changes', async () => {
  const user = userEvent.setup();
  const fetchMock = vi.mocked(fetch);
  fetchMock.mockResolvedValue(mockResponse(exportFixture('2026-11-03', '2026-11-09', ['sleep', 'body-battery'])));
  const descriptor = Object.getOwnPropertyDescriptor(navigator, 'clipboard');
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined });
  try {
    renderPanel();
    await user.click(screen.getByRole('button', { name: 'Preparar JSON' }));
    const text = await screen.findByLabelText('JSON preparado');
    await user.click(screen.getByRole('button', { name: 'Copiar JSON' }));
    expect(text).toHaveFocus();
    const textarea = text as HTMLTextAreaElement;
    expect(textarea.selectionStart).toBe(0);
    expect(textarea.selectionEnd).toBe(textarea.value.length);
    expect(screen.getByRole('status')).toHaveTextContent('pulsa Ctrl+C');
    fireEvent.change(screen.getByLabelText('Desde'), { target: { value: '2026-11-04' } });
    expect(screen.queryByLabelText('JSON preparado')).not.toBeInTheDocument();
  } finally {
    if (descriptor) Object.defineProperty(navigator, 'clipboard', descriptor);
    else Reflect.deleteProperty(navigator, 'clipboard');
  }
});

it('downloads a JSON file without sending it to a third party', async () => {
  const user = userEvent.setup();
  const fetchMock = vi.mocked(fetch);
  fetchMock.mockResolvedValue(mockResponse(exportFixture('2026-11-03', '2026-11-09', ['sleep', 'body-battery'])));
  Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: vi.fn(() => 'blob:synthetic-garmin-export') });
  Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: vi.fn() });
  const downloads: string[] = [];
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) { downloads.push(this.download); });
  renderPanel();

  await user.click(screen.getByRole('button', { name: 'Preparar JSON' }));
  await screen.findByLabelText('JSON preparado');
  await user.click(screen.getByRole('button', { name: 'Descargar JSON' }));
  expect(downloads).toEqual(['trailquest-garmin-2026-11-03-2026-11-09.json']);
  expect(URL.createObjectURL).toHaveBeenCalledOnce();
  expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:synthetic-garmin-export');
});
