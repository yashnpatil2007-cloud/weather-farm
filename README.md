# Weather-Based Farming Assistance System (WBFAS)

A full-stack agricultural decision support web application providing farmers and agricultural administrators with real-time weather-informed recommendations, crop growth stage tracking, irrigation advisories, alert management, and farm analytics.

## Tech Stack
- **Frontend:** React 18, Vite, TypeScript, Tailwind CSS, React Router, Recharts, Leaflet, i18next
- **Backend:** Python FastAPI, SQLAlchemy, SQLite/PostgreSQL, Uvicorn, Pydantic
- **Weather Data:** Open-Meteo API (free & keyless)

## Project Structure
```
weather-farm/
├── backend/            # FastAPI REST API & decision engine
│   ├── app/            # Models, schemas, routers, and recommendation logic
│   ├── requirements.txt
│   └── run.py
├── frontend/           # Vite React SPA
│   ├── src/            # Components, pages, and API clients
│   ├── package.json
│   └── vite.config.ts
├── render.yaml         # Render blueprint for backend web service
├── netlify.toml        # Netlify configuration & API proxy
└── README.md
```

## Running Locally

### Backend
```bash
cd backend
python -m venv .venv
# On Windows:
.venv\Scripts\activate
# On macOS/Linux:
source .venv/bin/activate

pip install -r requirements.txt
python run.py
```
Backend runs at `http://localhost:8000` (Swagger docs at `/docs`).

### Frontend
```bash
cd frontend
npm install
npm run dev
```
Frontend runs at `http://localhost:5173`.

## Demo Credentials
- **Farmer Account:** `demo@farm.com` / `demo123`
- **Admin Account:** `admin@farm.com` / `admin123`
