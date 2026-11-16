from datetime import date, datetime, time

from pydantic import BaseModel, ConfigDict, Field


class ActivityRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    field_id: int | None = None
    field_name: str | None = None
    crop_id: int | None = None
    crop_name: str | None = None
    activity_type: str
    activity_date: date
    activity_time: time
    amount: float | None = None
    notes: str | None = None
    created_at: datetime


class ActivityCreate(BaseModel):
    field_id: int | None = None
    crop_id: int | None = None
    activity_type: str = Field(min_length=3, max_length=40)
    activity_date: date | None = None
    activity_time: str | None = None  # "HH:MM"
    amount: float | None = None
    notes: str | None = None


class ActivityUpdate(BaseModel):
    field_id: int | None = None
    crop_id: int | None = None
    activity_type: str | None = None
    activity_date: date | None = None
    activity_time: str | None = None
    amount: float | None = None
    notes: str | None = None