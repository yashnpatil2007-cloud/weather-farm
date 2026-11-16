"""SQLAlchemy ORM models. Designed as a normalized relational schema that runs
identically on SQLite and PostgreSQL. See README.md -> "Database" for the ERD.
"""
from .user import User
from .crop import Crop, CropGrowthStage
from .farm import Farm, Field
from .weather import WeatherRecord
from .recommendation import Recommendation, RecommendationRule
from .alert import Alert
from .activity import FarmingActivity

__all__ = [
    "User",
    "Farm",
    "Field",
    "Crop",
    "CropGrowthStage",
    "WeatherRecord",
    "Recommendation",
    "RecommendationRule",
    "Alert",
    "FarmingActivity",
]