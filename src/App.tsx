import React, { useState } from 'react';
import { WeatherMap } from './components/WeatherMap';
import { TemperatureChart } from './components/TemperatureChart';
import { DataTable } from './components/DataTable';
import { PredictionCard } from './components/PredictionCard';
import { MetricsCard } from './components/MetricsCard';
import { GoogleAuth, UserProfile } from './components/GoogleAuth';
import { celsiusToFahrenheit, WeatherData, fetchBackendPrediction } from './lib/weatherApi';
import { preprocessData, calculateMetrics } from './lib/prediction';
import { MapPin, Loader2, AlertCircle, Thermometer } from 'lucide-react';

interface LocationData {
  lat: number;
  lon: number;
  name: string;
}

interface PredictionData {
  historicalData: WeatherData[];
  predictedTemp: number;
  confidence: number;
  method: string;
  metrics: ReturnType<typeof calculateMetrics>;
}

export default function App() {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [predictionData, setPredictionData] = useState<PredictionData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unit, setUnit] = useState<'C' | 'F'>('C');
  const [user, setUser] = useState<UserProfile | null>(null);

  const handleLocationSelect = async (lat: number, lon: number, locationName: string) => {
    setLocation({ lat, lon, name: locationName });
    setError(null);
    setLoading(true);
    setPredictionData(null);

    try {
      // Call Python backend (FastAPI)
      const backend = await fetchBackendPrediction(lat, lon, locationName);

      const processedData = preprocessData(backend.historicalData);

      if (processedData.length < 3) {
        throw new Error('Insufficient historical data available for this location');
      }

      const metrics = calculateMetrics(processedData);

      setPredictionData({
        historicalData: processedData,
        predictedTemp: backend.prediction.temperatureC,
        confidence: backend.prediction.confidence,
        method: backend.prediction.model,
        metrics,
      });
    } catch (err: any) {
      console.error('Error:', err);
      setError(err.message || 'Failed to fetch weather data. Please try another location.');
    } finally {
      setLoading(false);
    }
  };

  const convertTemp = (tempC: number) => {
    return unit === 'C' ? tempC : celsiusToFahrenheit(tempC);
  };

  const toggleUnit = () => {
    setUnit(prev => prev === 'C' ? 'F' : 'C');
  };

  return (
      <div className="h-screen w-full flex flex-col bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        {/* Header */}
        <header className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 shadow-xl px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-2.5 shadow-lg">
                <Thermometer className="size-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Weather Forecast AI</h1>
                <p className="text-sm text-blue-100">Advanced time-series temperature prediction</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                  onClick={toggleUnit}
                  className="px-5 py-2.5 bg-white/20 hover:bg-white/30 text-white rounded-lg font-medium transition-all backdrop-blur-sm shadow-lg"
              >
                °{unit} → °{unit === 'C' ? 'F' : 'C'}
              </button>
              <GoogleAuth onAuthChange={setUser} />
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Map Section */}
          <div className="w-1/2 p-6">
            <div className="h-full bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
              <WeatherMap onLocationSelect={handleLocationSelect} />
            </div>
          </div>

          {/* Results Section */}
          <div className="w-1/2 p-6 overflow-y-auto">
            {!location && !loading && (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="bg-gradient-to-br from-blue-100 to-purple-100 rounded-full p-8 mx-auto w-32 h-32 flex items-center justify-center mb-6">
                      <MapPin className="size-16 text-blue-600" />
                    </div>
                    <p className="text-2xl font-semibold text-gray-800 mb-2">Select a location</p>
                    <p className="text-gray-500">Click anywhere on the map or search for a city</p>
                  </div>
                </div>
            )}

            {loading && (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="bg-gradient-to-br from-blue-500 to-purple-500 rounded-full p-8 mx-auto w-32 h-32 flex items-center justify-center mb-6 shadow-2xl">
                      <Loader2 className="size-16 text-white animate-spin" />
                    </div>
                    <p className="text-xl font-semibold text-gray-800 mb-2">Fetching weather data...</p>
                    <p className="text-gray-500">Analyzing historical patterns</p>
                  </div>
                </div>
            )}

            {error && (
                <div className="bg-gradient-to-br from-red-50 to-pink-50 border-2 border-red-200 rounded-2xl p-6 shadow-lg">
                  <div className="flex items-start gap-3">
                    <div className="bg-red-100 rounded-full p-2">
                      <AlertCircle className="size-6 text-red-600 flex-shrink-0" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-red-900 mb-1">Error</h3>
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  </div>
                </div>
            )}

            {predictionData && location && !loading && (
                <div className="space-y-5">
                  {/* Location Info */}
                  <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-5 shadow-lg border border-gray-100">
                    <div className="flex items-start gap-3">
                      <div className="bg-blue-100 rounded-full p-2">
                        <MapPin className="size-5 text-blue-600 flex-shrink-0" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 truncate">{location.name}</p>
                        <p className="text-sm text-gray-500">
                          {location.lat.toFixed(4)}°, {location.lon.toFixed(4)}°
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Prediction Card */}
                  <PredictionCard
                      predictedTemp={predictionData.predictedTemp}
                      confidence={predictionData.confidence}
                      method={predictionData.method}
                      unit={unit}
                      convertTemp={convertTemp}
                      lastTemp={predictionData.historicalData[predictionData.historicalData.length - 1].minTemp}
                  />

                  {/* Metrics */}
                  <MetricsCard
                      metrics={predictionData.metrics}
                      unit={unit}
                      convertTemp={convertTemp}
                  />

                  {/* Chart */}
                  <TemperatureChart
                      historicalData={predictionData.historicalData}
                      predictedTemp={predictionData.predictedTemp}
                      unit={unit}
                      convertTemp={convertTemp}
                  />

                  {/* Data Table */}
                  <DataTable
                      historicalData={predictionData.historicalData}
                      predictedTemp={predictionData.predictedTemp}
                      unit={unit}
                      convertTemp={convertTemp}
                  />
                </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 px-6 py-4 shadow-lg">
          <p className="text-xs text-gray-500 text-center">
            Weather data from Open-Meteo API • Geocoding by OpenStreetMap Nominatim
          </p>
        </footer>
      </div>
  );
}