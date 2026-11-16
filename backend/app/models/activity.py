from datetime import datetime, time

from sqlalchemy import Column, DateTime, Date, Float, ForeignKey, Integer, String, Text, Time
from sqlalchemy.orm import relationship

from ..core.database import Base


class FarmingActivity(Base):
    """A farming activity recorded by the farmer (irrigation, sowing, ...).

    Acts as the input for planned/recorded activities that the recommendation
    engine can consider, and as source data for analytics.
    """

    __tablename__ = "farming_activities"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    field_id = Column(Integer, ForeignKey("fields.id"), nullable=True)
    crop_id = Column(Integer, ForeignKey("crops.id"), nullable=True)

    activity_type = Column(String(40), nullable=False)  # irrigation|sowing|fertilizer|pesticide|harvesting|other
    activity_date = Column(Date, nullable=False)
    activity_time = Column(Time, default=time(6, 0))
    amount = Column(Float, nullable=True)   # litres / kg (optional)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="activities")
    field = relationship("Field")
    crop = relationship("Crop")