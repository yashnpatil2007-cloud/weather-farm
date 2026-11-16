"""Alert generation.

Turns high-severity weather outcomes produced by the recommendation engine into
persisted alerts with severity, condition, expected timing and recommended
action. Handles the notification history shown to the farmer.
"""
from __future__ import annotations

from datetime import datetime, timedelta

from sqlalchemy.orm import Session

from ..models.alert import Alert
from ..models.farm import Field


def create_alerts(db: Session, user_id: int, field: Field | None, outcomes: list[dict]) -> list[Alert]:
    """Persist an alert for alert-worthy outcomes, skipping duplicates seen in
    the last 24 hours for the same field and weather condition."""
    created: list[Alert] = []
    since = datetime.utcnow() - timedelta(hours=24)

    for outcome in outcomes:
        if not outcome.get("is_alert") or outcome["severity"] not in ("warning", "critical"):
            continue
        condition = outcome.get("situation") or outcome.get("title") or "Weather event"
        dup = (
            db.query(Alert)
            .filter(
                Alert.user_id == user_id,
                Alert.field_id == (field.id if field else None),
                Alert.weather_condition == condition,
                Alert.created_at >= since,
            )
            .first()
        )
        if dup:
            continue

        alert = Alert(
            user_id=user_id,
            field_id=field.id if field else None,
            severity=outcome["severity"],
            weather_condition=condition,
            expected_timing=outcome.get("alert_timing"),
            recommended_action=outcome.get("action"),
            message=outcome.get("title"),
        )
        db.add(alert)
        created.append(alert)

    if created:
        db.flush()
    return created


def next_timing(timing: str | None) -> str:
    return timing or "soon"