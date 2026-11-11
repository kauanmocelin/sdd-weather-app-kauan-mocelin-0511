import { useEffect, useRef, useState } from 'react';
import CurrentWeather from './components/CurrentWeather';
import ForecastList from './components/ForecastList';
import SearchBar from './components/SearchBar';
import EmptyState from './components/states/EmptyState';
import ErrorState from './components/states/ErrorState';
import LoadingState from './components/states/LoadingState';
import UnitToggle from './components/UnitToggle';
import { useWeather } from './hooks/useWeather';
import type { Unit } from './lib/temperature';

export default function App() {
  const [unit, setUnit] = useState<Unit>('celsius');
  const { status, data, error, query, search, retry } = useWeather();
  const resultsRef = useRef<HTMLDivElement>(null);
  const wasLoadingRef = useRef(false);

  useEffect(() => {
    if (status === 'loading') {
      wasLoadingRef.current = true;
      return;
    }

    if (wasLoadingRef.current) {
      resultsRef.current?.focus();
      wasLoadingRef.current = false;
    }
  }, [status]);

  return (
    <div className="min-h-screen bg-night-900 text-white">
      <header className="border-b border-white/10 bg-night-900/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <a
            href="/"
            className="flex items-center gap-3 self-start rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-400"
          >
            <span aria-hidden="true" className="text-3xl text-sun">
              ☀️
            </span>
            <span className="text-lg font-bold tracking-wide">WeatherView</span>
          </a>
          <div className="flex w-full min-w-0 flex-col gap-3 md:flex-row lg:w-auto lg:items-center">
            <SearchBar onSearch={search} disabled={status === 'loading'} />
            <UnitToggle unit={unit} onChange={setUnit} />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6 md:py-10">
        <h1 className="sr-only">WeatherView</h1>
        <div
          ref={resultsRef}
          role="region"
          aria-label="Resultados da consulta"
          aria-busy={status === 'loading'}
          tabIndex={-1}
          className="focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-400"
        >
          {status === 'idle' && (
            <EmptyState title="Consulte o clima" hint="Busque uma cidade para começar." />
          )}

          {status === 'empty' && (
            <EmptyState
              title={`Nenhuma cidade encontrada para '${query}'.`}
              hint="Confira a grafia e tente novamente."
            />
          )}

          {status === 'error' && (
            <ErrorState message={error ?? 'Algo deu errado. Tente novamente.'} onRetry={retry} />
          )}

          {status === 'success' && data && (
            <div className="space-y-8">
              <CurrentWeather city={data.city} current={data.current} unit={unit} />
              <ForecastList forecast={data.forecast} unit={unit} />
            </div>
          )}
        </div>

        {status === 'loading' && <LoadingState />}
      </main>

      <footer className="px-4 pb-8 text-center text-xs text-white/60">
        Dados fornecidos por Open-Meteo.
      </footer>
    </div>
  );
}
