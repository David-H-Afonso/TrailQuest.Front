import type { ProfileId } from '../models/adventure';
import type { Grant } from '../models/health';

// Sensitive responses and binary bodies deliberately bypass RTK mutation arguments/state.
async function check(response: Response, fallback: string) {
  if (response.status === 401) {
    window.dispatchEvent(new Event('trailquest:session-expired'));
    throw new Error('Tu sesión ha caducado. Vuelve a iniciar sesión.');
  }
  if (!response.ok) {
    const problem = await response.json().catch(() => ({})) as { code?: string };
    throw new Error(problem.code === 'activity_time_missing'
      ? 'El archivo no contiene fecha/hora de actividad. Exporta una grabación con tiempos: no tratamos una ruta planificada como ejercicio realizado.' : fallback);
  }
}

export const privateRequests = {
  async importActivity(profile: ProfileId, body: FormData): Promise<{ id: number }> {
    const response = await fetch(`/api/v1/profiles/${profile}/activities/import`, { method: 'POST', credentials: 'same-origin', cache: 'no-store', headers: { 'X-TrailQuest-Client': 'local-web' }, body });
    await check(response, 'No se pudo importar. Comprueba el formato, la integridad y el límite de 32 MB.');
    return response.json();
  },
  async createGrant(application: string, scopes: string[], days: number): Promise<{ grant: Grant; token: string }> {
    const response = await fetch('/api/v1/integrations/grants', { method: 'POST', credentials: 'same-origin', cache: 'no-store', headers: { 'Content-Type': 'application/json', 'X-TrailQuest-Client': 'local-web' }, body: JSON.stringify({ application, scopes, days }) });
    await check(response, 'No se pudo crear el permiso. Revisa los campos y tu sesión.');
    return response.json();
  },
};
