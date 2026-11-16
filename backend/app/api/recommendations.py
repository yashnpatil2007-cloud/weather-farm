from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ..core.database import get_db
from ..core.security import get_current_user
from ..models import Recommendation, User
from ..schemas import GenerateResponse, RecommendationRead
from ..schemas.recommendation import RecommendationRead as RecommendationReadModel
from ..services import weather_service
from ..services.recommendation_service import generate_for_field
from .dependencies import get_owned_field

router = APIRouter(prefix="/recommendations", tags=["Recommendations"])


def _serialize_recos(recos) -> list[RecommendationRead]:
    return [RecommendationReadModel.from_model(r) for r in recos]


@router.post("/generate/{field_id}", response_model=GenerateResponse)
async def generate(field_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Fetch live weather for a field, run the engine, persist results."""
    field = get_owned_field(db, current_user, field_id)
    label = f"{field.farm.name} / {field.name}"
    try:
        snapshot = await weather_service.fetch_snapshot(field.lat or field.farm.lat, field.lon or field.farm.lon, label)
    except Exception:
        raise HTTPException(status_code=503, detail="Weather information is temporarily unavailable.")

    _, outcomes, recos, alerts, _ = generate_for_field(db, current_user.id, field, snapshot, label)
    return GenerateResponse(
        weather=snapshot,
        recommendations=_serialize_recos(recos),
        alerts=[{"id": a.id, "severity": a.severity, "weather_condition": a.weather_condition} for a in alerts],
        rule_matches=len(outcomes),
    )


@router.post("/simulate/{field_id}", response_model=GenerateResponse)
async def simulate(field_id: int, scenario: str = Query(..., description="Demo scenario key, e.g. 1_high_rain"), current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Generate recommendations from a canned demo weather scenario."""
    if scenario not in weather_service.DEMO_SCENARIOS:
        raise HTTPException(status_code=400, detail="Unknown demo scenario.")
    field = get_owned_field(db, current_user, field_id)
    label = f"{field.farm.name} / {field.name}"
    snapshot = weather_service.build_demo_snapshot(field.lat or field.farm.lat, field.lon or field.farm.lon, label, scenario)

    _, outcomes, recos, alerts, _ = generate_for_field(db, current_user.id, field, snapshot, label)
    return GenerateResponse(
        weather=snapshot,
        recommendations=_serialize_recos(recos),
        alerts=[{"id": a.id, "severity": a.severity, "weather_condition": a.weather_condition} for a in alerts],
        rule_matches=len(outcomes),
    )


@router.get("", response_model=list[RecommendationRead])
def list_recommendations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    field_id: int | None = None,
    limit: int = Query(20, ge=1, le=100),
    days: int | None = Query(None, ge=1, le=365),
):
    q = db.query(Recommendation).filter(Recommendation.user_id == current_user.id)
    if field_id:
        q = q.filter(Recommendation.field_id == field_id)
    if days is not None:
        since = datetime.utcnow() - timedelta(days=days)
        q = q.filter(Recommendation.created_at >= since)
    recos = q.order_by(Recommendation.created_at.desc()).limit(limit).all()
    return _serialize_recos(recos)