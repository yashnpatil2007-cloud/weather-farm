"""Public crop catalog endpoints (no auth needed for stage lists)."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..core.database import get_db
from ..models import Crop, CropGrowthStage
from ..schemas import CropRead, CropGrowthStageRead

router = APIRouter(prefix="/crops", tags=["Crops"])


@router.get("", response_model=list[CropRead])
def list_active_crops(db: Session = Depends(get_db)):
    crops = db.query(Crop).filter(Crop.is_active.is_(True)).order_by(Crop.name).all()
    return [CropRead.model_validate(c) for c in crops]


@router.get("/growth-stages", response_model=list[CropGrowthStageRead])
def list_growth_stages(db: Session = Depends(get_db)):
    stages = db.query(CropGrowthStage).order_by(CropGrowthStage.sort_order).all()
    return [CropGrowthStageRead.model_validate(s) for s in stages]