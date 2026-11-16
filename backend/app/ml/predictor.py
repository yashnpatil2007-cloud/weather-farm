"""Machine-learning integration point (future work).

The rule-based engine currently lives in ``services/recommendation_engine.py``.
Both the rule engine and any future ML predictor must expose the same contract so
the rest of the system is unchanged when ML is switched on.

Contract::

    def predict(factors: dict, crop_thresholds: dict, context: dict) -> list[dict]:
        \"\"\"Return outcomes in the same shape as the rule engine:
        [{code, title, category, severity, situation, impact, action,
          is_alert, alert_timing}]
        \"\"\"
        ...

Planned models:
- Irrigation prediction from historical weather + soil moisture + activities.
- Crop disease detection from field photos (computer vision).
"""


class BasePredictor:
    """Optional base class for future learning-based predictors."""

    def predict(self, factors: dict, crop_thresholds: dict, context: dict) -> list[dict]:  # pragma: no cover
        raise NotImplementedError("ML predictors are not implemented yet.")

    def is_available(self) -> bool:  # pragma: no cover
        return False