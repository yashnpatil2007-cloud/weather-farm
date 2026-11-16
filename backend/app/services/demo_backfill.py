"""Demo data backfill.

Creates synthetic weather history, farming activities and alerts for the demo
farmer so analytics charts look realistic during a demonstration without a real
historic data source.
"""
from __future__ import annotations

import random
from datetime import datetime, timedelta

from sqlalchemy.orm import Session

from ..models.activity import FarmingActivity
from ..models.alert import Alert
from ..models.weather import WeatherRecord


def backfill_history(db: Session, user_id: int, coord_anchors: list[tuple[float, float]]):
    """Insert ~90 days of plausible weather, activities and alerts."""
    now = datetime.utcnow()
    rng = random.Random(4210)

    # Weather records: one per day.
    for i in range(90):
        day = now - timedelta(days=90 - i, hours=6)
        lat, lon = coord_anchors[i % len(coord_anchors)]
        season = 18 + 8 * __sinusoidal(i)  # gentle seasonal wave
        record = WeatherRecord(
            user_id=user_id,
            lat=lat, lon=lon, location_label="Demo farm",
            source="demo",
            observed_at=day,
            temperature=round(season + rng.uniform(-4, 4), 1),
            humidity=round(min(95, max(35, 60 + rng.uniform(-15, 15))), 1),
            rain_probability=round(min(95, max(0, rng.gauss(30, 18))), 1),
            expected_rainfall=round(max(0, rng.gauss(4, 5)), 1),
            wind_speed=round(6 + rng.uniform(0, 16), 1),
            weather_condition=rng.choice(["Partly cloudy", "Light rain", "Clear sky", "Cloudy"]),
            daily_payload=[],
            hourly_payload=[],
        )
        db.add(record)

    # Activities.
    activity_types = ["irrigation"] * 5 + ["sowing"] + ["fertilizer"] * 4 + ["pesticide"] * 4 + ["harvesting"]
    for i, atype in enumerate(activity_types):
        db.add(FarmingActivity(
            user_id=user_id,
            activity_type=atype,
            activity_date=(now - timedelta(days=90 - i * 8, hours=3)).date(),
            activity_time=now.time(),
            amount=20 if atype == "irrigation" else None,
            notes="Demo record",
        ))

    # Alerts.
    for i in range(8):
        db.add(Alert(
            user_id=user_id,
            severity=rng.choices(["caution", "warning", "critical"], weights=[3, 2, 1])[0],
            weather_condition=rng.choice([
                "Rain probability is 78%.",
                "Wind speed is 34 km/h.",
                "Temperature is 40°C.",
                "Heavy rainfall of 38 mm is expected.",
            ]),
            expected_timing=rng.choice(["next 12 hours", "tomorrow", "within 24 hours"]),
            recommended_action="Check your field conditions and adjust planned work.",
            message="Demo weather alert",
            is_read=bool(rng.random() > 0.6),
            created_at=now - timedelta(days=rng.randint(1, 89), hours=2),
        ))

    db.commit()


def __sinusoidal(i: int) -> float:
    import math
    return math.sin(i / 90 * math.pi)