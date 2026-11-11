export type Unit = 'celsius' | 'fahrenheit';

export interface City {
  id: number;
  name: string;
  country?: string;
  admin1?: string;
  latitude: number;
  longitude: number;
}

export interface CurrentWeather {
  temperatureC: number | null;
  weatherCode: number | null;
  referenceTime: string | null;
  humidity?: number | null;
  windSpeed?: number | null;
  precipitation?: number | null;
  pressure?: number | null;
}

export interface ForecastDay {
  date: string;
  minC: number | null;
  maxC: number | null;
  weatherCode: number | null;
  precipitationProbability: number | null;
}

export interface WeatherData {
  city: City;
  timezone: string | null;
  current: CurrentWeather;
  forecast: ForecastDay[];
  retrievedAt: string;
}
