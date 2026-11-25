from datetime import date, datetime, time

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ..core.database import get_db
from ..core.security import get_current_user
from ..models import Crop, FarmingActivity, User
from ..schemas import ActivityCreate, ActivityRead, ActivityUpdate
from .dependencies import get_owned_field

router = APIRouter(prefix="/activities", tags=["Activities"])

ALLOWED_TYPES = {"irrigation", "sowing", "fertilizer", "pesticide", "harvesting", "other"}


def _parse_time(value: str | None) -> time | None:
    if not value:
        return None
    try:
        return time.fromisoformat(value)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid time format. Use HH:MM.")


def _serialize(rows) -> list[ActivityRead]:
    out = []
    for a in rows:
        data = ActivityRead.model_validate(a)
        data.field_name = a.field.name if a.field else None
        data.crop_name = a.crop.name if a.crop else None
        out.append(data)
    return out


@router.get("", response_model=list[ActivityRead])
def list_activities(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    limit: int = Query(200, ge=1, le=500),
):
    rows = (
        db.query(FarmingActivity)
        .filter(FarmingActivity.user_id == current_user.id)
        .order_by(FarmingActivity.activity_date.desc(), FarmingActivity.created_at.desc())
        .limit(limit)
        .all()
    )
    return _serialize(rows)


@router.post("", response_model=ActivityRead, status_code=201)
def create_activity(payload: ActivityCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if payload.activity_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail=f"Activity type must be one of: {', '.join(sorted(ALLOWED_TYPES))}.")

    if payload.field_id:
        field = get_owned_field(db, current_user, payload.field_id)
        crop_id = payload.crop_id or (field.crop_id if field else None)
    else:
        field, crop_id = None, payload.crop_id

    if crop_id is not None and db.get(Crop, crop_id) is None:
        raise HTTPException(status_code=400, detail="Selected crop does not exist.")

    activity = FarmingActivity(
        user_id=current_user.id,
        field_id=field.id if field else None,
        crop_id=crop_id,
        activity_type=payload.activity_type,
        activity_date=payload.activity_date or date.today(),
        activity_time=_parse_time(payload.activity_time) or time(6, 0),
        amount=payload.amount,
        notes=payload.notes,
    )
    db.add(activity)
    db.commit()
    db.refresh(activity)
    return _serialize([activity])[0]


@router.patch("/{activity_id}", response_model=ActivityRead)
def update_activity(activity_id: int, payload: ActivityUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    activity = db.get(FarmingActivity, activity_id)
    if activity is None or activity.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Activity not found.")

    data = payload.model_dump(exclude_unset=True)
    if "activity_type" in data and data["activity_type"] not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail=f"Activity type must be one of: {', '.join(sorted(ALLOWED_TYPES))}.")
    if "activity_time" in data:
        data["activity_time"] = _parse_time(data["activity_time"])
    if "field_id" in data and data["field_id"]:
        field = get_owned_field(db, current_user, data["field_id"])
        data["field_id"] = field.id
    for key, value in data.items():
        if value is not None:
            setattr(activity, key, value)
    db.commit()
    db.refresh(activity)
    return _serialize([activity])[0]


@router.delete("/{activity_id}", status_code=204)
def delete_activity(activity_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    activity = db.get(FarmingActivity, activity_id)
    if activity is None or activity.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Activity not found.")
    db.delete(activity)
    db.commit()