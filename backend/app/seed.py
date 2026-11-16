"""Database seed: growth stages, crop catalog + thresholds, default
recommendation rules, and two demo accounts with sample farms.

Demo credentials:
  farmer: demo@farm.com / demo123
  admin:  admin@farm.com / admin123
"""
from __future__ import annotations

from sqlalchemy.orm import Session

from .core.database import SessionLocal
from .core.security import hash_password
from .models import Alert  # noqa: F401  (registered)
from .models import Crop, CropGrowthStage, Farm, Field, Recommendation, RecommendationRule, User
from .services.demo_backfill import backfill_history

GROWTH_STAGES = [
    ("Germination", "Seedlings are just emerging."),
    ("Seedling", "Young plants establishing after emergence."),
    ("Vegetative growth", "Plants growing leaves and stems."),
    ("Flowering", "Plants in bloom; pollination period."),
    ("Fruiting / grain filling", "Yields are forming and filling."),
    ("Maturity", "Crops close to harvest readiness."),
    ("Harvesting", "Crops are harvested."),
    ("Fallow", "Land resting between crop cycles."),
]

# name, category, description, t_min, t_max, heat, frost, wind_limit, humidity_disease
CROPS = [
    ("Paddy Rice", "Cereal", "Staple cereal grown in flooded fields.", 22, 35, 38, 10, 20, 85),
    ("Maize", "Cereal", "Versatile cereal grown for grain and fodder.", 18, 32, 38, 5, 20, 85),
    ("Wheat", "Cereal", "Cool-season cereal grain.", 15, 27, 35, 0, 22, 85),
    ("Tomato", "Vegetable", "Warm-season fruit vegetable.", 18, 30, 36, 10, 18, 80),
    ("Potato", "Root crop", "Tuber crop grown in loose, well-drained soil.", 15, 26, 32, 5, 20, 85),
    ("Sugarcane", "Cash crop", "Tall perennial grass grown for sugar.", 25, 38, 42, 0, 25, 85),
    ("Soybean", "Pulse", "Legume grown for edible oil and protein.", 20, 32, 38, 5, 20, 85),
    ("Chili Pepper", "Vegetable", "Warm-season spice crop.", 20, 32, 36, 10, 18, 75),
    ("Onion", "Vegetable", "Bulb crop for long, cool growth periods.", 15, 28, 35, 5, 25, 80),
]

