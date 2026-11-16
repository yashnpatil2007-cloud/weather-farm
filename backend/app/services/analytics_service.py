"""Analytics aggregations used by the farmer analytics dashboard."""
from __future__ import annotations

from datetime import datetime, timedelta

from sqlalchemy import func
from sqlalchemy.orm import Session

from ..models.activity import FarmingActivity
from ..models.alert import Alert
from ..models.recommendation import Recommendation
from ..models.weather import WeatherRecord


def _days_back(period: str) -> int:
    return {"7d": 7, "30d": 30, "3m": 90}.get(period, 30)


def _as_date(value) -> datetime.date:
    if isinstance(value, datetime):
        return value.date()
    if isinstance(value, str):
        return datetime.strptime(value, "%Y-%m-%d").date()
    return value


def _aggregate_weekly(daily: list[dict]) -> list[dict]:
    """Truthfully aggregate per-day weather rows into ISO-week buckets.

    Used for the 3-month window so a long period stays readable on a chart
    without inventing any values: the week is labelled by its Monday and every
    metric is a real average/max over the actual records in that week.
    """
    weeks: list[dict] = []
    for rec in daily:
        day = _as_date(rec["date"])
        iso = day.isocalendar()
        key = (iso[0], iso[1])
        if weeks and weeks[-1]["_key"] == key:
            bucket = weeks[-1]
        else:
            bucket = {
                "_key": key,
                "date": (day - timedelta(days=day.weekday())).isoformat(),
                "_temp": 0.0,
                "_humidity": 0.0,
                "_rain": 0.0,
                "_rain_prob": None,
                "_count": 0,
            }
            weeks.append(bucket)
        for metric, key_name in (
            ("avg_temp", "_temp"),
            ("avg_humidity", "_humidity"),
            ("avg_rainfall", "_rain"),
        ):
            if rec.get(metric) is not None:
                bucket[key_name] += float(rec[metric])
        prob = rec.get("max_rain_prob")
        if prob is not None:
            bucket["_rain_prob"] = max(bucket["_rain_prob"] or 0, float(prob))
        bucket["_count"] += 1

    out = []
    for w in weeks:
        count = w["_count"] or 1
        out.append(
            {
                "date": w["date"],
                "avg_temp": round(w["_temp"] / count, 1),
                "avg_humidity": round(w["_humidity"] / count, 1),
                "avg_rainfall": round(w["_rain"] / count, 1),
                "max_rain_prob": round(w["_rain_prob"] or 0) if w["_rain_prob"] is not None else None,
            }
        )
    return out


def weather_trends(db: Session, user_id: int, period: str) -> list[dict]:
    since = datetime.utcnow() - timedelta(days=_days_back(period))
    rows = (
        db.query(
            func.date(WeatherRecord.observed_at).label("day"),
            func.avg(WeatherRecord.temperature).label("temp"),
            func.avg(WeatherRecord.humidity).label("humidity"),
            func.avg(WeatherRecord.expected_rainfall).label("rain"),
            func.max(WeatherRecord.rain_probability).label("rain_prob"),
        )
        .filter(WeatherRecord.user_id == user_id, WeatherRecord.observed_at >= since)
        .group_by(func.date(WeatherRecord.observed_at))
        .order_by(func.date(WeatherRecord.observed_at))
        .all()
    )
    daily = [
        {
            "date": r.day,
            "avg_temp": round(r.temp, 1) if r.temp else None,
            "avg_humidity": round(r.humidity, 1) if r.humidity else None,
            "avg_rainfall": round(r.rain or 0.0, 1),
            "max_rain_prob": round(r.rain_prob or 0) if r.rain_prob else None,
        }
        for r in rows
    ]
    if period == "3m":
        return _aggregate_weekly(daily)
    return daily


def activity_frequency(db: Session, user_id: int, period: str) -> list[dict]:
    since = datetime.utcnow() - timedelta(days=_days_back(period))
    rows = (
        db.query(FarmingActivity.activity_type, func.count(FarmingActivity.id).label("total"))
        .filter(FarmingActivity.user_id == user_id, FarmingActivity.created_at >= since)
        .group_by(FarmingActivity.activity_type)
        .all()
    )
    return [{"activity_type": r.activity_type, "count": r.total} for r in rows]


def irrigation_history(db: Session, user_id: int, period: str) -> list[dict]:
    since = datetime.utcnow() - timedelta(days=_days_back(period))
    rows = (
        db.query(func.date(FarmingActivity.activity_date).label("day"), func.count(FarmingActivity.id).label("total"))
        .filter(
            FarmingActivity.user_id == user_id,
            FarmingActivity.activity_type == "irrigation",
            FarmingActivity.activity_date >= since.date(),
        )
        .group_by(func.date(FarmingActivity.activity_date))
        .order_by(func.date(FarmingActivity.activity_date))
        .all()
    )
    return [{"date": r.day, "irrigations": r.total} for r in rows]


def alert_summary(db: Session, user_id: int, period: str) -> list[dict]:
    since = datetime.utcnow() - timedelta(days=_days_back(period))
    rows = (
        db.query(
            func.date(Alert.created_at).label("day"),
            Alert.severity,
            func.count(Alert.id).label("total"),
        )
        .filter(Alert.user_id == user_id, Alert.created_at >= since)
        .group_by(func.date(Alert.created_at), Alert.severity)
        .order_by(func.date(Alert.created_at))
        .all()
    )
    return [{"date": r.day, "severity": r.severity, "count": r.total} for r in rows]


def overview(db: Session, user_id: int) -> dict:
    total_recs = db.query(func.count(Recommendation.id)).filter(Recommendation.user_id == user_id).scalar() or 0
    alerts = db.query(func.count(Alert.id)).filter(Alert.user_id == user_id).scalar() or 0
    unread = db.query(func.count(Alert.id)).filter(Alert.user_id == user_id, Alert.is_read.is_(False)).scalar() or 0
    activities = db.query(func.count(FarmingActivity.id)).filter(FarmingActivity.user_id == user_id).scalar() or 0
    return {
        "recommendations_generated": total_recs,
        "alerts_received": alerts,
        "unread_alerts": unread,
        "activities_recorded": activities,
    }