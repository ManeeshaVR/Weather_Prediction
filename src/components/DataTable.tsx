import React from 'react';
import { WeatherData } from '../lib/weatherApi';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface DataTableProps {
  historicalData: WeatherData[];
  predictedTemp: number;
  unit: 'C' | 'F';
  convertTemp: (temp: number) => number;
}

export function DataTable({ historicalData, predictedTemp, unit, convertTemp }: DataTableProps) {
  const getTrendIcon = (current: number, previous: number) => {
    const diff = current - previous;
    if (diff > 0.5) return <TrendingUp className="size-4 text-red-500" />;
    if (diff < -0.5) return <TrendingDown className="size-4 text-blue-500" />;
    return <Minus className="size-4 text-gray-400" />;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg overflow-hidden border border-gray-100">
      <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-200">
        <h3 className="font-semibold">Historical Data & Prediction</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Min Temperature
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Trend
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {historicalData.map((data, index) => {
              const temp = convertTemp(data.minTemp);
              const prevTemp = index > 0 ? convertTemp(historicalData[index - 1].minTemp) : temp;
              
              return (
                <tr key={data.date} className="hover:bg-blue-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(data.date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {temp.toFixed(1)}°{unit}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {index > 0 && getTrendIcon(temp, prevTemp)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-3 py-1 text-xs rounded-full bg-blue-100 text-blue-700 font-medium">
                      Historical
                    </span>
                  </td>
                </tr>
              );
            })}
            <tr className="bg-gradient-to-r from-red-50 to-pink-50 hover:from-red-100 hover:to-pink-100 transition-colors">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                {getTomorrowDate()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-red-600">
                {convertTemp(predictedTemp).toFixed(1)}°{unit}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {getTrendIcon(
                  convertTemp(predictedTemp),
                  convertTemp(historicalData[historicalData.length - 1].minTemp)
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="px-3 py-1 text-xs rounded-full bg-red-200 text-red-800 font-bold">
                  Predicted
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}