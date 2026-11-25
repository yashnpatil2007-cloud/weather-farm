"""Weather data service.

Integrates the free Open-Meteo API (no API key required). It is isolated behind
a single interface so another provider (or a paid API) can be swapped in later
without touching the rest of the application.

Failure/offline behaviour: when the live provider is unreachable and the
ALLOW_WEATHER_MOCK setting is enabled, a clearly-labelled "mock" snapshot is
returned so the prototype keeps working during a live demonstration. Callers can
inspect ``source`` to show "Weather information is temporarily unavailable."
"""
from __future__ import annotations

import math
import random
import time
from datetime import datetime, timedelta

import httpx

from ..core.config import get_settings

GEOCODE_URL = "https://geocoding-api.open-meteo.com/v1/search"
FORECAST_URL = "https://api.open-meteo.com/v1/forecast"

_cache: dict[str, dict] = {}


def today_str() -> str:
    return datetime.utcnow().strftime("%Y-%m-%d")


def _iso(dt: datetime) -> str:
    return dt.strftime("%Y-%m-%dT%H:%M")


def describe_wmo(code: int) -> str:
    """Translate a WMO weather code into plain farmer-friendly language."""
    map_ = {
        0: "Clear sky",
        1: "Mainly clear",
        2: "Partly cloudy",
        3: "Overcast",
        45: "Fog",
        48: "Icy fog",
        51: "Light drizzle",
        53: "Drizzle",
        55: "Heavy drizzle",
        56: "Freezing drizzle",
        57: "Freezing rain",
        61: "Light rain",
        63: "Moderate rain",
        65: "Heavy rain",
        66: "Freezing rain",
        67: "Heavy freezing rain",
        71: "Light snow",
        73: "Snow",
        75: "Heavy snow",
        77: "Snow grains",
        80: "Rain showers",
        81: "Moderate showers",
        82: "Violent showers",
        85: "Snow showers",
        86: "Heavy snow showers",
        95: "Thunderstorm",
        96: "Thunderstorm with hail",
        99: "Severe thunderstorm",
    }
    return map_.get(code, "Unknown conditions")


async def geocode(q: str) -> list[dict]:
    """Search for place coordinates. Returns [{name, latitude, longitude, country}]."""
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(GEOCODE_URL, params={"name": q, "count": 6, "language": "en", "format": "json"})
            resp.raise_for_status()
            body = resp.json()
    except Exception:
        return []

    results = []
    for r in body.get("results", []):
        results.append({
            "name": r.get("name", q),
            "latitude": r.get("latitude"),
            "longitude": r.get("longitude"),
            "country": r.get("country", ""),
            "admin1": r.get("admin1", ""),
        })
    return results


async def fetch_snapshot(lat: float, lon: float, location_label: str) -> dict:
    """Fetch current + forecast weather and return a WeatherSnapshot-shaped dict."""
    key = f"{lat:.4f},{lon:.4f}"
    settings = get_settings()
    hit = _cache.get(key)
    if hit and time.time() - hit["fetched"] < settings.weather_cache_seconds:
        return {**hit["data"], "location_label": location_label or hit["data"]["location_label"]}

    if settings.weather_provider == "none":
        snapshot = _build_mock(lat, lon, location_label)
        _cache[key] = {"fetched": time.time(), "data": snapshot}
        return snapshot

    try:
        data = await _fetch_open_meteo(lat, lon)
        snapshot = _build_snapshot(lat, lon, location_label, data, source="open-meteo")
        _cache[key] = {"fetched": time.time(), "data": snapshot}
        return snapshot
    except Exception:
        if not settings.allow_weather_mock:
            raise
        snapshot = _build_mock(lat, lon, location_label)
        _cache[key] = {"fetched": time.time(), "data": snapshot}
        return snapshot


