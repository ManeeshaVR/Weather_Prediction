import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { WeatherData } from '../lib/weatherApi';

interface TemperatureChartProps {
  historicalData: WeatherData[];
  predictedTemp: number;
  unit: 'C' | 'F';
  convertTemp: (temp: number) => number;
}

export function TemperatureChart({ historicalData, predictedTemp, unit, convertTemp }: TemperatureChartProps) {
  // Prepare chart data
  const chartData = [
    ...historicalData.map(d => ({
      date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      temperature: convertTemp(d.minTemp),
      type: 'historical',
    })),
    {
      date: 'Tomorrow',
      temperature: convertTemp(predictedTemp),
      type: 'predicted',
    },
  ];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white px-4 py-2 rounded-lg shadow-lg border border-gray-200">
          <p className="font-semibold">{data.date}</p>
          <p className="text-blue-600">
            {data.temperature.toFixed(1)}°{unit}
          </p>
          {data.type === 'predicted' && (
            <p className="text-xs text-gray-500 mt-1">Predicted</p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-6 shadow-lg border border-gray-100">
      <h3 className="font-semibold mb-4">Temperature Trend</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 12, fill: '#6b7280' }}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis 
            tick={{ fontSize: 12, fill: '#6b7280' }}
            label={{ value: `Temperature (°${unit})`, angle: -90, position: 'insideLeft', style: { fill: '#6b7280' } }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Line
            type="monotone"
            dataKey="temperature"
            stroke="url(#colorGradient)"
            strokeWidth={3}
            dot={(props: any) => {
              const { cx, cy, payload } = props;
              if (payload.type === 'predicted') {
                return (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={7}
                    fill="#ef4444"
                    stroke="#fff"
                    strokeWidth={3}
                  />
                );
              }
              return (
                <circle
                  cx={cx}
                  cy={cy}
                  r={5}
                  fill="#3b82f6"
                  stroke="#fff"
                  strokeWidth={2}
                />
              );
            }}
            name="Min Temperature"
          />
          <defs>
            <linearGradient id="colorGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
          </defs>
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}