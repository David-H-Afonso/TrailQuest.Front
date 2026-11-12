import type { ApiProblem } from '../models/adventure';

const messages: Record<string, string> = {
  authentication_required: 'Tu sesión ha terminado. Vuelve a iniciar sesión.',
  invalid_credentials: 'El usuario o la contraseña no son correctos, o la cuenta no está disponible temporalmente.',
  invalid_account: 'Usa un usuario de 3–32 letras, números, puntos, guiones o guiones bajos, y un nombre de 2–60 caracteres.',
  invalid_password: 'Usa una contraseña o frase de entre 12 y 128 caracteres.',
  username_unavailable: 'Ese nombre de usuario ya está ocupado. Elige otro.',
  owner_required: 'Solo la cuenta propietaria puede gestionar usuarios.',
  setup_complete: 'Esta instalación ya tiene una cuenta propietaria. Inicia sesión.',
  rate_limited: 'Has hecho demasiados intentos. Espera unos minutos antes de volver a probar.',
  invalid_garmin_key: 'Introduce la clave personal de Garmin, sin espacios ni saltos de línea.',
  garmin_key_unavailable: 'No se puede abrir la credencial en este equipo. Vuelve a guardar tu clave de Garmin aquí.',
  garmin_connection_changed: 'La conexión de Garmin cambió durante la consulta. Vuelve a sincronizar.',
  invalid_steps: 'Introduce un total de entre 0 y 150.000 pasos.',
  invalid_date: 'Elige una fecha válida, desde el año 2000 hasta hoy.',
  invalid_settings: 'Revisa el objetivo (1.000–50.000 pasos) y la longitud de paso (30–150 cm).',
  invalid_timezone: 'Esa zona horaria no está disponible. Prueba con la del dispositivo.',
  garmin_not_configured: 'Conecta tu Garmin desde Ajustes. La clave se guarda únicamente para tu cuenta.',
  garmin_auth: 'Garmin no acepta la clave. Comprueba que siga activa y no haya caducado.',
  garmin_response: 'Garmin ha devuelto un formato inesperado. Tu historial no se ha modificado.',
  garmin_timeout: 'Garmin está tardando demasiado. Puedes volver a intentarlo; tus datos siguen guardados.',
  garmin_network: 'No se ha podido contactar con Garmin. Revisa la conexión y vuelve a intentarlo.',
  garmin_unavailable: 'Garmin no está disponible ahora. Tu historial no se ha modificado.',
  garmin_rate_limit: 'Garmin ha limitado temporalmente las consultas. Espera un poco antes de repetir.',
  invalid_sync_range: 'Elige un periodo de hasta 28 días, sin fechas futuras.',
  personal_profile_required: 'Cambia a Mis datos para sincronizar o exportar Garmin.',
  route_not_found: 'Esta ruta no está disponible. Elige otra en Explorar.',
  journey_not_found: 'Primero comienza esta aventura desde Explorar.',
  validation: 'Revisa los campos e inténtalo de nuevo.',
  origin_rejected: 'Abre TrailQuest desde la dirección configurada para esta instalación.',
  secure_origin_required: 'Utiliza la dirección HTTPS de esta instalación.',
  client_header_required: 'Actualiza la página para volver a conectar con el servicio.',
  archive_too_large: 'La selección es demasiado grande. Elige un periodo más corto o menos registros de origen; no se ha borrado ningún dato.',
  export_in_progress: 'Ya hay una exportación en curso para tu cuenta. Espera a que termine.',
  invalid_range: 'Elige un periodo de entre 1 y 366 días.',
  invalid_dataset_selection: 'Elige todos los conjuntos Garmin o una selección disponible.',
  content_update_incompatible: 'Esta edición cambia el recorrido. Se ha conservado tu aventura actual.',
};

export function getErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'data' in error) {
    const data = error.data as ApiProblem | undefined;
    if (data?.code && messages[data.code]) return messages[data.code];
  }
  return 'No se ha podido completar la acción. Comprueba que el servicio esté disponible y vuelve a intentarlo.';
}
