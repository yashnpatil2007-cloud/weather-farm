from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Float, Integer, String, Text
from sqlalchemy.orm import relationship

from ..core.database import Base


class Crop(Base):
    """Catalog of crops. Thresholds per crop feed the recommendation engine
    and are manageable by the administrator."""

    __tablename__ = "crops"

    id = Column(Integer, primary_key=True)
    name = Column(String(120), unique=True, nullable=False, index=True)
    category = Column(String(60), nullable=False, default="Field crop")
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)

    # Agronomic thresholds used by the recommendation engine.
    optimal_temp_min = Column(Float, nullable=False, default=18.0)
    optimal_temp_max = Column(Float, nullable=False, default=32.0)
    heat_stress_temp = Column(Float, nullable=False, default=38.0)
    frost_temp = Column(Float, nullable=False, default=4.0)
    wind_spray_limit = Column(Float, nullable=False, default=20.0)  # km/h safe wind for spraying
    humidity_disease_threshold = Column(Float, nullable=False, default=85.0)  # %

    created_at = Column(DateTime, default=datetime.utcnow)

    fields = relationship("Field", back_populates="crop")


class CropGrowthStage(Base):
    """Lookup table of crop growth stages (germination ... harvesting)."""

    __tablename__ = "crop_growth_stages"

    id = Column(Integer, primary_key=True)
    name = Column(String(80), unique=True, nullable=False)
    description = Column(Text, nullable=True)
    sort_order = Column(Integer, nullable=False, default=0)

    fields = relationship("Field", back_populates="growth_stage")