# Default rules (cover the 5 demonstration scenarios in the brief).
def _default_rules() -> list[dict]:
    return [
        {
            "code": "irr_postpone_rain",
            "name": "Postpone irrigation — rain expected",
            "description": "Rain probability above 70%: delay irrigation.",
            "category": "irrigation", "severity": "warning", "is_alert": True,
            "alert_timing": "within the next 12 hours",
            "conditions": [{"field": "rain_probability", "op": "gt", "value": 70}],
            "situation": "Rain probability is {rain_probability}%.",
            "impact": "Heavy rainfall is likely within the next 12 hours.",
            "action": "Postpone irrigation to avoid unnecessary water use and potential waterlogging.",
        },
        {
            "code": "check_drainage",
            "name": "Heavy rainfall — check drainage",
            "description": ">25 mm rain expected soon: ensure drainage works.",
            "category": "drainage", "severity": "critical", "is_alert": True,
            "alert_timing": "within the next 12 hours",
            "conditions": [{"field": "expected_rainfall", "op": "gt", "value": 25}],
            "situation": "Expected rainfall is {expected_rainfall} mm within the next 12 hours.",
            "impact": "Excess water can waterlog the roots and damage the crop.",
            "action": "Check field drainage, clear blocked channels and do not irrigate.",
        },
        {
            "code": "pause_spraying",
            "name": "Windy — postpone pesticide spraying",
            "description": "Wind above the crop's safe spray limit.",
            "category": "spraying", "severity": "warning", "is_alert": True,
            "alert_timing": "today",
            "conditions": [{"field": "wind_speed", "op": "gt", "value": 20, "value_path": "crop.wind_spray_limit"}],
            "situation": "Wind speed is {wind_speed} km/h, above the safe limit for spraying.",
            "impact": "Spraying in wind drifts onto neighbouring areas and reduces effectiveness.",
            "action": "Postpone pesticide or foliar spraying until the wind drops below the safe limit.",
        },
        {
            "code": "heat_stress_warning",
            "name": "Heat stress — protect the crop",
            "description": "Temperature above the crop heat-stress threshold.",
            "category": "heat_stress", "severity": "critical", "is_alert": True,
            "alert_timing": "today",
            "conditions": [{"field": "temperature", "op": "gt", "value": 38, "value_path": "crop.heat_stress_temp"}],
            "situation": "Temperature is {temperature}°C, above the heat-stress threshold for {crop_name}.",
            "impact": "High heat can scorch leaves, abort flowers and cut yields.",
            "action": "Provide shade or mulch, irrigate during the cooler hours, and check for wilting.",
        },
        {
            "code": "disease_risk_humidity",
            "name": "High humidity — watch for disease",
            "description": "Humidity above the crop disease-risk level.",
            "category": "disease", "severity": "caution", "is_alert": False,
            "alert_timing": "next few days",
            "conditions": [{"field": "humidity", "op": "gt", "value": 85, "value_path": "crop.humidity_disease_threshold"}],
            "situation": "Humidity is {humidity}% — very high for {crop_name}.",
            "impact": "Prolonged high humidity favours fungal diseases such as blight and mildew.",
            "action": "Monitor the crop daily and improve air circulation between rows.",
        },
        {
            "code": "monitor_irrigation",
            "name": "Dry and hot — keep watch on soil moisture",
            "description": "Low expected rainfall combined with heat.",
            "category": "irrigation", "severity": "caution", "is_alert": False,
            "alert_timing": "next 24 hours",
            "conditions": [
                {"field": "expected_rainfall", "op": "lt", "value": 5},
                {"field": "temperature", "op": "gt", "value": 30, "value_path": "crop.optimal_temp_max"},
            ],
            "situation": "Rainfall is low ({expected_rainfall} mm) while temperature is {temperature}°C.",
            "impact": "Soil moisture depletes quickly and the crop may face moisture stress.",
            "action": "Monitor soil moisture and plan irrigation if the soil is drying faster than normal.",
        },
        {
            "code": "frost_warning",
            "name": "Frost risk",
            "description": "Temperature at or below the crop frost point.",
            "category": "frost", "severity": "warning", "is_alert": True,
            "alert_timing": "tonight / early morning",
            "conditions": [{"field": "temperature", "op": "lt", "value": 5, "value_path": "crop.frost_temp"}],
            "situation": "Temperature is {temperature}°C — frost risk for {crop_name}.",
            "impact": "Frost can damage young plants and flowers.",
            "action": "Delay sowing, cover sensitive plants, or use irrigation-based frost protection.",
        },
        {
            "code": "wind_general",
            "name": "Strong winds",
            "description": "Very strong wind that can damage structures.",
            "category": "wind", "severity": "warning", "is_alert": True,
            "alert_timing": "today",
            "conditions": [{"field": "wind_speed", "op": "gt", "value": 40}],
            "situation": "Wind speed is {wind_speed} km/h.",
            "impact": "Strong winds can knock down tall plants and damage structures.",
            "action": "Secure greenhouse covers and frames; postpone planting of tall crops.",
        },
        {
            "code": "favorable_conditions",
            "name": "Favorable conditions for planned work",
            "description": "Default message when no weather risk is detected.",
            "category": "general", "severity": "favorable", "is_alert": False,
            "is_default": True,
            "conditions": [],
            "situation": "Current weather is mild and favourable for most farm work.",
            "impact": "No weather-related risk is currently detected for {crop_name}.",
            "action": "Proceed with planned activities as scheduled, but always double-check the sky before you start.",
        },
    ]


