export type Unit = 'celsius' | 'fahrenheit';

export function convertTemperature(celsius: number, unit: Unit): number {
  return unit === 'fahrenheit' ? (celsius * 9) / 5 + 32 : celsius;
}

export function formatTemperature(celsius: number | null | undefined, unit: Unit): string {
  if (typeof celsius !== 'number' || !Number.isFinite(celsius)) return '—';
  return `${Math.round(convertTemperature(celsius, unit))}°`;
}

export function unitLabel(unit: Unit): string {
  return unit === 'fahrenheit' ? '°F' : '°C';
}
