import type { City, CurrentWeather, ForecastDay, WeatherData } from '../types/weather';

const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
const REQUEST_TIMEOUT_MS = 10_000;
const INVALID_WEATHER_RESPONSE_MESSAGE = 'Recebemos dados inesperados do serviço de clima.';

export class WeatherServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WeatherServiceError';
  }
}

async function fetchWithTimeout(url: string): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    return await fetch(url, { signal: controller.signal });
  } catch (error) {
    if (isRecord(error) && error.name === 'AbortError') {
      throw new WeatherServiceError('A requisição demorou demais.');
    }
    throw new WeatherServiceError('Falha de rede.');
  } finally {
    clearTimeout(timeout);
  }
}

interface ForecastResponse {
  timezone?: unknown;
  current?: unknown;
  daily?: unknown;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function readOptionalNumber(value: unknown): number | null {
  if (value == null) return null;
  if (isFiniteNumber(value)) return value;
  throw new WeatherServiceError(INVALID_WEATHER_RESPONSE_MESSAGE);
}

function readOptionalDailyNumbers(value: unknown): (number | null)[] {
  if (value == null) return Array<null>(5).fill(null);
  if (
    !Array.isArray(value) ||
    value.length !== 5 ||
    !value.every((item) => item == null || isFiniteNumber(item))
  ) {
    throw new WeatherServiceError(INVALID_WEATHER_RESPONSE_MESSAGE);
  }
  return value.map((item) => (item == null ? null : item));
}

function isCivilDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function mapForecast(daily: Record<string, unknown>): ForecastDay[] {
  const { time } = daily;
  if (!Array.isArray(time) || time.length !== 5 || !time.every(isCivilDate)) {
    throw new WeatherServiceError(INVALID_WEATHER_RESPONSE_MESSAGE);
  }

  const weatherCodes = readOptionalDailyNumbers(daily.weather_code);
  const maximumTemperatures = readOptionalDailyNumbers(daily.temperature_2m_max);
  const minimumTemperatures = readOptionalDailyNumbers(daily.temperature_2m_min);
  const precipitationProbabilities = readOptionalDailyNumbers(daily.precipitation_probability_max);

  const dates = time as string[];
  if (
    dates.some(
      (date, index) =>
        index > 0 &&
        new Date(`${date}T00:00:00.000Z`).getTime() -
          new Date(`${dates[index - 1]}T00:00:00.000Z`).getTime() !==
          86_400_000,
    )
  ) {
    throw new WeatherServiceError(INVALID_WEATHER_RESPONSE_MESSAGE);
  }

  return dates.map((date, index) => ({
    date,
    weatherCode: weatherCodes[index],
    maxC: maximumTemperatures[index],
    minC: minimumTemperatures[index],
    precipitationProbability: precipitationProbabilities[index],
  }));
}

export async function searchCities(name: string): Promise<City[]> {
  const query = name.trim();
  if (!query) return [];

  const url = `${GEOCODING_URL}?name=${encodeURIComponent(query)}&count=10&language=pt&format=json`;
  const response = await fetchWithTimeout(url);
  if (!response.ok) {
    throw new WeatherServiceError('Não foi possível buscar a cidade. Tente novamente.');
  }

  const data: unknown = await response.json();
  if (!isRecord(data)) {
    throw new WeatherServiceError(INVALID_WEATHER_RESPONSE_MESSAGE);
  }

  const results = data.results;
  if (results == null) return [];
  if (!Array.isArray(results)) {
    throw new WeatherServiceError(INVALID_WEATHER_RESPONSE_MESSAGE);
  }

  return results.map((result) => {
    if (
      !isRecord(result) ||
      !isFiniteNumber(result.id) ||
      typeof result.name !== 'string' ||
      !result.name.trim() ||
      !isFiniteNumber(result.latitude) ||
      !isFiniteNumber(result.longitude)
    ) {
      throw new WeatherServiceError(INVALID_WEATHER_RESPONSE_MESSAGE);
    }

    return {
      id: result.id,
      name: result.name,
      ...(typeof result.country === 'string' && result.country && { country: result.country }),
      ...(typeof result.admin1 === 'string' && result.admin1 && { admin1: result.admin1 }),
      latitude: result.latitude,
      longitude: result.longitude,
    };
  });
}

export async function getWeather(city: City): Promise<WeatherData> {
  const params = new URLSearchParams({
    latitude: String(city.latitude),
    longitude: String(city.longitude),
    current: 'temperature_2m,weather_code',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max',
    forecast_days: '5',
    timezone: 'auto',
    temperature_unit: 'celsius',
  });

  const response = await fetchWithTimeout(`${FORECAST_URL}?${params.toString()}`);
  if (!response.ok) {
    throw new WeatherServiceError('Não foi possível carregar o clima. Tente novamente.');
  }

  let data: ForecastResponse;
  try {
    data = (await response.json()) as ForecastResponse;
  } catch {
    throw new WeatherServiceError(INVALID_WEATHER_RESPONSE_MESSAGE);
  }
  if (
    !isRecord(data) ||
    (data.timezone != null && typeof data.timezone !== 'string') ||
    (data.current != null && !isRecord(data.current)) ||
    !isRecord(data.daily)
  ) {
    throw new WeatherServiceError(INVALID_WEATHER_RESPONSE_MESSAGE);
  }

  const currentData = isRecord(data.current) ? data.current : {};
  const referenceTime = currentData.time;
  if (referenceTime != null && typeof referenceTime !== 'string') {
    throw new WeatherServiceError(INVALID_WEATHER_RESPONSE_MESSAGE);
  }

  const current: CurrentWeather = {
    referenceTime: typeof referenceTime === 'string' && referenceTime ? referenceTime : null,
    temperatureC: readOptionalNumber(currentData.temperature_2m),
    weatherCode: readOptionalNumber(currentData.weather_code),
  };

  return {
    city,
    timezone: typeof data.timezone === 'string' && data.timezone ? data.timezone : null,
    current,
    forecast: mapForecast(data.daily),
    retrievedAt: new Date().toISOString(),
  };
}
