export interface WeatherData {
  date: string;
  minTemp: number;
}

export interface WeatherResponse {
  historicalData: WeatherData[];
  latitude: number;
  longitude: number;
}

/**
 * Fetch historical minimum temperature data from Open-Meteo API
 * @param lat Latitude
 * @param lon Longitude
 * @param days Number of days to fetch (default: 14)
 * @returns Historical weather data
 */
export async function fetchHistoricalWeather(
  lat: number,
  lon: number,
  days: number = 14
): Promise<WeatherResponse> {
  try {
    // Calculate date range (last N days)
    const endDate = new Date();
    endDate.setDate(endDate.getDate() - 1); // Yesterday
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - (days - 1));

    const formatDate = (date: Date) => {
      return date.toISOString().split('T')[0];
    };

    const start = formatDate(startDate);
    const end = formatDate(endDate);

    // Open-Meteo Historical Weather API (free, no auth required)
    const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&start_date=${start}&end_date=${end}&daily=temperature_2m_min&timezone=auto`;

    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.daily || !data.daily.time || !data.daily.temperature_2m_min) {
      throw new Error('Invalid response from weather API');
    }

    const historicalData: WeatherData[] = data.daily.time.map((date: string, index: number) => ({
      date,
      minTemp: data.daily.temperature_2m_min[index],
    }));

    return {
      historicalData,
      latitude: data.latitude,
      longitude: data.longitude,
    };
  } catch (error) {
    console.error('Error fetching weather data:', error);
    throw error;
  }
}

/**
 * Convert Celsius to Fahrenheit
 */
export function celsiusToFahrenheit(celsius: number): number {
  return (celsius * 9) / 5 + 32;
}

/**
 * Convert Fahrenheit to Celsius
 */
export function fahrenheitToCelsius(fahrenheit: number): number {
  return ((fahrenheit - 32) * 5) / 9;
}
