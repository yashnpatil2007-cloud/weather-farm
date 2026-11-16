# IoT integration point (future work)

The product keeps these gateways separate so field hardware can plug in without
touching the decision engine.

## Planned integrations

1. **ESP32 soil-moisture sensors** — post readings at `POST /api/iot/soil`
   into a new `SoilReadings` table.
2. **Temperature / humidity field sensors** — augment (or replace) the live
   weather values used by the recommendation engine.
3. **Automated irrigation control** — a service would read the engine's
   ``irrigation`` category outcomes and actuate valves via MQTT/HTTP.

## Seam already in place

- The recommendation pipeline (`services/recommendation_service.py`) is a single
  function: `weather snapshot -> engine -> recommendations + alerts`. IoT
  readings can be merged into the *factors* dict passed to
  `recommendation_engine.evaluate_snapshot` without changing its interface.
- A proposed `SoilReading` model and `POST /api/iot/soil` route would simply
  persist readings keyed by `field_id` for the analytics modules to consume.