async def _fetch_open_meteo(lat: float, lon: float) -> dict:
    params = {
        "latitude": lat,
        "longitude": lon,
        "current": "temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,wind_direction_10m,precipitation",
        "hourly": "temperature_2m,relative_humidity_2m,precipitation_probability,precipitation,wind_speed_10m",
        "daily": "weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max",
        "timezone": "auto",
        "forecast_days": 7,
    }
    async with httpx.AsyncClient(timeout=12) as client:
        resp = await client.get(FORECAST_URL, params=params)
        resp.raise_for_status()
        return resp.json()


def _build_snapshot(lat: float, lon: float, label: str, data: dict, source: str) -> dict:
    cur = data.get("current", {})
    hourly = data.get("hourly", {})
    daily = data.get("daily", {})

    times = hourly.get("time", [])
    temps = hourly.get("temperature_2m", [])
    hums = hourly.get("relative_humidity_2m", [])
    rain_prob = hourly.get("precipitation_probability", [])
    precip = hourly.get("precipitation", [])
    winds = hourly.get("wind_speed_10m", [])

    # Open-Meteo hourly series begins at 00:00 of the first forecast day; start from current hour.
    cur_time = cur.get("time")
    start_idx = 0
    if isinstance(cur_time, str) and times:
        cur_hour_prefix = cur_time[:13]
        for idx, t in enumerate(times):
            if t[:13] >= cur_hour_prefix:
                start_idx = idx
                break

    hourly_points = []
    for i in range(start_idx, min(start_idx + 24, len(times))):
        hourly_points.append({
            "time": times[i],
            "temperature": _round(temps[i] if i < len(temps) else None),
            "humidity": _round(hums[i] if i < len(hums) else None),
            "rain_probability": _round(rain_prob[i] if i < len(rain_prob) else None),
            "precipitation": _round(precip[i] if i < len(precip) else None),
            "wind_speed": _round(winds[i] if i < len(winds) else None),
        })

    # Expected rainfall over the next 12 hours = sum of hourly precipitation.
    next_12 = [p["precipitation"] for p in hourly_points[:12] if isinstance(p["precipitation"], (int, float))]
    expected_rainfall = round(sum(next_12), 1) if next_12 else None

    # Rain probability for the next 12 hours = max hourly probability.
    probs = [p["rain_probability"] for p in hourly_points[:12] if isinstance(p["rain_probability"], (int, float))]
    rain_probability = round(max(probs)) if probs else None

    daily_points = []
    for i in range(len(daily.get("time", []))):
        daily_points.append({
            "date": daily["time"][i],
            "weather_condition": describe_wmo(daily["weather_code"][i]),
            "weather_code": daily["weather_code"][i],
            "temp_max": _round(daily["temperature_2m_max"][i]),
            "temp_min": _round(daily["temperature_2m_min"][i]),
            "rain_probability": _round(daily["precipitation_probability_max"][i]),
            "precipitation": _round(daily["precipitation_sum"][i]),
            "wind_speed": _round(daily["wind_speed_10m_max"][i]),
        })

    return {
        "lat": lat,
        "lon": lon,
        "location_label": label or "Your location",
        "source": source,
        "fetched_at": datetime.utcnow().isoformat(),
        "current": {
            "temperature": _round(cur.get("temperature_2m")),
            "humidity": _round(cur.get("relative_humidity_2m")),
            "rain_probability": rain_probability if rain_probability is not None else 0,
            "expected_rainfall": expected_rainfall if expected_rainfall is not None else 0.0,
            "precipitation": _round(cur.get("precipitation")) or 0.0,
            "wind_speed": _round(cur.get("wind_speed_10m")) or 0.0,
            "wind_direction": _deg12(cur.get("wind_direction_10m")),
            "weather_condition": describe_wmo(cur.get("weather_code", 0)),
            "weather_code": cur.get("weather_code"),
        },
        "hourly": hourly_points,
        "daily": daily_points,
    }


