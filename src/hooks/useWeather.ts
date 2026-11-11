import { useCallback, useRef, useState } from 'react';
import { getWeather, searchCities, WeatherServiceError } from '../services/weatherService';
import type { City, WeatherData } from '../types/weather';

export type WeatherStatus = 'idle' | 'loading' | 'success' | 'error' | 'empty';

interface UseWeatherResult {
  status: WeatherStatus;
  data: WeatherData | null;
  cities: City[];
  error: string | null;
  query: string;
  search: (name: string) => Promise<void>;
  selectCity: (city: City) => Promise<void>;
  retry: () => Promise<void>;
}

type WeatherOperation = { type: 'search'; name: string } | { type: 'selectCity'; city: City };

function getErrorMessage(error: unknown): string {
  return error instanceof WeatherServiceError
    ? error.message
    : 'Algo deu errado. Tente novamente.';
}

export function useWeather(): UseWeatherResult {
  const [status, setStatus] = useState<WeatherStatus>('idle');
  const [data, setData] = useState<WeatherData | null>(null);
  const [cities, setCities] = useState<City[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const operationRef = useRef<WeatherOperation | null>(null);
  const requestIdRef = useRef(0);

  const loadWeather = useCallback(async (city: City, requestId: number) => {
    try {
      const result = await getWeather(city);
      if (requestId !== requestIdRef.current) return;

      setData(result);
      setError(null);
      setStatus('success');
    } catch (requestError) {
      if (requestId !== requestIdRef.current) return;

      setError(getErrorMessage(requestError));
      setStatus('error');
    }
  }, []);

  const runSearch = useCallback(
    async (name: string) => {
      const normalizedName = name.trim();
      const requestId = ++requestIdRef.current;
      operationRef.current = { type: 'search', name: normalizedName };
      setQuery(normalizedName);
      setStatus('loading');
      setError(null);
      setCities([]);

      try {
        const results = await searchCities(normalizedName);
        if (requestId !== requestIdRef.current) return;

        setCities(results);
        if (results.length === 0) {
          setStatus('empty');
          return;
        }

        await loadWeather(results[0], requestId);
      } catch (requestError) {
        if (requestId !== requestIdRef.current) return;

        setError(getErrorMessage(requestError));
        setStatus('error');
      }
    },
    [loadWeather],
  );

  const selectCity = useCallback(
    async (city: City) => {
      const requestId = ++requestIdRef.current;
      operationRef.current = { type: 'selectCity', city };
      setStatus('loading');
      setError(null);
      await loadWeather(city, requestId);
    },
    [loadWeather],
  );

  const retry = useCallback(async () => {
    const operation = operationRef.current;
    if (!operation) return;

    if (operation.type === 'search') {
      await runSearch(operation.name);
    } else {
      await selectCity(operation.city);
    }
  }, [runSearch, selectCity]);

  return { status, data, cities, error, query, search: runSearch, selectCity, retry };
}
