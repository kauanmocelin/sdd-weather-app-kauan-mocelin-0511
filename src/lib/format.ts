function parseCivilDate(date: string): Date {
  return new Date(`${date}T12:00:00Z`);
}

export function getDayLabel(date: string, index: number): string {
  if (index === 0) return 'Hoje';
  if (index === 1) return 'Amanhã';

  const weekday = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'short',
    timeZone: 'UTC',
  })
    .format(parseCivilDate(date))
    .replace(/\.$/, '');

  return weekday.charAt(0).toLocaleUpperCase('pt-BR') + weekday.slice(1);
}

export function getShortDate(date: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    timeZone: 'UTC',
  }).format(parseCivilDate(date));
}