import type { WeatherData } from '../types/weather';

export const mockWeatherData: WeatherData = {
  city: {
    id: 6322752,
    name: 'Curitiba',
    country: 'Brasil',
    admin1: 'Paraná',
    latitude: -25.429,
    longitude: -49.271,
  },
  timezone: 'America/Sao_Paulo',
  current: {
    temperatureC: 22.4,
    weatherCode: 2,
    referenceTime: '2026-11-05T10:00',
    humidity: 68,
    windSpeed: 12,
    precipitation: 0,
    pressure: 1014,
  },
  forecast: [
    {
      date: '2026-11-05',
      minC: 17.2,
      maxC: 26.1,
      weatherCode: 2,
      precipitationProbability: 20,
    },
    {
      date: '2026-11-06',
      minC: 16.8,
      maxC: 25,
      weatherCode: 3,
      precipitationProbability: 90,
    },
    {
      date: '2026-11-07',
      minC: 15.9,
      maxC: 21.3,
      weatherCode: 61,
      precipitationProbability: 70,
    },
    {
      date: '2026-11-08',
      minC: 16.4,
      maxC: 24.7,
      weatherCode: 2,
      precipitationProbability: 10,
    },
    {
      date: '2026-11-09',
      minC: 18,
      maxC: 27,
      weatherCode: 0,
      precipitationProbability: null,
    },
  ],
  retrievedAt: '2026-11-05T13:00:00.000Z',
};