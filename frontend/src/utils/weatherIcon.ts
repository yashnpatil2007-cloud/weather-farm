export function weatherIcon(condition: string, code?: number | null): string {
  if (code !== undefined && code !== null) {
    const map: Record<number, string> = {
      0: '☀️',
      1: '🌤️',
      2: '⛅',
      3: '☁️',
      45: '🌫️',
      48: '🌫️',
      51: '🌦️',
      53: '🌦️',
      55: '🌧️',
      56: '🌧️',
      57: '🌧️',
      61: '🌧️',
      63: '🌧️',
      65: '🌧️',
      66: '🌧️',
      67: '🌧️',
      71: '🌨️',
      73: '🌨️',
      75: '❄️',
      77: '❄️',
      80: '🌦️',
      81: '🌧️',
      82: '⛈️',
      85: '🌨️',
      86: '🌨️',
      95: '⛈️',
      96: '⛈️',
      99: '⛈️',
    }
    return map[code] ?? '🌤️'
  }
  const map: Record<string, string> = {
    clear: '☀️',
    partly_cloudy: '🌤️',
    cloudy: '⛅',
    overcast: '☁️',
    fog: '🌫️',
    drizzle: '🌦️',
    rain: '🌧️',
    heavy_rain: '🌧️',
    snow: '❄️',
    thunderstorm: '⛈️',
    windy: '💨',
    unknown: '🌤️',
  }
  return map[condition] ?? '🌤️'
}
