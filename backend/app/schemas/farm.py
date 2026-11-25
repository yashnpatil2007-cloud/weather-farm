from pydantic import BaseModel, ConfigDict, Field

from .crop import CropRead, CropGrowthStageRead


class FieldRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    farm_id: int
    name: str
    size_hectares: float
    soil_type: str
    lat: float | None = None
    lon: float | None = None
    crop: CropRead | None = None
    growth_stage: CropGrowthStageRead | None = None
    created_at: object


class FieldCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    size_hectares: float = Field(default=1.0, gt=0, le=100000)
    soil_type: str = Field(default="Loam", max_length=60)
    lat: float | None = Field(default=None, ge=-90, le=90)
    lon: float | None = Field(default=None, ge=-180, le=180)
    crop_id: int | None = None
    growth_stage_id: int | None = None


class FieldUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=120)
    size_hectares: float | None = Field(default=None, gt=0, le=100000)
    soil_type: str | None = Field(default=None, min_length=1, max_length=60)
    lat: float | None = Field(default=None, ge=-90, le=90)
    lon: float | None = Field(default=None, ge=-180, le=180)
    crop_id: int | None = None
    growth_stage_id: int | None = None


class FarmRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    name: str
    location: str
    lat: float
    lon: float
    created_at: object
    fields: list[FieldRead] = []


class FarmCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    location: str = Field(min_length=1, max_length=255)
    lat: float = Field(ge=-90, le=90)
    lon: float = Field(ge=-180, le=180)
    fields: list[FieldCreate] = []


class FarmUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=120)
    location: str | None = Field(default=None, min_length=1, max_length=255)
    lat: float | None = Field(default=None, ge=-90, le=90)
    lon: float | None = Field(default=None, ge=-180, le=180)