from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import ValidationError
from sqlalchemy.orm import Session

from ..core.database import get_db
from ..core.security import get_current_user
from ..models import Farm, Field, User
from ..schemas import FarmCreate, FarmRead, FarmUpdate, FieldCreate, FieldRead, FieldUpdate
from .dependencies import get_owned_farm, get_owned_field

router = APIRouter(prefix="", tags=["Farms"])


@router.get("/farms", response_model=list[FarmRead])
def list_farms(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    farms = (
        db.query(Farm)
        .filter(Farm.user_id == current_user.id)
        .order_by(Farm.created_at.desc())
        .all()
    )
    return [FarmRead.model_validate(f) for f in farms]


@router.post("/farms", response_model=FarmRead, status_code=status.HTTP_201_CREATED)
def create_farm(payload: FarmCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    from ..models import Crop, CropGrowthStage

    farm = Farm(
        user_id=current_user.id,
        name=payload.name.strip(),
        location=payload.location.strip(),
        lat=payload.lat,
        lon=payload.lon,
    )
    db.add(farm)
    db.flush()

    for f in payload.fields:
        if f.crop_id and db.get(Crop, f.crop_id) is None:
            db.rollback()
            raise HTTPException(status_code=400, detail="Selected crop does not exist.")
        if f.growth_stage_id and db.get(CropGrowthStage, f.growth_stage_id) is None:
            db.rollback()
            raise HTTPException(status_code=400, detail="Selected growth stage does not exist.")
        field = Field(
            farm_id=farm.id,
            name=f.name.strip(),
            size_hectares=f.size_hectares,
            soil_type=f.soil_type,
            lat=f.lat or farm.lat,
            lon=f.lon or farm.lon,
            crop_id=f.crop_id,
            growth_stage_id=f.growth_stage_id,
        )
        db.add(field)

    try:
        db.commit()
    except ValidationError:
        db.rollback()
        raise
    db.refresh(farm)
    return FarmRead.model_validate(farm)


@router.get("/farms/{farm_id}", response_model=FarmRead)
def get_farm(farm_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    farm = get_owned_farm(db, current_user, farm_id)
    return FarmRead.model_validate(farm)


@router.patch("/farms/{farm_id}", response_model=FarmRead)
def update_farm(farm_id: int, payload: FarmUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    farm = get_owned_farm(db, current_user, farm_id)
    for key, value in payload.model_dump(exclude_unset=True).items():
        if value is not None:
            setattr(farm, key, value)
    db.commit()
    db.refresh(farm)
    return FarmRead.model_validate(farm)


@router.delete("/farms/{farm_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_farm(farm_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    farm = get_owned_farm(db, current_user, farm_id)
    db.delete(farm)
    db.commit()


@router.post("/farms/{farm_id}/fields", response_model=FieldRead, status_code=status.HTTP_201_CREATED)
def add_field(farm_id: int, payload: FieldCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    from ..models import Crop, CropGrowthStage

    farm = get_owned_farm(db, current_user, farm_id)
    if payload.crop_id and db.get(Crop, payload.crop_id) is None:
        raise HTTPException(status_code=400, detail="Selected crop does not exist.")
    if payload.growth_stage_id and db.get(CropGrowthStage, payload.growth_stage_id) is None:
        raise HTTPException(status_code=400, detail="Selected growth stage does not exist.")

    field = Field(
        farm_id=farm.id,
        name=payload.name.strip(),
        size_hectares=payload.size_hectares,
        soil_type=payload.soil_type,
        lat=payload.lat or farm.lat,
        lon=payload.lon or farm.lon,
        crop_id=payload.crop_id,
        growth_stage_id=payload.growth_stage_id,
    )
    db.add(field)
    db.commit()
    db.refresh(field)
    return FieldRead.model_validate(field)


@router.patch("/fields/{field_id}", response_model=FieldRead)
def update_field(field_id: int, payload: FieldUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    from ..models import Crop, CropGrowthStage

    field = get_owned_field(db, current_user, field_id)
    data = payload.model_dump(exclude_unset=True)
    if data.get("crop_id") is not None and db.get(Crop, data["crop_id"]) is None:
        raise HTTPException(status_code=400, detail="Selected crop does not exist.")
    if data.get("growth_stage_id") is not None and db.get(CropGrowthStage, data["growth_stage_id"]) is None:
        raise HTTPException(status_code=400, detail="Selected growth stage does not exist.")
    for key, value in data.items():
        if value is not None or key in ("crop_id", "growth_stage_id"):
            setattr(field, key, value)
    db.commit()
    db.refresh(field)
    return FieldRead.model_validate(field)


@router.delete("/fields/{field_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_field(field_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    field = get_owned_field(db, current_user, field_id)
    farm = field.farm
    db.delete(field)
    db.commit()
    db.refresh(farm)