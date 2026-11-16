from fastapi import APIRouter, HTTPException

from ..schemas import WeatherCurrentRead
from ..services import weather_service

router = APIRouter(prefix="/weather", tags=["Weather"])


@router.get("/geocode", response_model=list[dict])
async def geocode(q: str, limit: int = 6):
    if not q or len(q.strip()) < 2:
        return []
    results = await weather_service.geocode(q.strip())
    return results[:limit]


@router.get("/current", response_model=WeatherCurrentRead)
async def current_weather(lat: float, lon: float, label: str | None = None, scenario: str | None = None):
    """Current + forecast weather for coordinates.

    ``scenario`` is optional and used for deterministic demonstrations.
    """
    if scenario:
        if scenario not in weather_service.DEMO_SCENARIOS:
            raise HTTPException(status_code=400, detail="Unknown demo scenario.")
        snapshot = weather_service.build_demo_snapshot(lat, lon, label or "Demo location", scenario)
    else:
        try:
            snapshot = await weather_service.fetch_snapshot(lat, lon, label or "Your location")
        except Exception:
            raise HTTPException(status_code=503, detail="Weather information is temporarily unavailable.")
    return WeatherCurrentRead.model_validate(snapshot)


@router.get("/snapshot", response_model=dict)
async def raw_snapshot(lat: float, lon: float, label: str | None = None):
    """Raw snapshot (internal use / debugging)."""
    try:
        return await weather_service.fetch_snapshot(lat, lon, label or "Your location")
    except Exception:
        raise HTTPException(status_code=503, detail="Weather information is temporarily unavailable.")