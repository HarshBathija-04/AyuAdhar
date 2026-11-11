# AyuAahar

**Ayurvedic practice management for dietitians: prakriti-based diet plans, consultations, progress tracking and an AI wellness assistant.**

[![CI](https://github.com/HarshBathija-04/AyuAdhar/actions/workflows/ci.yml/badge.svg)](https://github.com/HarshBathija-04/AyuAdhar/actions/workflows/ci.yml)
![React 19](https://img.shields.io/badge/React-19-61dafb)
![Flask 3](https://img.shields.io/badge/Flask-3-000000)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-schema--per--app-336791)
![License: MIT](https://img.shields.io/badge/license-MIT-green)

| | |
| --- | --- |
| **Live demo** | `https://<your-vercel-app>.vercel.app` |
| **API health** | `https://<your-render-service>.onrender.com/health` |
| **Demo logins** | One-click buttons on the sign-in page (dietitian and patient) |

> The API runs on Render's free tier and sleeps when idle, so the first request can take up to a minute. The app shows a "waking up the server" notice while it starts.

> **Medical disclaimer:** AyuAahar provides general Ayurvedic and nutrition education. It is not medical advice and does not replace a qualified clinician.

## Features

- **Diet plan engine**: calorie target from Mifflin-St Jeor BMR, an activity factor and a BMI adjustment; every food is scored against the patient's doshas (rasa, virya, dosha effects) and spread across four meals.
- **Ask Ayu assistant** (Groq, `openai/gpt-oss-120b`): explains plans and Ayurvedic concepts using the patient's profile and active plan. Server-side only, rate limited, always with a disclaimer.
- **Two roles**: a clinical dashboard for dietitians and a personal wellness dashboard for patients, with ownership enforced on the server.
- **Appointments**: month calendar and list. Dietitians schedule, patients request consultations.
- **Progress tracking**: weekly adherence and weight check-ins, logged by the dietitian or self-reported, with trends and reports.
- **Food database**: nutrition per 100 g plus rasa, guna, virya and vipaka, enriched by the bundled AyurGenix dataset.

## Screenshots

| Landing | Dietitian dashboard |
| --- | --- |
| ![Landing page](docs/screenshots/landing-desktop.png) | ![Dietitian dashboard](docs/screenshots/dashboard-desktop.png) |
| **Diet plan** | **Ask Ayu assistant** |
| ![Generated diet plan](docs/screenshots/diet-plan-desktop.png) | ![AI assistant conversation](docs/screenshots/assistant-chat-desktop.png) |
| **Patient wellness dashboard** | **Mobile (375 px)** |
| ![Patient dashboard](docs/screenshots/patient-dashboard-desktop.png) | ![Mobile patient dashboard](docs/screenshots/patient-dashboard-mobile.png) |

## Architecture

```mermaid
flowchart LR
    U[Browser] -->|HTTPS| V["Vercel<br/>React + Vite SPA<br/>(frontend/app)"]
    V -->|"REST + JWT<br/>VITE_API_URL"| R["Render web service<br/>Flask + gunicorn<br/>(backend)"]
    R -->|"SQLAlchemy / psycopg 3<br/>search_path = DB_SCHEMA"| P[("Shared PostgreSQL<br/>schema: ayuadhar")]
    R -->|"GROQ_API_KEY<br/>(server-side only)"| G["Groq API<br/>openai/gpt-oss-120b"]
    GH["GitHub Actions<br/>keep-alive every 10 min"] -->|"GET /health"| R
```

## Engineering highlights

- **Schema-per-app on one shared database.** Every connection sets `search_path` to `DB_SCHEMA` (validated as a plain identifier), Alembic migrations create and target that schema, and the test suite runs in its own throwaway `ayuadhar_test` schema. Several portfolio apps share one free Postgres instance without touching each other's tables.
- **Transaction-safe plan regeneration.** Deactivating the old plan and inserting the new one happen in a single commit, so a failure never leaves a patient without an active plan. Any unhandled error rolls the session back before returning a JSON 500.
- **Ownership checks that don't leak ids.** Every patient, plan, appointment and progress route checks that the caller owns the record and answers 404 (not 403) otherwise.
- **Hardened auth.** bcrypt hashes, 7-day HS256 JWTs with required `exp`/`sub`, login timing equalised with a dummy hash, rate limits on login, register and the assistant, and the app refuses to start in production without `JWT_SECRET`.
- **Validation at the boundary.** Every request body goes through a pydantic v2 model; errors come back in one shape: `{"message", "code", "details?"}`.
- **Privacy-aware AI context.** The assistant receives age, prakriti, measurements, conditions and the active plan, never the patient's name or contact details. The Groq key never reaches the browser.
- **Cold-start UX.** The API client times every request; anything slower than 4 s shows a "waking up" banner, and a scheduled workflow pings `/health` (which also probes the database) to keep the free instance warm.

## Tech stack

| Layer | Tools |
| --- | --- |
| Frontend | React 19, TypeScript, Vite 7, Tailwind CSS 3, shadcn/ui (Radix), Chart.js, Sonner, Vitest |
| Backend | Python 3.13, Flask 3, SQLAlchemy 2, Alembic, pydantic 2, PyJWT, bcrypt, Flask-Limiter, Flask-CORS, gunicorn |
| AI | Groq Python SDK, model `openai/gpt-oss-120b` |
| Data | PostgreSQL, one schema per app on a shared database |
| Quality | pytest, ruff (lint + format), ESLint, Prettier, GitHub Actions CI |
| Hosting | Vercel (frontend), Render web service (backend) |

## Quick start

Prerequisites: Python 3.13, Node 22+ and a PostgreSQL database.

```bash
# 1. API
cd backend
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements-dev.txt
cp .env.example .env                                # set DATABASE_URL; GROQ_API_KEY for the assistant
alembic upgrade head                                # creates the schema and tables
python seed.py                                      # idempotent demo data
python app.py                                       # http://localhost:5000/health

# 2. Web app (second terminal)
cd frontend/app
cp .env.example .env                                # VITE_API_URL=http://localhost:5000/api
npm ci
npm run dev                                         # http://localhost:5173
```

Sign in with the **Dietitian demo** or **Patient demo** button.

**Docker alternative:** `docker compose up --build` starts Postgres and the API on port 5000; add `--profile web` for the Vite dev server on 5173. Put `GROQ_API_KEY` in `backend/.env` (gitignored) and compose loads it.

### Checks (same as CI)

```bash
cd backend && ruff check . && ruff format --check . && pytest -q
cd frontend/app && npm run lint && npm test && npm run build
```

Backend tests need a reachable Postgres at `TEST_DATABASE_URL` (default `postgresql://postgres:postgres@localhost:5433/portfolio`). They create the `ayuadhar_test` schema and drop it afterwards.

## Environment variables

**Backend** (`backend/.env`, or Render environment)

| Variable | Required | Description |
| --- | --- | --- |
| `DATABASE_URL` | yes | Postgres connection string. `postgres://` is accepted and normalised. |
| `DB_SCHEMA` | no | Schema for all tables. Default `ayuadhar`; created by the migrations. |
| `JWT_SECRET` | in production | Secret for signing JWTs. The app refuses to start in production without it. |
| `FRONTEND_URL` | yes | Allowed CORS origin(s), comma-separated, e.g. `https://ayuaahar.vercel.app`. |
| `GROQ_API_KEY` | for AI | Groq API key. Without it the assistant answers with a friendly 503. |
| `APP_ENV` | no | `production` enables HSTS and the strict secret check. |
| `PORT` | no | Port for `python app.py`. Render sets it for gunicorn. |
| `DEMO_PASSWORD` | no | Password for the seeded demo accounts. Default `password123`. |
| `RATELIMIT_STORAGE_URI` | no | e.g. `redis://...` to share rate limits across instances. Default in-memory. |

**Frontend** (`frontend/app/.env`, or Vercel environment)

| Variable | Required | Description |
| --- | --- | --- |
| `VITE_API_URL` | yes | API base URL including `/api`, e.g. `https://ayuaahar-api.onrender.com/api`. |

## Deployment

1. **Database (once, shared).** Create one Render PostgreSQL instance by hand; every app gets its own schema in it. Copy its connection URL.
2. **API on Render.** New > Blueprint > this repository. `render.yaml` declares the `ayuaahar-api` web service (`rootDir: backend`, free plan, health check `/health`) and sets `DB_SCHEMA=ayuadhar`; it does not create a database. When prompted, set `DATABASE_URL` to the shared database URL, `FRONTEND_URL` to your Vercel URL and `GROQ_API_KEY`. `JWT_SECRET` is generated. Each deploy runs `alembic upgrade head && python seed.py` before gunicorn starts.
3. **Web app on Vercel.** Add New > Project, import the repository, set **Root Directory** to `frontend/app` (preset: Vite) and add `VITE_API_URL=https://<your-render-service>.onrender.com/api`. `vercel.json` adds SPA rewrites, security headers and long-lived asset caching. Then put the Vercel URL into Render's `FRONTEND_URL`.
4. **Keep-alive.** In GitHub, Settings > Secrets and variables > Actions > **Variables**, add `BACKEND_URL` with the Render URL (no trailing `/health`). `.github/workflows/keep-alive.yml` pings `/health` every 10 minutes and skips with a notice when the variable is missing.

## API overview

All routes are under `/api` and return JSON. Errors look like `{"message", "code", "details?"}`.

| Area | Endpoints |
| --- | --- |
| Health | `GET /health` (also `/api/health`): runs `SELECT 1`; 200 `{"status":"ok","db":"ok"}` or 503 |
| Auth | `POST /register`, `POST /login` (rate limited), `GET/PUT /profile` |
| Patients | `GET/POST /patients`, `GET/PUT/DELETE /patients/:id`, `GET /patients/stats`, `GET /patient/my-data` |
| Appointments | `GET/POST /appointments`, `GET/PUT/DELETE /appointments/:id`, `GET /appointments/calendar`, `GET /appointments/stats` |
| Diet plans | `POST /generate-diet-plan/:patientId`, `GET /diet-plan/:patientId`, `GET /diet-plans`, `GET/PUT/DELETE /diet-plans/:id`, `GET /diet-plans/:id/report` |
| Foods | `GET/POST /food-items`, `GET /food-items/:id`, `POST /analyze-nutrition` |
| Progress | `GET/POST /progress`, `GET/PUT/DELETE /progress/:id`, `GET /progress/:patientId/stats`, `GET /progress/:patientId/report` |
| AI | `POST /ai/chat` (`{messages, patient_id?}`, rate limited), `GET /ai/disclaimer` |

## Project structure

```
.
├── backend/                  Flask API (Render rootDir)
│   ├── app.py                app factory, CORS, security headers, error handling, /health
│   ├── config.py             env-driven settings (DATABASE_URL, DB_SCHEMA)
│   ├── schemas.py            pydantic request validation
│   ├── models/               SQLAlchemy models
│   ├── routes/               auth, patients, appointments, diet plans, progress, ai
│   ├── services/             diet plan engine, reports, Groq assistant
│   ├── migrations/           Alembic migrations (schema-aware)
│   ├── seed.py               idempotent demo data
│   └── tests/                pytest suite (API flows and diet maths)
├── frontend/app/             React + Vite SPA (Vercel root directory)
│   ├── src/pages/            route pages (dashboards, patients, plans, Ask Ayu, ...)
│   ├── src/components/       layout, logo, banners, shadcn/ui primitives
│   ├── src/services/api.ts   typed API client with auth and cold-start interceptors
│   └── src/lib/              error messages, cold-start tracker, colour tokens (+ tests)
├── Dataset/                  AyurGenix dataset used for plan recommendations
├── docs/screenshots/         README screenshots
├── Dockerfile, docker-compose.yml
├── render.yaml               Render Blueprint (web service only)
└── .github/workflows/        CI and keep-alive
```

## License

MIT
