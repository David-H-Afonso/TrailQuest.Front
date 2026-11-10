import type { StepSource } from '../models/adventure';

const numbers = new Intl.NumberFormat('es-ES');
const distances = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 1 });
export const formatNumber = (value: number) => numbers.format(value);
export const formatKm = (value: number) => `${distances.format(value)} km`;
export const formatPercent = (value: number) => `${distances.format(value)} %`;

export function parseCalendarDate(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day, 12);
}

export function formatDate(value: string, options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' }) {
  return new Intl.DateTimeFormat('es-ES', options).format(parseCalendarDate(value));
}

export function shiftDate(value: string, amount: number) {
  const date = parseCalendarDate(value);
  date.setDate(date.getDate() + amount);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function formatTimestamp(value: string, timeZone: string) {
  return new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone }).format(new Date(value));
}

export function formatInstantDate(value: string, timeZone: string) {
  return new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short', timeZone }).format(new Date(value));
}

export const sourceLabel: Record<StepSource, string> = {
  demo: 'De prueba', manual: 'Manual', garmin: 'Garmin', none: 'Sin registrar',
};
