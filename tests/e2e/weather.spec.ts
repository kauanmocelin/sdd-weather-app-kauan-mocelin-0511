import { expect, test } from '@playwright/test';

const city = {
  id: 1,
  name: 'Curitiba',
  country: 'Brasil',
  admin1: 'Paraná',
  latitude: -25.429,
  longitude: -49.271,
};

const forecast = {
  timezone: 'America/Sao_Paulo',
  current: {
    time: '2026-11-05T10:00',
    temperature_2m: 0,
    weather_code: 0,
  },
  daily: {
    time: ['2026-11-05', '2026-11-06', '2026-11-07', '2026-11-08', '2026-11-09'],
    weather_code: [0, 1, 2, 3, 0],
    temperature_2m_max: [10, 11, 12, 13, 14],
    temperature_2m_min: [5, 6, 7, 8, 9],
    precipitation_probability_max: [0, 10, 20, 30, 40],
  },
};

async function mockWeatherApis(page: import('@playwright/test').Page) {
  await page.route('**/geocoding-api.open-meteo.com/**', (route) =>
    route.fulfill({ json: { results: [city] } }),
  );
  await page.route('**/api.open-meteo.com/**', (route) => route.fulfill({ json: forecast }));
}

test('busca uma cidade, exibe a previsão e converte a temperatura para Fahrenheit', async ({
  page,
}) => {
  await mockWeatherApis(page);

  await page.goto('/');
  await page.getByRole('searchbox', { name: 'Buscar cidade' }).fill('Curitiba');
  await page.getByRole('button', { name: 'Buscar' }).click();

  await expect(page.getByRole('heading', { name: 'Curitiba' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Resultados da consulta' })).toBeFocused();
  await expect(page.getByRole('region', { name: 'Previsão de 5 dias' })).toBeVisible();
  await expect(
    page.getByRole('region', { name: 'Curitiba' }).getByText('0°', { exact: true }),
  ).toBeVisible();

  await page.getByRole('button', { name: '°F' }).click();

  await expect(
    page.getByRole('region', { name: 'Curitiba' }).getByText('32°', { exact: true }),
  ).toBeVisible();
});

test('não consulta geocoding com busca vazia ou só espaços', async ({ page }) => {
  let geocodingRequests = 0;
  await page.route('**/geocoding-api.open-meteo.com/**', (route) => {
    geocodingRequests += 1;
    return route.fulfill({ json: { results: [] } });
  });

  await page.goto('/');
  const searchbox = page.getByRole('searchbox', { name: 'Buscar cidade' });
  const submitButton = page.getByRole('button', { name: 'Buscar' });

  await expect(submitButton).toBeDisabled();
  await searchbox.press('Enter');
  await searchbox.fill('   ');
  await expect(submitButton).toBeDisabled();
  await searchbox.press('Enter');

  expect(geocodingRequests).toBe(0);
});

test('preserva acentos, apóstrofo e hífen na busca', async ({ page }) => {
  const query = "São João d'El-Rei";
  let requestedName: string | null = null;
  await page.route('**/geocoding-api.open-meteo.com/**', (route) => {
    requestedName = new URL(route.request().url()).searchParams.get('name');
    return route.fulfill({ json: { results: [city] } });
  });
  await page.route('**/api.open-meteo.com/**', (route) => route.fulfill({ json: forecast }));

  await page.goto('/');
  await page.getByRole('searchbox', { name: 'Buscar cidade' }).fill(query);
  await page.getByRole('button', { name: 'Buscar' }).click();

  await expect(page.getByRole('heading', { name: 'Curitiba' })).toBeVisible();
  expect(requestedName).toBe(query);
});

test('mostra o estado sem resultados quando geocoding retorna lista vazia', async ({ page }) => {
  await page.route('**/geocoding-api.open-meteo.com/**', (route) =>
    route.fulfill({ json: { results: [] } }),
  );

  await page.goto('/');
  await page.getByRole('searchbox', { name: 'Buscar cidade' }).fill('Curitiba');
  await page.getByRole('button', { name: 'Buscar' }).click();

  await expect(page.getByText("Nenhuma cidade encontrada para 'Curitiba'.")).toBeVisible();
});

test('não exibe forecast parcial quando a resposta tem menos de cinco dias', async ({ page }) => {
  const incompleteForecast = {
    ...forecast,
    daily: {
      time: forecast.daily.time.slice(0, 4),
      weather_code: forecast.daily.weather_code.slice(0, 4),
      temperature_2m_max: forecast.daily.temperature_2m_max.slice(0, 4),
      temperature_2m_min: forecast.daily.temperature_2m_min.slice(0, 4),
      precipitation_probability_max: forecast.daily.precipitation_probability_max.slice(0, 4),
    },
  };
  await page.route('**/geocoding-api.open-meteo.com/**', (route) =>
    route.fulfill({ json: { results: [city] } }),
  );
  await page.route('**/api.open-meteo.com/**', (route) =>
    route.fulfill({ json: incompleteForecast }),
  );

  await page.goto('/');
  await page.getByRole('searchbox', { name: 'Buscar cidade' }).fill('Curitiba');
  await page.getByRole('button', { name: 'Buscar' }).click();

  await expect(page.getByRole('alert')).toContainText(
    'Recebemos dados inesperados do serviço de clima.',
  );
  await expect(page.getByRole('heading', { name: 'Próximos dias' })).toHaveCount(0);
});

test('busca e exibe o clima corretamente em viewport mobile', async ({ page }) => {
  await mockWeatherApis(page);
  await page.setViewportSize({ width: 375, height: 812 });

  await page.goto('/');
  await page.getByRole('searchbox', { name: 'Buscar cidade' }).fill('Curitiba');
  await page.getByRole('button', { name: 'Buscar' }).click();

  await expect(page.getByRole('heading', { name: 'Curitiba' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Previsão de 5 dias' })).toBeVisible();
  await expect(
    page.getByRole('region', { name: 'Curitiba' }).getByText('0°', { exact: true }),
  ).toBeVisible();
});
