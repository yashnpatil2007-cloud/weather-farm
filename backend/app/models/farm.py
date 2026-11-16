from datetime import datetime

from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from ..core.database import Base


class Farm(Base):
    """A farm owned by a user. A farm contains one or more fields."""

    __tablename__ = "farms"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    name = Column(String(120), nullable=False)
    location = Column(String(255), nullable=False)
    lat = Column(Float, nullable=False)
    lon = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    owner = relationship("User", back_populates="farms")
    fields = relationship("Field", back_populates="farm", cascade="all, delete-orphan", order_by="Field.id")


class Field(Base):
    """A cultivated field within a farm, with soil type, current crop and
    growth stage. Coordinates default to the farm location but can be set
    individually for fields located elsewhere."""

    __tablename__ = "fields"

    id = Column(Integer, primary_key=True)
    farm_id = Column(Integer, ForeignKey("farms.id"), nullable=False, index=True)
    name = Column(String(120), nullable=False)
    size_hectares = Column(Float, nullable=False, default=1.0)
    soil_type = Column(String(60), nullable=False, default="Loam")
    lat = Column(Float, nullable=True)
    lon = Column(Float, nullable=True)
    crop_id = Column(Integer, ForeignKey("crops.id"), nullable=True)
    growth_stage_id = Column(Integer, ForeignKey("crop_growth_stages.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    farm = relationship("Farm", back_populates="fields")
    crop = relationship("Crop", back_populates="fields")
    growth_stage = relationship("CropGrowthStage", back_populates="fields")