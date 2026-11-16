from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from ..core.database import get_db
from ..core.security import get_current_user
from ..models import User
from ..services import analytics_service

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/overview", response_model=dict)
def get_overview(period: str = Query("30d"), current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return analytics_service.overview(db, current_user.id)


@router.get("/weather", response_model=list[dict])
def get_weather(period: str = Query("30d", pattern="^(7d|30d|3m)$"), current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return analytics_service.weather_trends(db, current_user.id, period)


@router.get("/activities", response_model=list[dict])
def get_activities(period: str = Query("30d", pattern="^(7d|30d|3m)$"), current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return analytics_service.activity_frequency(db, current_user.id, period)


@router.get("/irrigation", response_model=list[dict])
def get_irrigation(period: str = Query("30d", pattern="^(7d|30d|3m)$"), current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return analytics_service.irrigation_history(db, current_user.id, period)


@router.get("/alerts", response_model=list[dict])
def get_alerts(period: str = Query("30d", pattern="^(7d|30d|3m)$"), current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return analytics_service.alert_summary(db, current_user.id, period)