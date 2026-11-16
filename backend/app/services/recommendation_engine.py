"""Rule-based recommendation engine.

The engine is intentionally PURE: it takes a weather snapshot (fact values),
optional crop thresholds and a list of RecommendationRule templates and returns
structured outcomes. It performs no I/O, so later an ML model can be dropped in
behind the exact same interface (see ``../../ml/README.md`` for the plan).

Outcome shape:
{
  "code", "title", "category", "severity",
  "situation", "impact", "action",
  "is_alert", "alert_timing",
}
"""
from __future__ import annotations

from ..models.recommendation import RecommendationRule
from ..services import weather_service

SEVERITY_ORDER = ["favorable", "caution", "warning", "critical"]
DEFAULT_CROP_THRESHOLDS = {
    "heat_stress_temp": 38.0,
    "frost_temp": 4.0,
    "wind_spray_limit": 20.0,
    "humidity_disease_threshold": 85.0,
    "optimal_temp_max": 32.0,
    "optimal_temp_min": 18.0,
}

_OPERATORS = {
    "gt": lambda a, b: a > b,
    "gte": lambda a, b: a >= b,
    "lt": lambda a, b: a < b,
    "lte": lambda a, b: a <= b,
    "eq": lambda a, b: a is not None and a == b,
}


def crop_thresholds_for(crop) -> dict:
    if crop is None:
        return dict(DEFAULT_CROP_THRESHOLDS)
    return {
        "heat_stress_temp": crop.heat_stress_temp,
        "frost_temp": crop.frost_temp,
        "wind_spray_limit": crop.wind_spray_limit,
        "humidity_disease_threshold": crop.humidity_disease_threshold,
        "optimal_temp_max": crop.optimal_temp_max,
        "optimal_temp_min": crop.optimal_temp_min,
        "crop_name": crop.name,
    }


def _resolve_comparison_value(cond: dict, crop_thresholds: dict) -> float | None:
    """Resolve the right-hand side of a condition.

    Supports either a fixed numeric ``value`` or a ``value_path`` pointing at a
    per-crop threshold such as "crop.heat_stress_temp".
    """
    path = cond.get("value_path")
    if path:
        key = path.split(".")[-1]
        if key and key in crop_thresholds:
            return float(crop_thresholds[key])
        if cond.get("value") is not None:
            return float(cond["value"])
        return None
    if cond.get("value") is None:
        return None
    return float(cond["value"])


def _eval_condition(cond: dict, factors: dict, crop_thresholds: dict) -> bool:
    key = cond.get("field")
    op = cond.get("op")
    actual = factors.get(key)
    expected = _resolve_comparison_value(cond, crop_thresholds)
    if actual is None or expected is None or op not in _OPERATORS:
        return False
    return _OPERATORS[op](float(actual), expected)


def _render(template: str | None, factors: dict) -> str:
    if not template:
        return ""
    text = template
    for k, v in factors.items():
        if v is None:
            continue
        if isinstance(v, float):
            display = f"{v:g}"
        else:
            display = str(v)
        text = text.replace("{" + k + "}", display)
    return text


def _build_outcome(rule: RecommendationRule, factors: dict) -> dict:
    return {
        "code": rule.code,
        "title": _render(rule.name, factors) or rule.name,
        "category": rule.category,
        "severity": rule.severity,
        "situation": _render(rule.situation, factors),
        "impact": _render(rule.impact, factors),
        "action": _render(rule.action, factors),
        "is_alert": bool(rule.is_alert),
        "alert_timing": _render(rule.alert_timing, factors),
    }


def evaluate_snapshot(
    snapshot: dict,
    crop_thresholds: dict | None = None,
    rules: list[RecommendationRule] | None = None,
) -> list[dict]:
    """Run the rule engine against a weather snapshot.

    Returns outcomes sorted most-severe first, deduplicated by category so a
    farmer sees one clear recommendation per topic. A rule marked ``is_default``
    fires only when no other rule matched (used for the "favorable" case).
    """
    crop_thresholds = crop_thresholds or dict(DEFAULT_CROP_THRESHOLDS)
    current = snapshot.get("current", {})

    factors = {
        "temperature": current.get("temperature"),
        "humidity": current.get("humidity"),
        "rain_probability": current.get("rain_probability"),
        "expected_rainfall": current.get("expected_rainfall"),
        "wind_speed": current.get("wind_speed"),
        "weather_condition": current.get("weather_condition"),
        "crop_name": crop_thresholds.get("crop_name", "the crop"),
    }

    matched: list[dict] = []
    default_matches: list[dict] = []
    for rule in rules or []:
        if not rule.enabled:
            continue
        hit = all(_eval_condition(c, factors, crop_thresholds) for c in (rule.conditions or []))
        if hit:
            outcome = _build_outcome(rule, factors)
            if rule.is_default:
                default_matches.append(outcome)
            else:
                matched.append(outcome)

    # A default rule (e.g. "favorable") only fires when nothing else matched.
    if not matched:
        matched = default_matches

    # Deduplicate by category keeping the highest severity.
    merged: dict[str, dict] = {}
    for m in matched:
        prev = merged.get(m["category"])
        if prev is None or SEVERITY_ORDER.index(m["severity"]) > SEVERITY_ORDER.index(prev["severity"]):
            merged[m["category"]] = m

    results = sorted(merged.values(), key=lambda r: SEVERITY_ORDER.index(r["severity"]), reverse=True)
    return results


def highest_severity(reqs: list[dict]) -> str:
    if not reqs:
        return "favorable"
    return reqs[0]["severity"]