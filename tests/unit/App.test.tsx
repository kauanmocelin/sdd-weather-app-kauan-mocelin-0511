import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../../src/App';
import { useWeather } from '../../src/hooks/useWeather';
import type { City, WeatherData } from '../../src/types/weather';

vi.mock('../../src/hooks/useWeather', () => ({
  useWeather: vi.fn(),
}));

const city: City = {
  id: 1,
  name: 'Curitiba',
  country: 'Brasil',
  admin1: 'Paraná',
  latitude: -25.429,
  longitude: -49.271,
};

const weather: WeatherData = {
  city,
  timezone: 'America/Sao_Paulo',
  current: {
    temperatureC: 22.4,
    weatherCode: 2,
    referenceTime: '2026-11-05T10:00',
  },
  forecast: [
    {
      date: '2026-11-05',
      minC: 17,
      maxC: 26,
      weatherCode: 2,
      precipitationProbability: null,
    },
  ],
  retrievedAt: '2026-11-05T13:00:00.000Z',
};

const mockedUseWeather = vi.mocked(useWeather);

function createHookState(overrides: Partial<ReturnType<typeof useWeather>> = {}) {
  return {
    status: 'idle' as const,
    data: null,
    cities: [],
    error: null,
    query: '',
    search: vi.fn(),
    selectCity: vi.fn(),
    retry: vi.fn(),
    ...overrides,
  };
}

describe('App', () => {
  beforeEach(() => {
    mockedUseWeather.mockReturnValue(createHookState());
  });

  it('renderiza a busca, unidade e o estado idle', () => {
    render(<App />);

    expect(screen.getByRole('link', { name: /WeatherView/ })).toBeInTheDocument();
    expect(screen.getByText('Busque uma cidade para começar.')).toBeInTheDocument();
    expect(screen.getByLabelText(/buscar cidade/i)).toBeInTheDocument();
    expect(screen.getByRole('group', { name: /unidade de temperatura/i })).toBeInTheDocument();
  });

  it('envia a consulta ao hook', async () => {
    const user = userEvent.setup();
    const search = vi.fn();
    mockedUseWeather.mockReturnValue(createHookState({ search }));
    render(<App />);

    await user.type(screen.getByRole('searchbox', { name: /buscar cidade/i }), 'Curitiba');
    await user.click(screen.getByRole('button', { name: 'Buscar' }));

    expect(search).toHaveBeenCalledWith('Curitiba');
  });

  it('marca resultados como ocupados sem incluir o anúncio de loading na região', () => {
    mockedUseWeather.mockReturnValue(createHookState({ status: 'loading' }));
    render(<App />);

    expect(screen.getByText('Carregando clima...')).toBeInTheDocument();
    const results = screen.getByRole('region', { name: 'Resultados da consulta' });
    expect(results).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByRole('status').closest('[aria-busy="true"]')).toBeNull();
  });

  it('move o foco para a região de resultados quando a busca termina', () => {
    mockedUseWeather.mockReturnValue(createHookState({ status: 'loading' }));
    const { rerender } = render(<App />);

    mockedUseWeather.mockReturnValue(createHookState({ status: 'empty', query: 'Recife' }));
    rerender(<App />);

    expect(screen.getByRole('region', { name: 'Resultados da consulta' })).toHaveFocus();
  });

  it('renderiza o estado empty com a consulta', () => {
    mockedUseWeather.mockReturnValue(createHookState({ status: 'empty', query: 'Recife' }));
    render(<App />);

    expect(screen.getByText("Nenhuma cidade encontrada para 'Recife'.")).toBeInTheDocument();
    expect(screen.getByText('Confira a grafia e tente novamente.')).toBeInTheDocument();
  });

  it('renderiza o erro e encaminha a ação para retry', async () => {
    const user = userEvent.setup();
    const retry = vi.fn();
    mockedUseWeather.mockReturnValue(
      createHookState({ status: 'error', error: 'Falha de rede.', retry }),
    );
    render(<App />);

    expect(screen.getByRole('alert')).toHaveTextContent('Falha de rede.');
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(retry).toHaveBeenCalledOnce();
  });

  it('renderiza o clima e aplica a unidade da interface', async () => {
    const user = userEvent.setup();
    mockedUseWeather.mockReturnValue(createHookState({ status: 'success', data: weather }));
    render(<App />);

    expect(screen.getByRole('heading', { name: 'Curitiba' })).toBeInTheDocument();
    expect(screen.getByText('22°')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Próximos dias' })).toBeInTheDocument();
    expect(screen.queryByText('Umidade')).not.toBeInTheDocument();
    expect(screen.queryByText('Vento')).not.toBeInTheDocument();
    expect(screen.queryByText('Pressão')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '°F' }));
    expect(screen.getByText('72°')).toBeInTheDocument();
  });

  it('exibe placeholders para valores inválidos sem mostrar NaN ou undefined', () => {
    const incompleteWeather: WeatherData = {
      ...weather,
      current: {
        ...weather.current,
        temperatureC: null,
        weatherCode: null,
      },
      forecast: weather.forecast.map((day) => ({
        ...day,
        minC: null,
        maxC: null,
        weatherCode: null,
      })),
    };
    mockedUseWeather.mockReturnValue(
      createHookState({ status: 'success', data: incompleteWeather }),
    );
    render(<App />);

    expect(screen.queryByText(/NaN|undefined/)).not.toBeInTheDocument();
    expect(screen.getAllByText('—')).toHaveLength(3);
    expect(screen.getAllByText('Condição indisponível')).toHaveLength(2);
    expect(screen.getByText('Chuva —')).toBeInTheDocument();
  });
});
