import type { Unit } from '../lib/temperature';
import ForecastCard, { type ForecastDayCard } from './ForecastCard';

interface ForecastListProps {
  forecast: ForecastDayCard[];
  unit: Unit;
}

export default function ForecastList({ forecast, unit }: ForecastListProps) {
  return (
    <section aria-label="Previsão de 5 dias" className="space-y-4">
      <h2 id="forecast-heading" className="text-xl font-semibold text-white">
        Próximos dias
      </h2>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {forecast.map((day, index) => (
          <ForecastCard key={day.date} day={day} index={index} unit={unit} />
        ))}
      </ul>
    </section>
  );
}
