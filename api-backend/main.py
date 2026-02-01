from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import requests
import numpy as np
from datetime import date, timedelta
import joblib

app = FastAPI(title="Weather Temperature Prediction API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load the model globally
model_data = joblib.load('random_forest_weather_model.pkl')
model = model_data["model"]

class PredictionRequest(BaseModel):
    latitude: float
    longitude: float
    locationName: Optional[str] = None


class WeatherData(BaseModel):
    date: str
    temperature: float


class PredictionResponse(BaseModel):
    success: bool
    location: dict
    historicalData: List[WeatherData]
    prediction: dict
    error: Optional[str] = None


# -----------------------------
# Helper Functions
# -----------------------------
def fetch_historical_weather(lat: float, lon: float) -> List[WeatherData]:
    end_date = date.today()
    start_date = end_date - timedelta(days=13)

    url = (
        "https://archive-api.open-meteo.com/v1/archive?"
        f"latitude={lat}&longitude={lon}"
        f"&start_date={start_date}&end_date={end_date}"
        "&daily=temperature_2m_min&timezone=auto"
    )

    r = requests.get(url, timeout=10)
    if r.status_code != 200:
        raise HTTPException(status_code=502, detail="Weather API failed")

    data = r.json()

    if "daily" not in data:
        raise HTTPException(status_code=500, detail="Invalid weather data")

    weather = []
    for i in range(len(data["daily"]["time"])):
        weather.append(
            WeatherData(
                date=data["daily"]["time"][i],
                temperature=data["daily"]["temperature_2m_min"][i],
            )
        )

    return weather


def reverse_geocode(lat: float, lon: float) -> str:
    try:
        url = f"https://nominatim.openstreetmap.org/reverse"
        r = requests.get(
            url,
            params={"lat": lat, "lon": lon, "format": "json"},
            headers={"User-Agent": "WeatherPredictionApp"},
            timeout=5,
        )
        if r.status_code == 200:
            data = r.json()
            address = data.get("address", {})
            return ", ".join(
                filter(None, [
                    address.get("city"),
                    address.get("town"),
                    address.get("village"),
                    address.get("country"),
                ])
            )
    except Exception:
        pass

    return f"{lat:.2f}, {lon:.2f}"

def model_predict(data: List[WeatherData]) -> float:
    temperatures = np.array([d.temperature for d in data]).reshape(1, -1)
    prediction = model.predict(temperatures)
    return prediction[0]


# -----------------------------
# API Endpoint
# -----------------------------
@app.post("/predict", response_model=PredictionResponse)
def predict_temperature(req: PredictionRequest):
    if not (-90 <= req.latitude <= 90 and -180 <= req.longitude <= 180):
        raise HTTPException(status_code=400, detail="Invalid coordinates")

    historical = fetch_historical_weather(req.latitude, req.longitude)

    if len(historical) < 14:
        raise HTTPException(status_code=400, detail="Insufficient historical data")

    prediction = model_predict(historical)
    original = np.array([d.temperature for d in historical])


    tomorrow = date.today() + timedelta(days=1)
    location_name = req.locationName or reverse_geocode(req.latitude, req.longitude)

    recent = original[-7:]
    confidence = max(0.7, min(0.95, 1 - (recent.std() / 10)))

    return {
        "success": True,
        "location": {
            "name": location_name,
            "latitude": req.latitude,
            "longitude": req.longitude,
        },
        "historicalData": historical,
        "prediction": {
            "date": tomorrow.isoformat(),
            "temperature": round(float(prediction), 1),
            "confidence": round(confidence, 2),
        }
    }