def _build_mock(lat: float, lon: float, label: str) -> dict:
    """Deterministic gentle weather so demos never break offline.

    Hourly values are varied (diurnal curve + a couple of wet spells) so the
    forecast charts don't render as flat lines.
    """
    rng = random.Random(round(lat * 1000) + round(lon * 1000))
    base_temp = 14 + rng.uniform(4, 14)
    base_hum = min(95, max(30, 56 + rng.uniform(-8, 10)))
    base_wind = rng.uniform(4, 16)
    now = datetime.utcnow().replace(minute=0, second=0, microsecond=0)

    # A couple of "wet" hours so rainfall / rain probability actually fluctuate.
    wet_hours = sorted(rng.sample(range(24), rng.randint(2, 4)))
    wet_amount = {h: rng.choice([0.4, 0.6, 1.2, 2.5]) for h in wet_hours}

    hourly_points = []
    for i in range(24):
        t = now + timedelta(hours=i)
        day_temp = base_temp + math.sin((i - 8) * math.pi / 12) * 5
        # Humidity rises overnight and falls in the afternoon (inverse of temp).
        humidity = base_hum + math.sin((i - 14) * math.pi / 12) * 8 + rng.uniform(-2, 2)
        humidity = round(min(98, max(25, humidity)))
        rain_prob = 15.0
        precip = 0.0
        if i in wet_hours:
            rain_prob += rng.choice([30, 45])
            precip = wet_amount[i]
            day_temp -= 2.0
        wind = max(1.0, base_wind + rng.uniform(-3, 3))
        hourly_points.append({
            "time": _iso(t),
            "temperature": round(day_temp, 1),
            "humidity": humidity,
            "rain_probability": round(min(100.0, rain_prob + rng.uniform(-5, 5)), 1),
            "precipitation": round(precip, 1),
            "wind_speed": round(wind, 1),
        })

    daily_points = []
    for d in range(7):
        day = now + timedelta(days=d)
        jitter = rng.uniform(-1.5, 1.5)
        daily_points.append({
            "date": day.strftime("%Y-%m-%d"), "weather_condition": "Partly cloudy",
            "weather_code": 2,
            "temp_max": round(base_temp + 5 + jitter, 1),
            "temp_min": round(base_temp - 3 + jitter * 0.5, 1),
            "rain_probability": round(min(95.0, 20 + rng.uniform(-10, 30)), 1),
            "precipitation": round(max(0.0, 1.2 + rng.uniform(-1.0, 3.0)), 1),
            "wind_speed": round(max(1.0, base_wind + rng.uniform(-4, 4)), 1),
        })

    first = hourly_points[0]
    next_12 = hourly_points[:12]
    expected_rainfall = round(sum(p["precipitation"] for p in next_12), 1)
    rain_probability = round(max(p["rain_probability"] for p in next_12))

    return {
        "lat": lat, "lon": lon, "location_label": label or "Your location",
        "source": "mock", "fetched_at": datetime.utcnow().isoformat(),
        "current": {
            "temperature": first["temperature"], "humidity": first["humidity"],
            "rain_probability": rain_probability,
            "expected_rainfall": expected_rainfall,
            "precipitation": first["precipitation"],
            "wind_speed": first["wind_speed"], "wind_direction": "NE",
            "weather_condition": "Partly cloudy", "weather_code": 2,
        },
        "hourly": hourly_points, "daily": daily_points,
    }


