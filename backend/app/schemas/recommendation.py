from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from .weather import WeatherSnapshot


class RecommendationRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    field_id: int | None = None
    field_name: str | None = None
    severity: str
    category: str
    title: str
    situation: str | None = None
    impact: str | None = None
    action: str | None = None
    rule_code: str | None = None
    factors: dict | None = None
    created_at: datetime

    @classmethod
    def from_model(cls, obj) -> "RecommendationRead":
        return cls(
            id=obj.id,
            field_id=obj.field_id,
            field_name=obj.field.name if obj.field else None,
            severity=obj.severity,
            category=obj.category,
            title=obj.title,
            situation=obj.situation,
            impact=obj.impact,
            action=obj.action,
            rule_code=obj.rule_code,
            factors=obj.factors,
            created_at=obj.created_at,
        )


class GenerateResponse(BaseModel):
    weather: WeatherSnapshot | None = None
    recommendations: list[RecommendationRead] = []
    alerts: list["object"] = []
    rule_matches: int = 0


class RuleCreate(BaseModel):
    code: str = Field(min_length=2, max_length=80, pattern=r"^[a-z0-9_]+$")
    name: str = Field(min_length=2, max_length=120)
    description: str | None = None
    category: str = "general"
    severity: str = "warning"  # favorable|caution|warning|critical
    conditions: list[dict] = []
    situation: str | None = None
    impact: str | None = None
    action: str | None = None
    crop_name: str | None = None
    is_alert: bool = False
    is_default: bool = False
    alert_timing: str | None = None
    enabled: bool = True


class RuleUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    category: str | None = None
    severity: str | None = None
    conditions: list[dict] | None = None
    situation: str | None = None
    impact: str | None = None
    action: str | None = None
    crop_name: str | None = None
    is_alert: bool | None = None
    is_default: bool | None = None
    alert_timing: str | None = None
    enabled: bool | None = None


class RuleRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    code: str
    name: str
    description: str | None = None
    category: str
    severity: str
    conditions: list[dict]
    situation: str | None = None
    impact: str | None = None
    action: str | None = None
    crop_name: str | None = None
    is_alert: bool
    is_default: bool
    alert_timing: str | None = None
    enabled: bool
    created_at: datetime | None = None