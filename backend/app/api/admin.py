from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from ..core.database import get_db
from ..core.security import require_admin
from ..models import Alert, Crop, Farm, Field, Recommendation, RecommendationRule, User
from ..schemas import CropCreate, CropRead, CropUpdate, RuleCreate, RuleRead, RuleUpdate, UserRead

router = APIRouter(prefix="/admin", tags=["Admin"], dependencies=[Depends(require_admin)])


# --------------------------------------------------------------------------
# System statistics
# --------------------------------------------------------------------------
@router.get("/stats", response_model=dict)
def stats(db: Session = Depends(get_db)):
    return {
        "total_users": db.query(func.count(User.id)).scalar() or 0,
        "active_users": db.query(func.count(User.id)).filter(User.is_active.is_(True)).scalar() or 0,
        "farms": db.query(func.count(Farm.id)).scalar() or 0,
        "fields": db.query(func.count(Field.id)).scalar() or 0,
        "crops": db.query(func.count(Crop.id)).scalar() or 0,
        "recommendations": db.query(func.count(Recommendation.id)).scalar() or 0,
        "alerts": db.query(func.count(Alert.id)).scalar() or 0,
        "rules": db.query(func.count(RecommendationRule.id)).filter(RecommendationRule.enabled.is_(True)).scalar() or 0,
    }


# --------------------------------------------------------------------------
# Users
# --------------------------------------------------------------------------
@router.get("/users", response_model=list[dict])
def list_users(db: Session = Depends(get_db)):
    users = db.query(User).order_by(User.created_at.desc()).all()
    rows = []
    for u in users:
        rows.append({
            **UserRead.model_validate(u).model_dump(),
            "farm_count": len(u.farms),
            "field_count": sum(len(f.fields) for f in u.farms),
        })
    return rows


