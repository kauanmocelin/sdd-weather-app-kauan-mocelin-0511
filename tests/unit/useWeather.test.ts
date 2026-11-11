import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useWeather } from '../../src/hooks/useWeather';
import { getWeather, searchCities } from '../../src/services/weatherService';
import type { City, WeatherData } from '../../src/types/weather';

vi.mock('../../src/services/weatherService', () => ({
  getWeather: vi.fn(),
  searchCities: vi.fn(),
  WeatherServiceError: class WeatherServiceError extends Error {},
}));

const city: City = {
  id: 1,
  name: 'Curitiba',
  country: 'Brasil',
  admin1: 'Paraná',
  latitude: -25.429,
  longitude: -49.271,
};

const weather: WeatherData = {
  city,
  timezone: 'America/Sao_Paulo',
  current: {
    temperatureC: 22,
    weatherCode: 2,
    referenceTime: '2026-11-05T10:00',
  },
  forecast: [],
  retrievedAt: '2026-11-05T13:00:00.000Z',
};

const mockedSearchCities = vi.mocked(searchCities);
const mockedGetWeather = vi.mocked(getWeather);

describe('useWeather', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('busca cidades e carrega o clima da primeira correspondência', async () => {
    mockedSearchCities.mockResolvedValue([city]);
    mockedGetWeather.mockResolvedValue(weather);
    const { result } = renderHook(() => useWeather());

    await act(async () => {
      await result.current.search('  Curitiba  ');
    });

    expect(mockedSearchCities).toHaveBeenCalledWith('Curitiba');
    expect(mockedGetWeather).toHaveBeenCalledWith(city);
    expect(result.current).toMatchObject({
      status: 'success',
      data: weather,
      cities: [city],
      error: null,
      query: 'Curitiba',
    });
  });

  it('define status empty quando a busca não encontra cidades', async () => {
    mockedSearchCities.mockResolvedValue([]);
    const { result } = renderHook(() => useWeather());

    await act(async () => {
      await result.current.search('Recife');
    });

    expect(result.current.status).toBe('empty');
    expect(result.current.cities).toEqual([]);
    expect(mockedGetWeather).not.toHaveBeenCalled();
  });

  it('ignora respostas de busca obsoletas que chegam depois da busca atual', async () => {
    const oldCity = { ...city, id: 2, name: 'Outra cidade' };
    let resolveOldSearch: (cities: City[]) => void = () => {};
    const oldSearch = new Promise<City[]>((resolve) => {
      resolveOldSearch = resolve;
    });
    mockedSearchCities.mockReturnValueOnce(oldSearch).mockResolvedValueOnce([city]);
    mockedGetWeather.mockResolvedValue(weather);
    const { result } = renderHook(() => useWeather());
    let firstSearch: Promise<void> = Promise.resolve();

    await act(async () => {
      firstSearch = result.current.search('Outra cidade');
      await result.current.search('Curitiba');
    });
    await act(async () => {
      resolveOldSearch([oldCity]);
      await firstSearch;
    });

    expect(result.current.status).toBe('success');
    expect(result.current.cities).toEqual([city]);
    expect(result.current.data).toEqual(weather);
    expect(mockedGetWeather).toHaveBeenCalledOnce();
    expect(mockedGetWeather).toHaveBeenCalledWith(city);
  });

  it('seleciona uma cidade e retry repete a consulta de clima', async () => {
    mockedGetWeather
      .mockRejectedValueOnce(new Error('Falha de rede.'))
      .mockResolvedValueOnce(weather);
    const { result } = renderHook(() => useWeather());

    await act(async () => {
      await result.current.selectCity(city);
    });
    expect(result.current.status).toBe('error');

    await act(async () => {
      await result.current.retry();
    });

    expect(mockedGetWeather).toHaveBeenNthCalledWith(1, city);
    expect(mockedGetWeather).toHaveBeenNthCalledWith(2, city);
    expect(result.current.status).toBe('success');
    expect(result.current.data).toEqual(weather);
  });

  it('retry repete a busca se a busca anterior falhou', async () => {
    mockedSearchCities.mockRejectedValueOnce(new Error('Falha de rede.')).mockResolvedValueOnce([]);
    const { result } = renderHook(() => useWeather());

    await act(async () => {
      await result.current.search('Curitiba');
    });
    expect(result.current.status).toBe('error');

    await act(async () => {
      await result.current.retry();
    });

    expect(mockedSearchCities).toHaveBeenNthCalledWith(1, 'Curitiba');
    expect(mockedSearchCities).toHaveBeenNthCalledWith(2, 'Curitiba');
    expect(result.current.status).toBe('empty');
  });
});
