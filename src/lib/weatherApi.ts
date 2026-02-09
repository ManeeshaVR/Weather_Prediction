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
    // Calculate date range
    const endDate = new Date();
    endDate.setDate(endDate.getDate() - 1);
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - (days - 1));

    const formatDate = (date: Date) => {
      return date.toISOString().split('T')[0];
    };

    const start = formatDate(startDate);
    const end = formatDate(endDate);

    // Open-Meteo Historical Weather API
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

export interface BackendPredictionResponse {
  success: boolean;
  location: {
    name: string;
    latitude: number;
    longitude: number;
  };
  historicalData: WeatherData[];
  prediction: {
    date: string;
    temperatureC: number;
    temperatureF: number;
    confidence: number;
    model: string;
  };
  error?: string | null;
}

/**
 * Call the Python FastAPI backend to fetch historical data and predict next-day minimum temperature.
 */
export async function fetchBackendPrediction(
    lat: number,
    lon: number,
    locationName?: string
): Promise<BackendPredictionResponse> {
  const response = await fetch("/api/predict", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ latitude: lat, longitude: lon, locationName }),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const msg = data?.detail || data?.error || `Backend error: ${response.status}`;
    throw new Error(msg);
  }

  if (!data?.success) {
    throw new Error(data?.error || "Prediction failed");
  }

  return data as BackendPredictionResponse;
}