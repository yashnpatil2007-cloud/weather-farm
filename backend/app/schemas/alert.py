from datetime import datetime

from pydantic import BaseModel, ConfigDict


class AlertRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    field_id: int | None = None
    field_name: str | None = None
    severity: str
    weather_condition: str
    expected_timing: str | None = None
    recommended_action: str | None = None
    message: str | None = None
    is_read: bool
    created_at: datetime