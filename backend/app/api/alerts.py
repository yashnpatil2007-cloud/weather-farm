from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..core.database import get_db
from ..core.security import get_current_user
from ..models import Alert, User
from ..schemas import AlertRead

router = APIRouter(prefix="/alerts", tags=["Alerts"])


def _serialize(alerts) -> list[AlertRead]:
    out = []
    for a in alerts:
        data = AlertRead.model_validate(a)
        data.field_name = a.field.name if a.field else None
        out.append(data)
    return out


@router.get("", response_model=list[AlertRead])
def list_alerts(current_user: User = Depends(get_current_user), db: Session = Depends(get_db), limit: int = 100):
    alerts = (
        db.query(Alert)
        .filter(Alert.user_id == current_user.id)
        .order_by(Alert.created_at.desc())
        .limit(limit)
        .all()
    )
    return _serialize(alerts)


@router.get("/unread-count", response_model=dict)
def unread_count(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    count = db.query(Alert).filter(Alert.user_id == current_user.id, Alert.is_read.is_(False)).count()
    return {"count": count}


@router.post("/{alert_id}/read", response_model=AlertRead)
def mark_read(alert_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    alert = db.get(Alert, alert_id)
    if alert is None or alert.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Alert not found.")
    alert.is_read = True
    db.commit()
    db.refresh(alert)
    return _serialize([alert])[0]


@router.post("/read-all", response_model=dict)
def read_all(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    count = db.query(Alert).filter(Alert.user_id == current_user.id, Alert.is_read.is_(False)).count()
    db.query(Alert).filter(Alert.user_id == current_user.id, Alert.is_read.is_(False)).update({"is_read": True})
    db.commit()
    return {"updated": count}