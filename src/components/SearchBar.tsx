import { type FormEvent, useState } from 'react';

interface SearchBarProps {
  onSearch: (city: string) => void;
  disabled?: boolean;
}

export default function SearchBar({ onSearch, disabled = false }: SearchBarProps) {
  const [value, setValue] = useState('');

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const city = value.trim();

    if (city.length === 0 || disabled) return;

    onSearch(city);
  }

  return (
    <form
      role="search"
      aria-label="Busca de cidades"
      onSubmit={handleSubmit}
      className="w-full max-w-md"
    >
      <div className="flex min-h-12 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 backdrop-blur-md transition focus-within:border-accent-400 focus-within:ring-2 focus-within:ring-accent-500/30">
        <label htmlFor="city-search" className="sr-only">
          Buscar cidade
        </label>
        <input
          id="city-search"
          type="search"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Buscar cidade..."
          autoComplete="off"
          disabled={disabled}
          className="min-w-0 flex-1 bg-transparent text-white placeholder:text-white/65 outline-none disabled:cursor-not-allowed disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={disabled || value.trim().length === 0}
          className="min-h-11 rounded-lg bg-accent-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-400 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-accent-500"
        >
          Buscar
        </button>
      </div>
    </form>
  );
}
