import React from 'react';
import { Activity, TrendingUp, BarChart3, Database } from 'lucide-react';

interface MetricsCardProps {
  metrics: {
    mean: number;
    stdDev: number;
    min: number;
    max: number;
    trend: number;
    dataPoints: number;
  };
  unit: 'C' | 'F';
  convertTemp: (temp: number) => number;
}

export function MetricsCard({ metrics, unit, convertTemp }: MetricsCardProps) {
  return (
    <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-6 shadow-lg border border-gray-100">
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        <BarChart3 className="size-5 text-blue-600" />
        Statistical Metrics
      </h3>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1 bg-blue-50 rounded-xl p-3">
          <div className="flex items-center gap-2 text-gray-600 text-sm">
            <Activity className="size-4" />
            <span>Mean</span>
          </div>
          <p className="text-2xl font-semibold text-blue-600">
            {convertTemp(metrics.mean).toFixed(1)}°{unit}
          </p>
        </div>

        <div className="space-y-1 bg-purple-50 rounded-xl p-3">
          <div className="flex items-center gap-2 text-gray-600 text-sm">
            <Activity className="size-4" />
            <span>Std Dev</span>
          </div>
          <p className="text-2xl font-semibold text-purple-600">
            {(metrics.stdDev * (unit === 'F' ? 1.8 : 1)).toFixed(1)}°{unit}
          </p>
        </div>

        <div className="space-y-1 bg-cyan-50 rounded-xl p-3">
          <p className="text-gray-600 text-sm">Min</p>
          <p className="text-xl font-semibold text-cyan-600">
            {convertTemp(metrics.min).toFixed(1)}°{unit}
          </p>
        </div>

        <div className="space-y-1 bg-red-50 rounded-xl p-3">
          <p className="text-gray-600 text-sm">Max</p>
          <p className="text-xl font-semibold text-red-600">
            {convertTemp(metrics.max).toFixed(1)}°{unit}
          </p>
        </div>

        <div className="space-y-1 bg-green-50 rounded-xl p-3">
          <div className="flex items-center gap-2 text-gray-600 text-sm">
            <TrendingUp className="size-4" />
            <span>Daily Trend</span>
          </div>
          <p className="text-xl font-semibold text-green-600">
            {metrics.trend > 0 ? '+' : ''}{(metrics.trend * (unit === 'F' ? 1.8 : 1)).toFixed(2)}°{unit}
          </p>
        </div>

        <div className="space-y-1 bg-indigo-50 rounded-xl p-3">
          <div className="flex items-center gap-2 text-gray-600 text-sm">
            <Database className="size-4" />
            <span>Data Points</span>
          </div>
          <p className="text-xl font-semibold text-indigo-600">{metrics.dataPoints}</p>
        </div>
      </div>
    </div>
  );
}