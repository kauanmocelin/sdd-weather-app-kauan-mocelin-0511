import { formatTemperature, type Unit } from '../lib/temperature';
import { getWeatherIcon, getWeatherLabel } from '../lib/weatherCodes';

interface City {
  name: string;
  country?: string;
  admin1?: string;
}

interface CurrentConditions {
  temperatureC: number | null | undefined;
  weatherCode: number | null | undefined;
}

interface CurrentWeatherProps {
  city: City;
  current: CurrentConditions;
  unit: Unit;
}

export default function CurrentWeather({ city, current, unit }: CurrentWeatherProps) {
  const location = [city.admin1, city.country].filter(Boolean).join(', ');
  const temperature = formatTemperature(current.temperatureC, unit);
  const accessibleTemperature =
    temperature === '—'
      ? 'Temperatura indisponível'
      : `${temperature} ${unit === 'celsius' ? 'Celsius' : 'Fahrenheit'}`;

  return (
    <section
      aria-labelledby="current-city-heading"
      className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-glass backdrop-blur-md md:p-8"
    >
      <div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_minmax(16rem,0.8fr)] md:items-center">
        <div>
          <h2
            id="current-city-heading"
            className="break-words text-2xl font-bold text-white md:text-3xl"
          >
            {city.name}
          </h2>
          {location && <p className="mt-1 text-white/60">{location}</p>}

          <div className="mt-6 flex items-center gap-4">
            <span aria-hidden="true" className="text-6xl md:text-7xl">
              {getWeatherIcon(current.weatherCode)}
            </span>
            <p className="whitespace-nowrap text-6xl font-light text-white md:text-8xl">
              <span aria-hidden="true">{temperature}</span>
              <span className="sr-only">{accessibleTemperature}</span>
            </p>
          </div>
          <p className="mt-3 text-lg text-white/75">{getWeatherLabel(current.weatherCode)}</p>
        </div>
      </div>
    </section>
  );
}
