import { getWeatherEmoji } from './getWeatherEmoji';

describe('getWeatherEmoji', () => {
  const mockWeatherApi = {
    getCurrent: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return sun emoji for sunny weather', async () => {
    mockWeatherApi.getCurrent.mockResolvedValue({ condition: 'sunny' });
    const result = await getWeatherEmoji(
      { location: 'Austin, TX' },
      { weatherApi: mockWeatherApi }
    );
    expect(result.emoji).toBe('☀️');
  });

  it('should return cloud emoji for cloudy weather', async () => {
    mockWeatherApi.getCurrent.mockResolvedValue({ condition: 'cloudy' });
    const result = await getWeatherEmoji(
      { location: 'Seattle, WA' },
      { weatherApi: mockWeatherApi }
    );
    expect(result.emoji).toBe('☁️');
  });

  it('should return rain emoji for rainy weather', async () => {
    mockWeatherApi.getCurrent.mockResolvedValue({ condition: 'rainy' });
    const result = await getWeatherEmoji(
      { location: 'London, UK' },
      { weatherApi: mockWeatherApi }
    );
    expect(result.emoji).toBe('🌧️');
  });

  it('should return snow emoji for snowy weather', async () => {
    mockWeatherApi.getCurrent.mockResolvedValue({ condition: 'snowy' });
    const result = await getWeatherEmoji(
      { location: 'Denver, CO' },
      { weatherApi: mockWeatherApi }
    );
    expect(result.emoji).toBe('❄️');
  });

  it('should return storm emoji for stormy weather', async () => {
    mockWeatherApi.getCurrent.mockResolvedValue({ condition: 'stormy' });
    const result = await getWeatherEmoji(
      { location: 'Miami, FL' },
      { weatherApi: mockWeatherApi }
    );
    expect(result.emoji).toBe('⛈️');
  });

  it('should return thermometer emoji for unknown conditions', async () => {
    mockWeatherApi.getCurrent.mockResolvedValue({ condition: 'foggy' });
    const result = await getWeatherEmoji(
      { location: 'San Francisco, CA' },
      { weatherApi: mockWeatherApi }
    );
    expect(result.emoji).toBe('🌡️');
  });
});
