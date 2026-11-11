import { getDayLabel, getShortDate } from '../lib/format';
import { formatTemperature, type Unit } from '../lib/temperature';
import { getWeatherIcon, getWeatherLabel } from '../lib/weatherCodes';

export interface ForecastDayCard {
  date: string;
  minC: number | null | undefined;
  maxC: number | null | undefined;
  weatherCode: number | null | undefined;
  precipitationProbability: number | null;
}

interface ForecastCardProps {
  day: ForecastDayCard;
  index: number;
  unit: Unit;
}

export default function ForecastCard({ day, index, unit }: ForecastCardProps) {
  const condition = getWeatherLabel(day.weatherCode);
  const precipitation =
    typeof day.precipitationProbability !== 'number' ||
    !Number.isFinite(day.precipitationProbability)
      ? '—'
      : `${Math.round(day.precipitationProbability)}%`;

  return (
    <li className="flex min-w-0 flex-col items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-4 text-center backdrop-blur-md">
      <p className="font-semibold text-white">{getDayLabel(day.date, index)}</p>
      <p className="text-xs text-white/65">{getShortDate(day.date)}</p>
      <span aria-hidden="true" className="mt-1 text-3xl">
        {getWeatherIcon(day.weatherCode)}
      </span>
      <p className="min-h-8 text-xs text-white/65">{condition}</p>
      <div className="flex max-w-full flex-wrap justify-center gap-x-2 text-sm">
        <span className="whitespace-nowrap">
          <span className="text-white/65">Máx </span>
          <span className="font-semibold text-white">{formatTemperature(day.maxC, unit)}</span>
        </span>
        <span className="whitespace-nowrap">
          <span className="text-white/65">Mín </span>
          <span className="text-white/75">{formatTemperature(day.minC, unit)}</span>
        </span>
      </div>
      <p className="text-xs text-accent-400">Chuva {precipitation}</p>
    </li>
  );
}
