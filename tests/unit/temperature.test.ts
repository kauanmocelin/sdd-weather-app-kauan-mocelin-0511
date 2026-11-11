import { describe, expect, it } from 'vitest';
import { convertTemperature, formatTemperature, unitLabel } from '../../src/lib/temperature';

describe('convertTemperature', () => {
  it.each([
    [0, 32],
    [100, 212],
    [-40, -40],
    [37, 98.6],
  ])('converte %i °C para %i °F', (celsius, fahrenheit) => {
    expect(convertTemperature(celsius, 'fahrenheit')).toBe(fahrenheit);
  });

  it('mantém o valor em Celsius quando a unidade é Celsius', () => {
    expect(convertTemperature(20.5, 'celsius')).toBe(20.5);
  });
});

describe('formatTemperature', () => {
  it.each([
    [20.4, 'celsius', '20°'],
    [20.5, 'celsius', '21°'],
    [20, 'fahrenheit', '68°'],
    [20.3, 'fahrenheit', '69°'],
  ] as const)('arredonda e adiciona o símbolo de grau para %s °C em %s', (celsius, unit, expected) => {
    expect(formatTemperature(celsius, unit)).toBe(expected);
  });

  it('usa travessão para temperatura ausente ou não finita', () => {
    expect(formatTemperature(null, 'celsius')).toBe('—');
    expect(formatTemperature(undefined, 'celsius')).toBe('—');
    expect(formatTemperature(Number.NaN, 'celsius')).toBe('—');
    expect(formatTemperature(Number.POSITIVE_INFINITY, 'celsius')).toBe('—');
  });
});

describe('unitLabel', () => {
  it.each([
    ['°C', 'celsius'],
    ['°F', 'fahrenheit'],
  ] as const)('retorna o rótulo %s para a unidade %s', (label, unit) => {
    expect(unitLabel(unit)).toBe(label);
  });
});
