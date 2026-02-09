import React from 'react';
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle } from 'lucide-react';

interface PredictionCardProps {
  predictedTemp: number;
  confidence: number;
  method: string;
  unit: 'C' | 'F';
  convertTemp: (temp: number) => number;
  lastTemp: number;
}

export function PredictionCard({
  predictedTemp,
  confidence,
  method,
  unit,
  convertTemp,
  lastTemp
}: PredictionCardProps) {
  const predicted = convertTemp(predictedTemp);
  const last = convertTemp(lastTemp);
  const change = predicted - last;
  const changePercent = ((change / last) * 100);

  return (
    <div className="bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 rounded-2xl p-6 shadow-2xl text-white">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-blue-100 text-sm font-medium">Tomorrow's Prediction</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-5xl font-bold">{predicted.toFixed(1)}</span>
            <span className="text-2xl">°{unit}</span>
          </div>
        </div>
        {confidence >= 70 ? (
          <CheckCircle className="size-8 text-green-300" />
        ) : (
          <AlertCircle className="size-8 text-yellow-300" />
        )}
      </div>

      <div className="flex items-center gap-2 mb-4">
        {change > 0 ? (
          <TrendingUp className="size-5 text-red-300" />
        ) : (
          <TrendingDown className="size-5 text-blue-300" />
        )}
        <span className="text-sm">
          {change > 0 ? '+' : ''}{change.toFixed(1)}°{unit} ({changePercent > 0 ? '+' : ''}{changePercent.toFixed(1)}%) from today
        </span>
      </div>

      <div className="space-y-2 border-t border-white/20 pt-4">
        <div className="flex justify-between text-sm">
          <span className="text-blue-100">Confidence</span>
          <span className="font-semibold">{confidence}%</span>
        </div>
        <div className="w-full bg-white/20 rounded-full h-2.5 overflow-hidden backdrop-blur-sm">
          <div
            className="bg-gradient-to-r from-green-300 to-green-400 rounded-full h-2.5 transition-all duration-500 shadow-lg"
            style={{ width: `${confidence}%` }}
          />
        </div>
      </div>
    </div>
  );
}