@router.patch("/users/{user_id}", response_model=dict)
def update_user(
    user_id: int,
    payload: dict,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found.")
    if user.id == current_admin.id:
        if payload.get("is_active") is False:
            raise HTTPException(status_code=400, detail="Cannot deactivate your own account.")
        if payload.get("role") == "farmer":
            raise HTTPException(status_code=400, detail="Cannot remove your own admin role.")
    if "is_active" in payload and isinstance(payload["is_active"], bool):
        user.is_active = payload["is_active"]
    if "role" in payload and payload["role"] in ("farmer", "admin"):
        user.role = payload["role"]
    db.commit()
    db.refresh(user)
    return UserRead.model_validate(user).model_dump()


# --------------------------------------------------------------------------
# Farms (admin read-only view)
# --------------------------------------------------------------------------
@router.get("/farms", response_model=list[dict])
def list_farms(db: Session = Depends(get_db)):
    farms = db.query(Farm).order_by(Farm.created_at.desc()).all()
    return [
        {
            "id": f.id,
            "name": f.name,
            "location": f.location,
            "user": {"id": f.owner.id, "full_name": f.owner.full_name, "email": f.owner.email},
            "field_count": len(f.fields),
            "created_at": f.created_at.isoformat(),
        }
        for f in farms
    ]


# --------------------------------------------------------------------------
# Crops (catalog + thresholds, which drive the engine)
# --------------------------------------------------------------------------
@router.get("/crops", response_model=list[CropRead])
def list_all_crops(db: Session = Depends(get_db)):
    crops = db.query(Crop).order_by(Crop.name).all()
    return [CropRead.model_validate(c) for c in crops]


@router.post("/crops", response_model=CropRead, status_code=201)
def create_crop(payload: CropCreate, db: Session = Depends(get_db)):
    if db.query(Crop).filter(Crop.name == payload.name.strip()).first():
        raise HTTPException(status_code=409, detail="A crop with this name already exists.")
    crop = Crop(**payload.model_dump())
    crop.name = payload.name.strip()
    db.add(crop)
    db.commit()
    db.refresh(crop)
    return CropRead.model_validate(crop)


@router.patch("/crops/{crop_id}", response_model=CropRead)
def update_crop(crop_id: int, payload: CropUpdate, db: Session = Depends(get_db)):
    crop = db.get(Crop, crop_id)
    if crop is None:
        raise HTTPException(status_code=404, detail="Crop not found.")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(crop, key, value)
    db.commit()
    db.refresh(crop)
    return CropRead.model_validate(crop)


@router.delete("/crops/{crop_id}", status_code=204)
def delete_crop(crop_id: int, db: Session = Depends(get_db)):
    crop = db.get(Crop, crop_id)
    if crop is None:
        raise HTTPException(status_code=404, detail="Crop not found.")
    crop.is_active = False  # soft delete keeps history intact
    db.commit()


# --------------------------------------------------------------------------
# Recommendation rules
# --------------------------------------------------------------------------
ALLOWED_FIELDS = {"temperature", "humidity", "rain_probability", "expected_rainfall", "wind_speed"}
ALLOWED_OPS = {"gt", "gte", "lt", "lte", "eq"}


def _validate_conditions(conditions) -> list[dict]:
    if not isinstance(conditions, list):
        raise HTTPException(status_code=422, detail="conditions must be a JSON array.")
    for cond in conditions:
        if not isinstance(cond, dict):
            raise HTTPException(status_code=422, detail="Each condition must be an object.")
        if cond.get("field") not in ALLOWED_FIELDS:
            raise HTTPException(status_code=422, detail=f"Condition field must be one of {sorted(ALLOWED_FIELDS)}.")
        if cond.get("op") not in ALLOWED_OPS:
            raise HTTPException(status_code=422, detail=f"Condition operator must be one of {sorted(ALLOWED_OPS)}.")
        has_value = cond.get("value") is not None or cond.get("value_path")
        if not has_value:
            raise HTTPException(status_code=422, detail="Each condition needs a 'value' or 'value_path'.")
    return conditions


@router.get("/rules", response_model=list[RuleRead])
def list_rules(db: Session = Depends(get_db)):
    rules = db.query(RecommendationRule).order_by(RecommendationRule.id).all()
    return [RuleRead.model_validate(r) for r in rules]


@router.post("/rules", response_model=RuleRead, status_code=201)
def create_rule(payload: RuleCreate, db: Session = Depends(get_db)):
    if db.query(RecommendationRule).filter(RecommendationRule.code == payload.code).first():
        raise HTTPException(status_code=409, detail="A rule with this code already exists.")
    if payload.severity not in ("favorable", "caution", "warning", "critical"):
        raise HTTPException(status_code=422, detail="Severity must be favorable|caution|warning|critical.")
    conditions = _validate_conditions(payload.conditions)
    rule = RecommendationRule(**payload.model_dump(exclude={"conditions"}), conditions=conditions)
    db.add(rule)
    db.commit()
    db.refresh(rule)
    return RuleRead.model_validate(rule)


@router.patch("/rules/{rule_id}", response_model=RuleRead)
def update_rule(rule_id: int, payload: RuleUpdate, db: Session = Depends(get_db)):
    rule = db.get(RecommendationRule, rule_id)
    if rule is None:
        raise HTTPException(status_code=404, detail="Rule not found.")
    data = payload.model_dump(exclude_unset=True)
    if "conditions" in data:
        data["conditions"] = _validate_conditions(data["conditions"])
    if "severity" in data and data["severity"] not in ("favorable", "caution", "warning", "critical"):
        raise HTTPException(status_code=422, detail="Severity must be favorable|caution|warning|critical.")
    for key, value in data.items():
        setattr(rule, key, value)
    db.commit()
    db.refresh(rule)
    return RuleRead.model_validate(rule)


@router.delete("/rules/{rule_id}", status_code=204)
def delete_rule(rule_id: int, db: Session = Depends(get_db)):
    rule = db.get(RecommendationRule, rule_id)
    if rule is None:
        raise HTTPException(status_code=404, detail="Rule not found.")
    db.delete(rule)
    db.commit()