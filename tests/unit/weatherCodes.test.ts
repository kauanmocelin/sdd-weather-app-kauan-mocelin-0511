import { describe, expect, it } from 'vitest';
import { getWeatherIcon, getWeatherLabel } from '../../src/lib/weatherCodes';

describe('weather codes', () => {
  it.each([
    [0, 'Céu limpo', '☀️'],
    [1, 'Predominantemente limpo', '🌤️'],
    [2, 'Parcialmente nublado', '⛅'],
    [3, 'Nublado', '☁️'],
    [45, 'Neblina', '🌫️'],
    [48, 'Neblina', '🌫️'],
    [51, 'Chuvisco leve', '🌦️'],
    [53, 'Chuvisco moderado', '🌦️'],
    [55, 'Chuvisco intenso', '🌧️'],
    [56, 'Chuvisco congelante leve', '🌧️'],
    [57, 'Chuvisco congelante intenso', '🌧️'],
    [61, 'Chuva leve', '🌧️'],
    [63, 'Chuva moderada', '🌧️'],
    [65, 'Chuva intensa', '🌧️'],
    [66, 'Chuva congelante leve', '🌧️'],
    [67, 'Chuva congelante intensa', '🌧️'],
    [71, 'Neve leve', '🌨️'],
    [73, 'Neve moderada', '🌨️'],
    [75, 'Neve intensa', '❄️'],
    [77, 'Grãos de neve', '🌨️'],
    [80, 'Pancadas de chuva leves', '🌦️'],
    [81, 'Pancadas de chuva moderadas', '🌦️'],
    [82, 'Pancadas de chuva violentas', '🌧️'],
    [85, 'Pancadas de neve leves', '🌨️'],
    [86, 'Pancadas de neve intensas', '❄️'],
    [95, 'Trovoada', '⛈️'],
    [96, 'Trovoada com granizo leve', '⛈️'],
    [99, 'Trovoada com granizo intenso', '⛈️'],
  ])('mapeia o código %i para sua descrição e ícone', (code, label, icon) => {
    expect(getWeatherLabel(code)).toBe(label);
    expect(getWeatherIcon(code)).toBe(icon);
  });

  it('usa o fallback para um código desconhecido', () => {
    expect(getWeatherLabel(123456)).toBe('Condição indisponível');
    expect(getWeatherIcon(123456)).toBe('◌');
  });

  it('usa o fallback para código ausente ou não finito', () => {
    expect(getWeatherLabel(null)).toBe('Condição indisponível');
    expect(getWeatherLabel(undefined)).toBe('Condição indisponível');
    expect(getWeatherLabel(Number.NaN)).toBe('Condição indisponível');
    expect(getWeatherIcon(null)).toBe('◌');
    expect(getWeatherIcon(undefined)).toBe('◌');
    expect(getWeatherIcon(Number.NaN)).toBe('◌');
  });
});
