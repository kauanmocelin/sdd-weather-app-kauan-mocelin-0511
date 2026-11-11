import { describe, expect, it } from 'vitest';
import { getDayLabel, getShortDate } from '../../src/lib/format';

describe('date formatting', () => {
  it('rotula o índice zero como Hoje e o índice um como Amanhã', () => {
    expect(getDayLabel('2026-06-16', 0)).toBe('Hoje');
    expect(getDayLabel('2026-06-17', 1)).toBe('Amanhã');
  });

  it.each([
    ['2026-06-18', 2, 'Qui'],
    ['2026-06-21', 5, 'Dom'],
  ])('usa o dia da semana para o índice %i', (date, index, label) => {
    expect(getDayLabel(date, index)).toBe(label);
  });

  it.each([
    ['2026-06-16', '16/06'],
    ['2026-01-01', '01/01'],
  ])('formata a data civil %s como %s em pt-BR', (date, formattedDate) => {
    expect(getShortDate(date)).toBe(formattedDate);
  });
});
