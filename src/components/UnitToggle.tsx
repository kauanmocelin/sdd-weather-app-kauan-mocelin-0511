import { type KeyboardEvent, useRef } from 'react';

type Unit = 'celsius' | 'fahrenheit';

interface UnitToggleProps {
  unit: Unit;
  onChange: (unit: Unit) => void;
}

/** Alternador de unidade Celsius/Fahrenheit, acessível por teclado. */
export default function UnitToggle({ unit, onChange }: UnitToggleProps) {
  const celsiusButtonRef = useRef<HTMLButtonElement>(null);
  const fahrenheitButtonRef = useRef<HTMLButtonElement>(null);

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    let nextUnit: Unit | null = null;

    if (event.key === 'ArrowRight' || event.key === 'ArrowDown' || event.key === 'End') {
      nextUnit = 'fahrenheit';
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp' || event.key === 'Home') {
      nextUnit = 'celsius';
    }

    if (nextUnit === null) return;

    event.preventDefault();
    onChange(nextUnit);
    (nextUnit === 'celsius' ? celsiusButtonRef : fahrenheitButtonRef).current?.focus();
  }

  return (
    <div
      role="group"
      aria-label="Unidade de temperatura"
      className="inline-flex rounded-lg border border-white/10 bg-white/5 p-1 backdrop-blur-md"
    >
      <button
        ref={celsiusButtonRef}
        type="button"
        aria-pressed={unit === 'celsius'}
        tabIndex={unit === 'celsius' ? 0 : -1}
        onClick={() => onChange('celsius')}
        onKeyDown={handleKeyDown}
        className={`rounded-md px-3 py-1 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-400 ${unit === 'celsius' ? 'bg-accent-500 text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}
      >
        °C
      </button>
      <button
        ref={fahrenheitButtonRef}
        type="button"
        aria-pressed={unit === 'fahrenheit'}
        tabIndex={unit === 'fahrenheit' ? 0 : -1}
        onClick={() => onChange('fahrenheit')}
        onKeyDown={handleKeyDown}
        className={`rounded-md px-3 py-1 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-400 ${unit === 'fahrenheit' ? 'bg-accent-500 text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}
      >
        °F
      </button>
    </div>
  );
}
