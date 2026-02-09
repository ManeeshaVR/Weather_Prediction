from __future__ import annotations

from datetime import date, datetime, timedelta
from typing import List, Optional

import joblib
import numpy as np
import requests
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field


# Weather Temperature Prediction API (RandomForest)

app = FastAPI(title="Weather Temperature Prediction API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)



# Load Model

MODEL_PATH = "RandomForest.pkl"

try:
    model = joblib.load(MODEL_PATH)
except Exception as e:
    raise RuntimeError(f"Failed to load model at {MODEL_PATH}: {e}") from e



# Request / Response schemas

class PredictionRequest(BaseModel):
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    locationName: Optional[str] = None


class WeatherData(BaseModel):
    date: str
    minTemp: float


class PredictionResponse(BaseModel):
    success: bool
    location: dict
    historicalData: List[WeatherData]
    prediction: dict
    error: Optional[str] = None



# Helpers

def c_to_f(c: float) -> float:
    return (c * 9.0 / 5.0) + 32.0


def f_to_c(f: float) -> float:
    return (f - 32.0) * 5.0 / 9.0


def reverse_geocode(lat: float, lon: float) -> str:
    """Best-effort reverse geocode via Nominatim."""
    try:
        r = requests.get(
            "https://nominatim.openstreetmap.org/reverse",
            params={"lat": lat, "lon": lon, "format": "json"},
            headers={"User-Agent": "WeatherPredictionApp"},
            timeout=8,
        )
        if r.status_code == 200:
            data = r.json()
            address = data.get("address", {})
            return ", ".join(
                filter(
                    None,
                    [
                        address.get("city"),
                        address.get("town"),
                        address.get("village"),
                        address.get("state"),
                        address.get("country"),
                    ],
                )
            ) or data.get("display_name") or f"{lat:.2f}, {lon:.2f}"
    except Exception:
        pass
    return f"{lat:.2f}, {lon:.2f}"


def _fetch_open_meteo_daily(lat: float, lon: float, start: date, end: date) -> dict:
    """Fetch daily series from Open-Meteo archive."""
    url = "https://archive-api.open-meteo.com/v1/archive"
    params = {
        "latitude": lat,
        "longitude": lon,
        "start_date": start.isoformat(),
        "end_date": end.isoformat(),
        # Daily variables (5 columns)
        "daily": ",".join(
            [
                "temperature_2m_min",
                "temperature_2m_max",
                "precipitation_sum",
                "snowfall_sum",
                "snow_depth_max",
            ]
        ),
        "timezone": "auto",
        "temperature_unit": "celsius",
    }

    r = requests.get(url, params=params, timeout=15)
    if r.status_code != 200:
        raise HTTPException(status_code=502, detail="Weather API failed (Open-Meteo)")
    data = r.json()
    if "daily" not in data or "time" not in data["daily"]:
        raise HTTPException(status_code=500, detail="Invalid weather data from Open-Meteo")
    return data


def _ensure_snow_depth(data: dict, lat: float, lon: float, start: date, end: date) -> List[float]:
    """If daily snow_depth_max is missing, compute daily max from hourly snow_depth."""
    daily = data.get("daily", {})
    snow_depth = daily.get("snow_depth_max")
    if snow_depth and all(v is not None for v in snow_depth):
        return snow_depth

    # Fallback
    url = "https://archive-api.open-meteo.com/v1/archive"
    params = {
        "latitude": lat,
        "longitude": lon,
        "start_date": start.isoformat(),
        "end_date": end.isoformat(),
        "hourly": "snow_depth",
        "timezone": "auto",
    }
    r = requests.get(url, params=params, timeout=15)
    if r.status_code != 200:
        return [0.0] * len(daily.get("time", []))

    j = r.json()
    times = j.get("hourly", {}).get("time", [])
    vals = j.get("hourly", {}).get("snow_depth", [])
    if not times or not vals or len(times) != len(vals):
        return [0.0] * len(daily.get("time", []))

    by_day = {}
    for t, v in zip(times, vals):
        day = t.split("T")[0]
        if v is None:
            continue
        by_day.setdefault(day, []).append(v)

    out = []
    for day in daily.get("time", []):
        day_vals = by_day.get(day, [])
        out.append(float(max(day_vals)) if day_vals else 0.0)
    return out


def fetch_last_14_days(lat: float, lon: float) -> tuple[list[str], np.ndarray, list[WeatherData]]:
    """
    Returns:
      - dates (len=14)
      - X (shape=(1, 70)) features in the column order
      - historicalData (min temp in Celsius)
    """
    # use complete days ending yesterday
    end = date.today() - timedelta(days=1)
    start = end - timedelta(days=13)

    data = _fetch_open_meteo_daily(lat, lon, start, end)
    daily = data["daily"]

    times = daily.get("time", [])
    tmin_c = daily.get("temperature_2m_min", [])
    tmax_c = daily.get("temperature_2m_max", [])
    precip = daily.get("precipitation_sum", [])
    snow = daily.get("snowfall_sum", [])
    snow_depth = _ensure_snow_depth(data, lat, lon, start, end)

    if not (len(times) == len(tmin_c) == len(tmax_c) == len(precip) == len(snow) == len(snow_depth)):
        raise HTTPException(status_code=500, detail="Mismatched daily series lengths from Open-Meteo")

    if len(times) < 14:
        raise HTTPException(status_code=400, detail="Insufficient historical data (need 14 days)")

    # Keep the last 14 days
    times = times[-14:]
    tmin_c = tmin_c[-14:]
    tmax_c = tmax_c[-14:]
    precip = precip[-14:]
    snow = snow[-14:]
    snow_depth = snow_depth[-14:]

    # Model trained on Fahrenheit for temperatures (convert temps C -> F before prediction)
    tmin_f = [c_to_f(float(v)) for v in tmin_c]
    tmax_f = [c_to_f(float(v)) for v in tmax_c]

    # [MinTemp(F), MaxTemp(F), Precipitation, Snow, SnowDepth]
    rows = []
    historical_ui = []
    for d, mn_c, mn_f, mx_f, p, s, sd in zip(times, tmin_c, tmin_f, tmax_f, precip, snow, snow_depth):
        p = 0.0 if p is None else float(p)
        s = 0.0 if s is None else float(s)
        sd = 0.0 if sd is None else float(sd)
        rows.append([mn_f, mx_f, p, s, sd])

        historical_ui.append(WeatherData(date=d, minTemp=float(mn_c)))

    X = np.array(rows, dtype=float).flatten().reshape(1, -1)
    return times, X, historical_ui


def predict_next_min_temp_c(X: np.ndarray) -> float:
    """Predicts next-day min temp (returns Celsius for UI)."""
    try:
        pred_f = float(model.predict(X)[0])
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Model prediction failed: {e}") from e

    return float(f_to_c(pred_f))



# Endpoint

@app.post("/predict", response_model=PredictionResponse)
def predict_temperature(req: PredictionRequest):
    dates, X, historical_ui = fetch_last_14_days(req.latitude, req.longitude)

    # Prediction date = day after the last historical day
    last_day = datetime.strptime(dates[-1], "%Y-%m-%d").date()
    prediction_day = last_day + timedelta(days=1)

    pred_c = predict_next_min_temp_c(X)
    pred_f = c_to_f(pred_c)

    # Model Confidence (RandomForest tree variance)
    tree_preds = np.array([tree.predict(X)[0] for tree in model.estimators_])

    mean_pred = float(np.mean(tree_preds))
    std_pred = float(np.std(tree_preds))

    relative_std = std_pred / (abs(mean_pred) + 1e-6)
    confidence_percent = round((1 - relative_std) * 100, 2)
    confidence_percent = max(0.0, min(100.0, confidence_percent))

    location_name = req.locationName or reverse_geocode(req.latitude, req.longitude)

    return {
        "success": True,
        "location": {
            "name": location_name,
            "latitude": req.latitude,
            "longitude": req.longitude,
        },
        "historicalData": historical_ui,
        "prediction": {
            "date": prediction_day.isoformat(),
            "temperatureC": round(pred_c, 1),
            "temperatureF": round(pred_f, 1),
            "confidence": confidence_percent,
            "model": "RandomForest",
        },
    }