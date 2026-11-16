from datetime import datetime

from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, JSON, String

from ..core.database import Base


class WeatherRecord(Base):
    """A point-in-time weather snapshot for a location.

    Keeps a full copy of the current/hourly/daily series as JSON so analytics
    and displayed history never depend on the (volatile) live provider.
    """

    __tablename__ = "weather_records"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    lat = Column(Float, nullable=False)
    lon = Column(Float, nullable=False)
    location_label = Column(String(255), nullable=True)
    source = Column(String(40), nullable=False, default="open-meteo")  # or "demo"
    observed_at = Column(DateTime, default=datetime.utcnow)

    temperature = Column(Float, nullable=True)
    humidity = Column(Float, nullable=True)
    rain_probability = Column(Float, nullable=True)
    expected_rainfall = Column(Float, nullable=True)  # mm, next 12 hours
    wind_speed = Column(Float, nullable=True)  # km/h
    wind_direction = Column(String(20), nullable=True)
    weather_condition = Column(String(60), nullable=True)

    current_payload = Column(JSON, nullable=True)   # provider "current" block
    hourly_payload = Column(JSON, nullable=True)    # list of hourly entries
    daily_payload = Column(JSON, nullable=True)     # list of daily entries