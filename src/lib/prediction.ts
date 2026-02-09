import { WeatherData } from './weatherApi';

/**
 * Simple Moving Average
 */
function simpleMovingAverage(data: number[], window: number): number {
    const slice = data.slice(-window);
    return slice.reduce((sum, val) => sum + val, 0) / slice.length;
}

/**
 * Calculate trend (difference between recent and older values)
 */
function calculateTrend(data: number[]): number {
    if (data.length < 7) return 0;

    const recentAvg = simpleMovingAverage(data, 3);
    const olderAvg = simpleMovingAverage(data.slice(0, -3), Math.min(7, data.length - 3));

    return (recentAvg - olderAvg) / 7;
}

/**
 * Preprocess data - handle missing values and outliers
 */
export function preprocessData(data: WeatherData[]): WeatherData[] {
    if (data.length === 0) return data;

    // Remove null/undefined values
    const validData = data.filter(d => d.minTemp !== null && d.minTemp !== undefined);

    if (validData.length < data.length) {
        console.warn(`Removed ${data.length - validData.length} invalid data points`);
    }

    // Detect and handle outliers
    const temps = validData.map(d => d.minTemp);
    const mean = temps.reduce((a, b) => a + b, 0) / temps.length;
    const stdDev = Math.sqrt(
        temps.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / temps.length
    );

    const processedData = validData.map(d => {
        const zScore = Math.abs((d.minTemp - mean) / stdDev);

        // If outlier (z-score > 3), replace with mean
        if (zScore > 3) {
            console.warn(`Outlier detected at ${d.date}: ${d.minTemp}°C (z-score: ${zScore.toFixed(2)})`);
            return { ...d, minTemp: mean };
        }

        return d;
    });

    return processedData;
}

/**
 * Calculate model metrics for transparency
 */
export function calculateMetrics(historicalData: WeatherData[]) {
    const temps = historicalData.map(d => d.minTemp);

    const mean = temps.reduce((a, b) => a + b, 0) / temps.length;
    const variance = temps.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / temps.length;
    const stdDev = Math.sqrt(variance);

    const min = Math.min(...temps);
    const max = Math.max(...temps);

    const trend = calculateTrend(temps);

    return {
        mean: Math.round(mean * 10) / 10,
        stdDev: Math.round(stdDev * 10) / 10,
        min: Math.round(min * 10) / 10,
        max: Math.round(max * 10) / 10,
        trend: Math.round(trend * 100) / 100,
        dataPoints: temps.length,
    };
}