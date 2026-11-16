from pydantic import BaseModel, Field


class CurrentReading(BaseModel):
    temperature: float
    humidity: float
    rain_probability: float   # % next 12 hours
    expected_rainfall: float  # mm next 12 hours
    precipitation: float      # mm now
    wind_speed: float         # km/h
    wind_direction: str
    weather_condition: str
    weather_code: int | None = None


class HourlyPoint(BaseModel):
    time: str
    temperature: float
    humidity: float
    rain_probability: float
    precipitation: float
    wind_speed: float


class DailyPoint(BaseModel):
    date: str
    weather_condition: str
    weather_code: int | None = None
    temp_max: float
    temp_min: float
    rain_probability: float
    precipitation: float  # mm total
    wind_speed: float


class WeatherSnapshot(BaseModel):
    lat: float
    lon: float
    location_label: str
    source: str                  # "open-meteo" | "demo" | "mock"
    fetched_at: str
    current: CurrentReading
    hourly: list[HourlyPoint] = []
    daily: list[DailyPoint] = []


class WeatherCurrentRead(BaseModel):
    lat: float
    lon: float
    location_label: str
    source: str
    fetched_at: str
    current: CurrentReading = Field(...)
    hourly: list[HourlyPoint] = []
    daily: list[DailyPoint] = []