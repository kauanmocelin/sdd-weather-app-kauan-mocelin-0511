interface WeatherCondition {
  label: string;
  icon: string;
}

const CONDITIONS: Record<number, WeatherCondition> = {
  0: { label: 'Céu limpo', icon: '☀️' },
  1: { label: 'Predominantemente limpo', icon: '🌤️' },
  2: { label: 'Parcialmente nublado', icon: '⛅' },
  3: { label: 'Nublado', icon: '☁️' },
  45: { label: 'Neblina', icon: '🌫️' },
  48: { label: 'Neblina', icon: '🌫️' },
  51: { label: 'Chuvisco leve', icon: '🌦️' },
  53: { label: 'Chuvisco moderado', icon: '🌦️' },
  55: { label: 'Chuvisco intenso', icon: '🌧️' },
  56: { label: 'Chuvisco congelante leve', icon: '🌧️' },
  57: { label: 'Chuvisco congelante intenso', icon: '🌧️' },
  61: { label: 'Chuva leve', icon: '🌧️' },
  63: { label: 'Chuva moderada', icon: '🌧️' },
  65: { label: 'Chuva intensa', icon: '🌧️' },
  66: { label: 'Chuva congelante leve', icon: '🌧️' },
  67: { label: 'Chuva congelante intensa', icon: '🌧️' },
  71: { label: 'Neve leve', icon: '🌨️' },
  73: { label: 'Neve moderada', icon: '🌨️' },
  75: { label: 'Neve intensa', icon: '❄️' },
  77: { label: 'Grãos de neve', icon: '🌨️' },
  80: { label: 'Pancadas de chuva leves', icon: '🌦️' },
  81: { label: 'Pancadas de chuva moderadas', icon: '🌦️' },
  82: { label: 'Pancadas de chuva violentas', icon: '🌧️' },
  85: { label: 'Pancadas de neve leves', icon: '🌨️' },
  86: { label: 'Pancadas de neve intensas', icon: '❄️' },
  95: { label: 'Trovoada', icon: '⛈️' },
  96: { label: 'Trovoada com granizo leve', icon: '⛈️' },
  99: { label: 'Trovoada com granizo intenso', icon: '⛈️' },
};

const FALLBACK: WeatherCondition = {
  label: 'Condição indisponível',
  icon: '◌',
};

export function getWeatherLabel(weatherCode: number | null | undefined): string {
  if (typeof weatherCode !== 'number' || !Number.isFinite(weatherCode)) return FALLBACK.label;
  return CONDITIONS[weatherCode]?.label ?? FALLBACK.label;
}

export function getWeatherIcon(weatherCode: number | null | undefined): string {
  if (typeof weatherCode !== 'number' || !Number.isFinite(weatherCode)) return FALLBACK.icon;
  return CONDITIONS[weatherCode]?.icon ?? FALLBACK.icon;
}
