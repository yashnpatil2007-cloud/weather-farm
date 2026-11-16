from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from ..core.database import Base


class Alert(Base):
    """A weather alert sent to a farmer.

    Each alert carries severity, the weather condition, the expected timing and
    a concrete recommended action. is_read powers the notification history.
    """

    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    field_id = Column(Integer, ForeignKey("fields.id"), nullable=True)

    severity = Column(String(20), nullable=False, default="warning")
    weather_condition = Column(String(120), nullable=False)
    expected_timing = Column(String(120), nullable=True)     # e.g. "next 12 hours"
    recommended_action = Column(Text, nullable=True)
    message = Column(Text, nullable=True)
    is_read = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="alerts")
    field = relationship("Field")