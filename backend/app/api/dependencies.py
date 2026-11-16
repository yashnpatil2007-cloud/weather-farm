"""Shared FastAPI dependencies used across routers.
"""
from __future__ import annotations

from fastapi import HTTPException
from sqlalchemy.orm import Session

from ..models import Farm, Field


def get_owned_farm(db: Session, user, farm_id: int) -> Farm:
    farm = db.get(Farm, farm_id)
    if farm is None or farm.user_id != user.id:
        raise HTTPException(status_code=404, detail="Farm not found.")
    return farm


def get_owned_field(db: Session, user, field_id: int) -> Field:
    field = db.get(Field, field_id)
    if field is None or field.farm.user_id != user.id:
        raise HTTPException(status_code=404, detail="Field not found.")
    return field