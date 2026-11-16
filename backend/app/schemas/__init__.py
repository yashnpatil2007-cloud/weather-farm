"""Pydantic request/response schemas."""
from .user import UserCreate, UserLogin, UserRead, TokenResponse
from .farm import FarmCreate, FarmRead, FarmUpdate, FieldCreate, FieldRead, FieldUpdate
from .crop import CropCreate, CropRead, CropUpdate, CropGrowthStageRead
from .weather import WeatherSnapshot, HourlyPoint, DailyPoint, WeatherCurrentRead
from .recommendation import RecommendationRead, RuleCreate, RuleRead, RuleUpdate, GenerateResponse
from .alert import AlertRead
from .activity import ActivityCreate, ActivityRead, ActivityUpdate

__all__ = [
    "UserCreate",
    "UserLogin",
    "UserRead",
    "TokenResponse",
    "FarmCreate",
    "FarmRead",
    "FarmUpdate",
    "FieldCreate",
    "FieldRead",
    "FieldUpdate",
    "CropCreate",
    "CropRead",
    "CropUpdate",
    "CropGrowthStageRead",
    "WeatherSnapshot",
    "HourlyPoint",
    "DailyPoint",
    "WeatherCurrentRead",
    "RecommendationRead",
    "RuleCreate",
    "RuleRead",
    "RuleUpdate",
    "GenerateResponse",
    "AlertRead",
    "ActivityCreate",
    "ActivityRead",
    "ActivityUpdate",
]