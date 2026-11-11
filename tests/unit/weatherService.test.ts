import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getWeather, searchCities, WeatherServiceError } from '../../src/services/weatherService';
import type { City } from '../../src/types/weather';

const city: City = {
  id: 1,
  name: 'Curitiba',
  country: 'Brasil',
  admin1: 'Paraná',
  latitude: -25.429,
  longitude: -49.271,
};

function mockFetchOnce(body: unknown, ok = true) {
  return vi.fn().mockResolvedValue({
    ok,
    json: async () => body,
  } as Response);
}

function validForecastResponse() {
  return {
    timezone: 'America/Sao_Paulo',
    current: {
      time: '2026-11-05T10:00',
      temperature_2m: 22.4,
      weather_code: 2,
    },
    daily: {
      time: ['2026-11-05', '2026-11-06', '2026-11-07', '2026-11-08', '2026-11-09'],
      weather_code: [2, 3, 61, 2, 0],
      temperature_2m_max: [26.1, 25, 21.3, 24.7, 27],
      temperature_2m_min: [17.2, 16.8, 15.9, 16.4, 18],
      precipitation_probability_max: [null, 20, 40, 60, 80],
    },
  };
}

describe('searchCities', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it.each(['', '   '])('retorna lista vazia para consulta %j sem chamar a rede', async (query) => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);

    await expect(searchCities(query)).resolves.toEqual([]);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('codifica o nome e mapeia os resultados para City', async () => {
    const name = 'São José';
    const fetchSpy = mockFetchOnce({
      results: [
        {
          id: 1,
          name,
          country: 'Brasil',
          admin1: 'Santa Catarina',
          latitude: -27.6,
          longitude: -48.6,
        },
      ],
    });
    vi.stubGlobal('fetch', fetchSpy);

    await expect(searchCities(name)).resolves.toEqual([
      {
        id: 1,
        name,
        country: 'Brasil',
        admin1: 'Santa Catarina',
        latitude: -27.6,
        longitude: -48.6,
      },
    ]);
    expect(fetchSpy.mock.calls[0][0]).toContain(`name=${encodeURIComponent(name)}`);
  });

  it('retorna lista vazia quando results está ausente', async () => {
    vi.stubGlobal('fetch', mockFetchOnce({}));

    await expect(searchCities('Inexistente')).resolves.toEqual([]);
  });

  it('retorna lista vazia quando results é null', async () => {
    vi.stubGlobal('fetch', mockFetchOnce({ results: null }));

    await expect(searchCities('Inexistente')).resolves.toEqual([]);
  });

  it('retorna lista vazia quando results é um array vazio', async () => {
    vi.stubGlobal('fetch', mockFetchOnce({ results: [] }));

    await expect(searchCities('Inexistente')).resolves.toEqual([]);
  });

  it('preserva acentos, apóstrofo e hífen na consulta de geocoding', async () => {
    const name = "São João d'El-Rei";
    const fetchSpy = mockFetchOnce({ results: [] });
    vi.stubGlobal('fetch', fetchSpy);

    await searchCities(name);

    expect(new URL(fetchSpy.mock.calls[0][0]).searchParams.get('name')).toBe(name);
  });

  it('omite país e região quando a resposta os fornece como null', async () => {
    vi.stubGlobal(
      'fetch',
      mockFetchOnce({
        results: [
          {
            id: 1,
            name: 'Curitiba',
            latitude: -25.429,
            longitude: -49.271,
            country: null,
            admin1: null,
          },
        ],
      }),
    );

    await expect(searchCities('Curitiba')).resolves.toEqual([
      { id: 1, name: 'Curitiba', latitude: -25.429, longitude: -49.271 },
    ]);
  });

  it('rejeita resultados de geocoding sem campos essenciais', async () => {
    vi.stubGlobal('fetch', mockFetchOnce({ results: [{ id: 1, name: 'Curitiba' }] }));

    await expect(searchCities('Curitiba')).rejects.toMatchObject({
      name: 'WeatherServiceError',
      message: 'Recebemos dados inesperados do serviço de clima.',
    });
  });

  it('lança WeatherServiceError quando a resposta não é ok', async () => {
    vi.stubGlobal('fetch', mockFetchOnce({}, false));

    await expect(searchCities('Curitiba')).rejects.toBeInstanceOf(WeatherServiceError);
  });
});

