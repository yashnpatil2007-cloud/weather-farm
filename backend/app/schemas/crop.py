from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class CropRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    category: str
    description: str | None = None
    is_active: bool
    optimal_temp_min: float
    optimal_temp_max: float
    heat_stress_temp: float
    frost_temp: float
    wind_spray_limit: float
    humidity_disease_threshold: float


class CropCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    category: str = Field(default="Field crop", max_length=60)
    description: str | None = None
    optimal_temp_min: float = 18.0
    optimal_temp_max: float = 32.0
    heat_stress_temp: float = 38.0
    frost_temp: float = 4.0
    wind_spray_limit: float = 20.0
    humidity_disease_threshold: float = 85.0


class CropUpdate(BaseModel):
    name: str | None = Field(default=None, max_length=120)
    category: str | None = Field(default=None, max_length=60)
    description: str | None = None
    is_active: bool | None = None
    optimal_temp_min: float | None = None
    optimal_temp_max: float | None = None
    heat_stress_temp: float | None = None
    frost_temp: float | None = None
    wind_spray_limit: float | None = None
    humidity_disease_threshold: float | None = None


class CropGrowthStageRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    description: str | None = None
    sort_order: int