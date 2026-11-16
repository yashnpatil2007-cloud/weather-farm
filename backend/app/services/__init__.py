"""Services package.

- weather_service: Open-Meteo provider client + demo scenario snapshots.
- recommendation_engine: pure rule-based engine (ML-ready interface).
- alert_service: alert creation / history.
- analytics_service: dashboard aggregations.
- demo_backfill: synthetic history for the demo account.
"""
from . import weather_service  # noqa: F401