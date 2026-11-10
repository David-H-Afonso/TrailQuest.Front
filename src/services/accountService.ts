import type { AppUser, GarminConnection, Session } from '../models/account';

// Sensitive form submissions intentionally bypass Redux/RTK Query and its action/devtools history.
async function submit<T>(path: string, method: string, body?: unknown): Promise<T> {
  const response = await fetch(`/api/v1${path}`, {
    method, credentials: 'same-origin', cache: 'no-store',
    headers: { 'X-TrailQuest-Client': 'local-web', 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(90_000),
  });
  if (!response.ok) {
    let code = 'request_failed';
    try { const problem = await response.json() as { code?: string }; code = problem.code ?? code; }
    catch { /* Never display untrusted upstream or HTML error bodies. */ }
    if (response.status === 401 && code === 'authentication_required') window.dispatchEvent(new Event('trailquest:session-expired'));
    throw { data: { code, status: response.status } };
  }
  return response.status === 204 ? undefined as T : response.json() as Promise<T>;
}

export const accountService = {
  login: (username: string, password: string) => submit<Session>('/auth/login', 'POST', { username, password }),
  setup: (username: string, displayName: string, password: string) => submit<Session>('/auth/setup', 'POST', { username, displayName, password }),
  logout: () => submit<void>('/auth/logout', 'POST', {}),
  changePassword: (currentPassword: string, newPassword: string) => submit<void>('/auth/password', 'POST', { currentPassword, newPassword }),
  createUser: (username: string, displayName: string, password: string) => submit<AppUser>('/auth/users', 'POST', { username, displayName, password }),
  saveGarmin: (apiKey: string) => submit<GarminConnection>('/connections/garmin', 'PUT', { apiKey }),
  disconnectGarmin: () => submit<void>('/connections/garmin', 'DELETE'),
};