# ---------------------------------------------------------------------------
# Demo scenarios (see README -> Demonstration Scenarios). These let the product
# be demonstrated deterministically with a live farm or without one.
# ---------------------------------------------------------------------------
DEMO_SCENARIOS: dict[str, dict] = {
    "1_high_rain": {
        "label": "High rainfall probability",
        "temperature": 26.0, "humidity": 82.0, "rain_probability": 84.0,
        "expected_rainfall": 40.0, "wind_speed": 12.0, "condition": "Moderate rain", "weather_code": 63,
    },
    "2_strong_wind": {
        "label": "Strong wind",
        "temperature": 22.0, "humidity": 60.0, "rain_probability": 20.0,
        "expected_rainfall": 2.0, "wind_speed": 34.0, "condition": "Windy", "weather_code": 2,
    },
    "3_extreme_heat": {
        "label": "Extreme temperature",
        "temperature": 42.0, "humidity": 35.0, "rain_probability": 5.0,
        "expected_rainfall": 0.0, "wind_speed": 10.0, "condition": "Clear sky", "weather_code": 0,
    },
    "4_low_rain_heat": {
        "label": "Low rainfall + high temperature",
        "temperature": 36.0, "humidity": 40.0, "rain_probability": 10.0,
        "expected_rainfall": 2.0, "wind_speed": 8.0, "condition": "Mostly sunny", "weather_code": 1,
    },
    "5_favorable": {
        "label": "Favorable normal weather",
        "temperature": 25.0, "humidity": 60.0, "rain_probability": 20.0,
        "expected_rainfall": 4.0, "wind_speed": 10.0, "condition": "Partly cloudy", "weather_code": 2,
    },
    "6_frost": {
        "label": "Frost risk",
        "temperature": -1.0, "humidity": 75.0, "rain_probability": 10.0,
        "expected_rainfall": 0.0, "wind_speed": 8.0, "condition": "Overcast", "weather_code": 3,
    },
}


def build_demo_snapshot(lat: float, lon: float, label: str, scenario: str) -> dict:
    """Build a WeatherSnapshot-shaped dict for a canned demonstration scenario."""
    s = DEMO_SCENARIOS[scenario]
    now = datetime.utcnow().replace(minute=0, second=0, microsecond=0)
    w_code = s.get("weather_code", 2)
    hourly_points = []
    for i in range(24):
        t = now + timedelta(hours=i)
        wave = math.sin(i * math.pi / 12)
        hourly_points.append({
            "time": _iso(t),
            "temperature": round(s["temperature"] + math.sin((i - 8) * math.pi / 12) * 3, 1),
            "humidity": round(min(98.0, max(20.0, s["humidity"] - wave * 8)), 1),
            "rain_probability": round(min(100.0, max(0.0, s["rain_probability"] + wave * 8)), 1),
            "precipitation": round((s["expected_rainfall"] / 12) * (1 + 0.3 * wave), 1) if s["rain_probability"] > 60 else 0.0,
            "wind_speed": round(max(1.0, s["wind_speed"] + math.cos(i * math.pi / 10) * 3), 1),
        })
    daily_points = []
    for d in range(7):
        day_offset = math.sin(d * 0.9)
        daily_points.append({
            "date": (now + timedelta(days=d)).strftime("%Y-%m-%d"),
            "weather_condition": s["condition"],
            "weather_code": w_code,
            "temp_max": round(s["temperature"] + 2 + day_offset * 1.5, 1),
            "temp_min": round(s["temperature"] - 6 + day_offset * 1.0, 1),
            "rain_probability": round(min(100.0, max(0.0, s["rain_probability"] + day_offset * 10)), 1),
            "precipitation": round(max(0.0, s["expected_rainfall"] * (1 + 0.2 * day_offset)), 1),
            "wind_speed": round(max(1.0, s["wind_speed"] + day_offset * 3), 1),
        })
    return {
        "lat": lat, "lon": lon, "location_label": label or "Demo location",
        "source": "demo", "fetched_at": datetime.utcnow().isoformat(),
        "current": {
            "temperature": s["temperature"], "humidity": s["humidity"],
            "rain_probability": s["rain_probability"], "expected_rainfall": s["expected_rainfall"],
            "precipitation": round(s["expected_rainfall"] / 12, 1) if s["rain_probability"] > 60 else 0.0,
            "wind_speed": s["wind_speed"], "wind_direction": "NE",
            "weather_condition": s["condition"], "weather_code": w_code,
        },
        "hourly": hourly_points, "daily": daily_points,
    }


def _round(v) -> float | None:
    if v is None:
        return None
    return round(float(v), 1)


def _deg12(deg) -> str:
    if deg is None:
        return "N/A"
    dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"]
    return dirs[int(((float(deg) % 360) + 22.5) // 45) % 8]