def seed_all(db: Session) -> None:
    """Populate lookup data and demo accounts once."""
    # Growth stages
    for i, (name, desc) in enumerate(GROWTH_STAGES):
        db.add(CropGrowthStage(name=name, description=desc, sort_order=i + 1))
    db.flush()
    stage_by_name = {s.name: s.id for s in db.query(CropGrowthStage).all()}

    # Crops
    for name, cat, desc, tmin, tmax, heat, frost, wind, humid in CROPS:
        db.add(Crop(
            name=name, category=cat, description=desc,
            optimal_temp_min=tmin, optimal_temp_max=tmax,
            heat_stress_temp=heat, frost_temp=frost,
            wind_spray_limit=wind, humidity_disease_threshold=humid,
        ))
    db.flush()
    crop_by_name = {c.name: c.id for c in db.query(Crop).all()}

    # Rules
    for rule in _default_rules():
        db.add(RecommendationRule(**rule))

    # Admin account
    admin = User(
        full_name="System Administrator",
        email="admin@farm.com",
        password_hash=hash_password("admin123"),
        phone="+000 000 0000",
        location="System Administration",
        role="admin",
    )
    db.add(admin)

    # Demo farmer account
    demo = User(
        full_name="Demo Farmer",
        email="demo@farm.com",
        password_hash=hash_password("demo123"),
        phone="+1 555 0100",
        location="Demo Village",
        role="farmer",
    )
    db.add(demo)
    db.flush()

    # Demo farms
    farm1 = Farm(
        user_id=demo.id, name="Green Valley Farm",
        location="California Central Valley, USA", lat=36.81, lon=-120.57,
    )
    farm2 = Farm(
        user_id=demo.id, name="Riverside Farm",
        location="Mississippi Delta, USA", lat=32.35, lon=-90.21,
    )
    db.add_all([farm1, farm2])
    db.flush()

    fields = [
        Field(farm_id=farm1.id, name="North Paddy", size_hectares=4.2, soil_type="Clay Loam",
              crop_id=crop_by_name["Paddy Rice"], growth_stage_id=stage_by_name["Flowering"]),
        Field(farm_id=farm1.id, name="Maize Block", size_hectares=6.5, soil_type="Loam",
              crop_id=crop_by_name["Maize"], growth_stage_id=stage_by_name["Fruiting / grain filling"]),
        Field(farm_id=farm1.id, name="Tomato Plot", size_hectares=2.0, soil_type="Sandy Loam",
              crop_id=crop_by_name["Tomato"], growth_stage_id=stage_by_name["Fruiting / grain filling"]),
        Field(farm_id=farm2.id, name="Lowland Cane", size_hectares=8.0, soil_type="Silt Loam",
              crop_id=crop_by_name["Sugarcane"], growth_stage_id=stage_by_name["Vegetative growth"]),
        Field(farm_id=farm2.id, name="Soybean Strip", size_hectares=3.4, soil_type="Clay Loam",
              crop_id=crop_by_name["Soybean"], growth_stage_id=stage_by_name["Vegetative growth"]),
    ]
    db.add_all(fields)
    db.flush()

    # Synthetic weather/activity/alert history so analytics look alive in demos.
    backfill_history(db, demo.id, [(farm1.lat, farm1.lon), (farm2.lat, farm2.lon)])

    db.commit()
    print("Seeded: growth stages, crops, rules, admin + demo farmer.")


def seed_if_empty() -> None:
    db = SessionLocal()
    try:
        if db.query(User).first() is None:
            seed_all(db)
    finally:
        db.close()


if __name__ == "__main__":
    from .core.database import Base, engine
    import app.models  # noqa: F401  register models

    Base.metadata.create_all(bind=engine)
    seed_if_empty()
    print("Done.")