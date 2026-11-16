from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import relationship

from ..core.database import Base


class Recommendation(Base):
    """A generated farming recommendation tied to a weather snapshot and field.

    Structured as Situation / Impact / Action so the UI can present the three
    things a farmer needs to know: what is happening, why it matters, what to do.
    """

    __tablename__ = "recommendations"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    field_id = Column(Integer, ForeignKey("fields.id"), nullable=True, index=True)
    weather_record_id = Column(Integer, ForeignKey("weather_records.id"), nullable=True)

    severity = Column(String(20), nullable=False, default="favorable")  # favorable|caution|warning|critical
    category = Column(String(40), nullable=False, default="general")
    title = Column(String(200), nullable=False)
    situation = Column(Text, nullable=True)   # what is happening
    impact = Column(Text, nullable=True)      # why it matters
    action = Column(Text, nullable=True)      # what the farmer should do
    rule_code = Column(String(80), nullable=True)
    factors = Column(JSON, nullable=True)     # weather/context snapshot used
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="recommendations")
    field = relationship("Field")


class RecommendationRule(Base):
    """Configurable rule used by the rule-based recommendation engine.

    conditions is a JSON array, e.g.
    [{"field": "rain_probability", "op": "gt", "value": 70}]

    A condition may alternatively reference a per-crop threshold with a value
    path instead of a fixed value:
    [{"field": "temperature", "op": "gt", "value_path": "crop.heat_stress_temp"}]
    """

    __tablename__ = "recommendation_rules"

    id = Column(Integer, primary_key=True)
    code = Column(String(80), unique=True, nullable=False)
    name = Column(String(120), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String(40), nullable=False, default="general")
    severity = Column(String(20), nullable=False, default="warning")
    conditions = Column(JSON, nullable=False, default=list)
    situation = Column(Text, nullable=True)
    impact = Column(Text, nullable=True)
    action = Column(Text, nullable=True)
    crop_name = Column(String(120), nullable=True)  # restrict to a crop; None = any
    is_alert = Column(Boolean, nullable=False, default=False)
    is_default = Column(Boolean, nullable=False, default=False)  # fires only when nothing else matched
    alert_timing = Column(String(120), nullable=True)
    enabled = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)