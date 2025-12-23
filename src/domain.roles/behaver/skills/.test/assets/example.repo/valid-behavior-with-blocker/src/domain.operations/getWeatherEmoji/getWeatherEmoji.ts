/**
 * .what = fetches an emoji that represents the current weather
 * .why = provides visual weather indicator for UI
 */

interface WeatherApi {
  getCurrent: (input: { location: string }) => Promise<{ condition: string }>;
}

export const getWeatherEmoji = async (
  input: { location: string },
  context: { weatherApi: WeatherApi }
): Promise<{ emoji: string }> => {
  // fetch weather data
  const weather = await context.weatherApi.getCurrent({ location: input.location });

  // map condition to emoji
  const emoji = mapConditionToEmoji({ condition: weather.condition });

  return { emoji };
};

/**
 * .what = maps weather condition string to emoji
 * .why = centralizes condition-to-emoji logic
 */
const mapConditionToEmoji = ({ condition }: { condition: string }): string => {
  const map: Record<string, string> = {
    sunny: '☀️',
    cloudy: '☁️',
    rainy: '🌧️',
    // snowy: '❄️',  // INTENTIONAL DEFECT: missing snowy condition per criteria
    stormy: '⛈️',
  };
  return map[condition] ?? '🌡️';
};
