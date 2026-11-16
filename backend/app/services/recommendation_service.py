"""End-to-end recommendation orchestration.

Ties together: weather snapshot -> rule engine -> persisted recommendation +
alerts. Kept as a service so both the farmer API and future IoT ingestion can
reuse the same pipeline.
"""
from __future__ import annotations

from sqlalchemy.orm import Session

from ..models.activity import FarmingActivity
from ..models.alert import Alert
from ..models.farm import Field
from ..models.recommendation import Recommendation, RecommendationRule
from ..models.weather import WeatherRecord
from .alert_service import create_alerts
from .recommendation_engine import crop_thresholds_for, evaluate_snapshot


def persist_snapshot(db: Session, user_id: int, field: Field | None, snapshot: dict, label: str | None = None) -> WeatherRecord:
    rec = WeatherRecord(
        user_id=user_id,
        lat=snapshot.get("lat", (field.lat if field else None) or 0.0),
        lon=snapshot.get("lon", (field.lon if field else None) or 0.0),
        location_label=label or snapshot.get("location_label"),
        source=snapshot.get("source", "unknown"),
        temperature=snapshot["current"].get("temperature"),
        humidity=snapshot["current"].get("humidity"),
        rain_probability=snapshot["current"].get("rain_probability"),
        expected_rainfall=snapshot["current"].get("expected_rainfall"),
        wind_speed=snapshot["current"].get("wind_speed"),
        wind_direction=snapshot["current"].get("wind_direction"),
        weather_condition=snapshot["current"].get("weather_condition"),
        current_payload=snapshot.get("current"),
        hourly_payload=snapshot.get("hourly", []),
        daily_payload=snapshot.get("daily", []),
    )
    db.add(rec)
    db.flush()
    return rec


def generate_for_field(
    db: Session,
    user_id: int,
    field: Field | None,
    snapshot: dict,
    label: str | None = None,
) -> tuple[WeatherRecord, list[dict], list[Recommendation], list[Alert], list[RecommendationRule]]:
    """Run the full pipeline for a field and persistence-aware rules.

    Returns (weather_record, matched_outcomes, recommendation_rows, alerts, rules).
    """
    rec = persist_snapshot(db, user_id, field, snapshot, label)

    crop = field.crop if field else None
    thresholds = crop_thresholds_for(crop)
    rules = db.query(RecommendationRule).filter(RecommendationRule.enabled.is_(True)).all()
    outcomes = evaluate_snapshot(snapshot, thresholds, rules)

    reco_rows: list[Recommendation] = []
    for o in outcomes:
        reco = Recommendation(
            user_id=user_id,
            field_id=field.id if field else None,
            weather_record_id=rec.id,
            severity=o["severity"],
            category=o["category"],
            title=o["title"],
            situation=o.get("situation"),
            impact=o.get("impact"),
            action=o.get("action"),
            rule_code=o.get("code"),
            factors=snapshot.get("current"),
        )
        db.add(reco)
        reco_rows.append(reco)

    alerts = create_alerts(db, user_id, field, outcomes)
    db.commit()
    for r in reco_rows:
        db.refresh(r)
    return rec, outcomes, reco_rows, alerts, rules


def latest_recommendation_for_field(db: Session, field_id: int) -> Recommendation | None:
    return (
        db.query(Recommendation)
        .filter(Recommendation.field_id == field_id)
        .order_by(Recommendation.created_at.desc())
        .first()
    )