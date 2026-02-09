# Weather Prediction Application

A full-stack weather prediction system that predicts the **next-day minimum temperature** using the **last 14 complete days** of weather data and a trained **RandomForest regression model**.

The application provides:
- City search and map-based location selection
- Historical weather visualization
- Backend-driven machine learning predictions
- Model reliability indicators (stability & uncertainty)

---

## Technology Stack

### Frontend
- React + TypeScript
- Vite
- Leaflet (interactive map)
- Tailwind CSS (UI styling)

### Backend
- FastAPI (Python)
- scikit-learn (RandomForestRegressor)
- Open-Meteo Archive API (historical weather data)
- OpenStreetMap Nominatim (reverse geocoding)

---

## Project Structure

project-root/
│
├── api-backend/
│ ├── main.py
│ ├── requirements.txt
│ └── RandomForest.pkl
│
├── src/
│ ├── components/
│ ├── lib/
│ ├── App.tsx
│ └── main.tsx
│
├── vite.config.ts
├── package.json
└── README.md

---

## Machine Learning Model Overview

### Prediction Goal
Predict the **minimum temperature for the next day**.

### Input Window
The model uses a **sliding window of 14 complete days**.

### Daily Features (per day)
1. Minimum Temperature (°F)
2. Maximum Temperature (°F)
3. Precipitation (sum)
4. Snowfall (sum)
5. Snow Depth (max)

**Total features:**  
14 days × 5 features = **70 features**

---

## Why the Model Uses Data Until Yesterday

Daily weather values for *today* are often **incomplete** until the day ends.  
To ensure consistent and reliable inputs:

- The backend always uses **14 fully completed days**
- The window ends at **yesterday**
- This matches the structure of the training dataset and prevents unstable predictions

---

## Installation & Startup Guide

### Prerequisites
- Node.js 18+
- Python 3.10+
- Git

---

## Backend Setup (FastAPI)

```bash

cd api-backend

# Create a virtual environment
python -m venv .venv

* Windows
.venv\Scripts\activate

* MacOS / Linux
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the backend server
uvicorn main:app --reload --port 8000

```

---

## Frontend Setup (React)

```bash

npm install

npm run dev

```

---

## Relevant Links

1. GitHub Repository Link - https://github.com/ManeeshaVR/Weather_Prediction
2. Kaggle Competition - https://www.kaggle.com/competitions/weather-prediction-2025
3. Notebook - https://colab.research.google.com/drive/1Nvhn_y8MFMmKppwsxelq-HSUFhlV02DD?usp=sharing