describe('getWeather', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('consulta o forecast e mapeia current e cinco dias', async () => {
    const fetchSpy = mockFetchOnce({
      timezone: 'America/Sao_Paulo',
      current: {
        time: '2026-11-05T10:00',
        temperature_2m: 22.4,
        weather_code: 2,
      },
      daily: {
        time: ['2026-11-05', '2026-11-06', '2026-11-07', '2026-11-08', '2026-11-09'],
        weather_code: [2, 3, 61, 2, 0],
        temperature_2m_max: [26.1, 25, 21.3, 24.7, 27],
        temperature_2m_min: [17.2, 16.8, 15.9, 16.4, 18],
        precipitation_probability_max: [null, 20, 40, 60, 80],
      },
    });
    vi.stubGlobal('fetch', fetchSpy);

    const result = await getWeather(city);

    expect(fetchSpy).toHaveBeenCalledOnce();
    const requestUrl = new URL(fetchSpy.mock.calls[0][0]);
    expect(requestUrl.origin + requestUrl.pathname).toBe('https://api.open-meteo.com/v1/forecast');
    expect(requestUrl.searchParams.get('latitude')).toBe(String(city.latitude));
    expect(requestUrl.searchParams.get('longitude')).toBe(String(city.longitude));
    expect(requestUrl.searchParams.get('current')).toBe('temperature_2m,weather_code');
    expect(requestUrl.searchParams.get('daily')).toBe(
      'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max',
    );
    expect(requestUrl.searchParams.get('forecast_days')).toBe('5');
    expect(requestUrl.searchParams.get('timezone')).toBe('auto');
    expect(requestUrl.searchParams.get('temperature_unit')).toBe('celsius');
    expect(result.city).toBe(city);
    expect(result.timezone).toBe('America/Sao_Paulo');
    expect(result.current).toEqual({
      referenceTime: '2026-11-05T10:00',
      temperatureC: 22.4,
      weatherCode: 2,
    });
    expect(result.forecast).toHaveLength(5);
    expect(result.forecast[0]).toEqual({
      date: '2026-11-05',
      weatherCode: 2,
      maxC: 26.1,
      minC: 17.2,
      precipitationProbability: null,
    });
    expect(result.forecast[1].precipitationProbability).toBe(20);
    expect(result.forecast).toHaveLength(5);
    expect(result.retrievedAt).toMatch(/^\d{4}-\d{2}-\d{2}T.*Z$/);
  });

  it.each(['ausente', 'null'])('mapeia precipitação %s como indisponível', async (variant) => {
    const response = validForecastResponse();
    const daily = { ...response.daily } as Record<string, unknown>;
    if (variant === 'ausente') {
      delete daily.precipitation_probability_max;
    } else {
      daily.precipitation_probability_max = null;
    }
    vi.stubGlobal('fetch', mockFetchOnce({ ...response, daily }));

    const result = await getWeather(city);

    expect(result.forecast.every((day) => day.precipitationProbability === null)).toBe(true);
  });

  it.each([
    ['current ausente', { timezone: 'America/Sao_Paulo', daily: {} }],
    ['daily ausente', { timezone: 'America/Sao_Paulo', current: {} }],
  ])('lança erro tipado quando %s', async (_label, body) => {
    vi.stubGlobal('fetch', mockFetchOnce(body));

    await expect(getWeather(city)).rejects.toBeInstanceOf(WeatherServiceError);
  });

  it('lança WeatherServiceError quando o endpoint de forecast retorna HTTP não-ok', async () => {
    vi.stubGlobal('fetch', mockFetchOnce({}, false));

    await expect(getWeather(city)).rejects.toMatchObject({
      name: 'WeatherServiceError',
      message: 'Não foi possível carregar o clima. Tente novamente.',
    });
  });

  it('rejeita valor numérico não finito na resposta atual', async () => {
    const body = {
      ...validForecastResponse(),
      current: { ...validForecastResponse().current, weather_code: Number.NaN },
    };
    vi.stubGlobal('fetch', mockFetchOnce(body));

    await expect(getWeather(city)).rejects.toMatchObject({
      name: 'WeatherServiceError',
      message: 'Recebemos dados inesperados do serviço de clima.',
    });
  });

  it('mapeia campos atuais e timezone ausentes ou null para null', async () => {
    vi.stubGlobal(
      'fetch',
      mockFetchOnce({
        ...validForecastResponse(),
        timezone: null,
        current: {
          time: null,
          temperature_2m: null,
          weather_code: null,
        },
      }),
    );

    const result = await getWeather(city);

    expect(result.timezone).toBeNull();
    expect(result.current).toEqual({
      referenceTime: null,
      temperatureC: null,
      weatherCode: null,
    });
  });

  it('mapeia campos atuais e timezone ausentes para null', async () => {
    const response = validForecastResponse();
    delete (response as Record<string, unknown>).current;
    delete (response as Record<string, unknown>).timezone;
    vi.stubGlobal('fetch', mockFetchOnce(response));

    const result = await getWeather(city);

    expect(result.timezone).toBeNull();
    expect(result.current).toEqual({
      referenceTime: null,
      temperatureC: null,
      weatherCode: null,
    });
  });

  it('mapeia vetores diários opcionais ausentes ou null para null por dia', async () => {
    const response = validForecastResponse();
    const daily = { ...response.daily } as Record<string, unknown>;
    delete daily.weather_code;
    daily.temperature_2m_max = null;
    delete daily.temperature_2m_min;
    daily.precipitation_probability_max = null;
    vi.stubGlobal('fetch', mockFetchOnce({ ...response, daily }));

    const result = await getWeather(city);

    expect(result.forecast).toHaveLength(5);
    expect(
      result.forecast.every(
        (day) =>
          day.weatherCode === null &&
          day.maxC === null &&
          day.minC === null &&
          day.precipitationProbability === null,
      ),
    ).toBe(true);
  });

  it.each([
    [
      'datas civis inválidas',
      {
        ...validForecastResponse(),
        daily: {
          ...validForecastResponse().daily,
          time: ['2026-02-29', '2026-03-01', '2026-03-02', '2026-03-03', '2026-03-04'],
        },
      },
    ],
    [
      'datas não consecutivas',
      {
        ...validForecastResponse(),
        daily: {
          ...validForecastResponse().daily,
          time: ['2026-11-05', '2026-11-06', '2026-11-08', '2026-11-09', '2026-11-10'],
        },
      },
    ],
    [
      'temperatura máxima não finita',
      {
        ...validForecastResponse(),
        daily: {
          ...validForecastResponse().daily,
          temperature_2m_max: [26.1, 25, Number.NaN, 24.7, 27],
        },
      },
    ],
    [
      'probabilidade de precipitação ausente',
      {
        ...validForecastResponse(),
        daily: {
          ...validForecastResponse().daily,
          precipitation_probability_max: [null, 20, 40, 60],
        },
      },
    ],
  ])('rejeita forecast parcial ou inválido: %s', async (_label, body) => {
    vi.stubGlobal('fetch', mockFetchOnce(body));

    await expect(getWeather(city)).rejects.toMatchObject({
      name: 'WeatherServiceError',
      message: 'Recebemos dados inesperados do serviço de clima.',
    });
  });

  it('converte JSON inválido do forecast em WeatherServiceError', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => {
          throw new SyntaxError('Unexpected token');
        },
      }),
    );

    await expect(getWeather(city)).rejects.toMatchObject({
      name: 'WeatherServiceError',
      message: 'Recebemos dados inesperados do serviço de clima.',
    });
  });

  it('lança erro tipado quando os vetores não têm cinco dias consecutivos', async () => {
    vi.stubGlobal(
      'fetch',
      mockFetchOnce({
        timezone: 'America/Sao_Paulo',
        current: {
          time: '2026-11-05T10:00',
          temperature_2m: 22.4,
          weather_code: 2,
        },
        daily: {
          time: ['2026-11-05', '2026-11-06'],
          weather_code: [2, 3],
          temperature_2m_max: [26.1, 25],
          temperature_2m_min: [17.2, 16.8],
          precipitation_probability_max: [null, 20],
        },
      }),
    );

    await expect(getWeather(city)).rejects.toBeInstanceOf(WeatherServiceError);
  });

  it('rejeita forecast com menos de cinco datas e vetores alinhados', async () => {
    const response = validForecastResponse();
    const daily = {
      ...response.daily,
      time: response.daily.time.slice(0, 4),
      weather_code: response.daily.weather_code.slice(0, 4),
      temperature_2m_max: response.daily.temperature_2m_max.slice(0, 4),
      temperature_2m_min: response.daily.temperature_2m_min.slice(0, 4),
      precipitation_probability_max: response.daily.precipitation_probability_max.slice(0, 4),
    };
    vi.stubGlobal('fetch', mockFetchOnce({ ...response, daily }));

    await expect(getWeather(city)).rejects.toMatchObject({
      name: 'WeatherServiceError',
      message: 'Recebemos dados inesperados do serviço de clima.',
    });
  });

  it('converte AbortError em erro de timeout e limpa o timer', async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      'fetch',
      vi.fn(
        (_url: string, { signal }: { signal: AbortSignal }) =>
          new Promise<Response>((_resolve, reject) => {
            signal.addEventListener('abort', () => {
              reject(new DOMException('Aborted', 'AbortError'));
            });
          }),
      ),
    );

    const request = expect(getWeather(city)).rejects.toMatchObject({
      name: 'WeatherServiceError',
      message: 'A requisição demorou demais.',
    });
    await vi.advanceTimersByTimeAsync(10_000);

    await request;
    expect(vi.getTimerCount()).toBe(0);
  });

  it('converte falhas de rede em WeatherServiceError', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network failed')));

    await expect(getWeather(city)).rejects.toMatchObject({
      name: 'WeatherServiceError',
      message: 'Falha de rede.',
    });
    expect(vi.getTimerCount()).toBe(0);
  });
});
