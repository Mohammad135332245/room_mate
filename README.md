# RoomieMA

Student housing marketplace for Moroccan universities. Students search rooms
near their campus, apply, chat with the owner in real time, and book a viewing.

```
rommie-backend/   FastAPI + SQLAlchemy 2.0 (async) + PostgreSQL
roomie-frontend/  React 19 + Vite + Tailwind v4
```

## Quick start

**1. Backend**

```bash
cd rommie-backend
python -m venv .venv && .venv/Scripts/activate
pip install -r requirements-dev.txt
cp .env.example .env
uvicorn app.main:app --reload
```

No Postgres handy? Point it at SQLite instead:

```bash
DATABASE_URL=sqlite+aiosqlite:///./dev.db uvicorn app.main:app --reload
```

Load demo data:

```bash
python -m scripts.seed
```

**2. Frontend**

```bash
cd roomie-frontend
npm install
cp .env.example .env
npm run dev
```

Open http://localhost:5173. API docs live at http://localhost:8000/docs.

**Or run both with Docker:**

```bash
docker compose up
```

## Demo accounts

Seeded with the password `password123`:

| Role    | Email                |
| ------- | -------------------- |
| Student | `yasmine@student.ma` |
| Student | `omar@student.ma`    |
| Owner   | `hassan@owner.ma`    |
| Owner   | `naima@owner.ma`     |

## Features

- **Auth** — register as student or property owner, JWT access + refresh tokens
  with transparent refresh on the client.
- **Listings** — CRUD for owners; public search with city, campus, price, room
  count, furnished and amenity filters, sorting and pagination. Photo upload to
  Cloudinary, with a local `/uploads` fallback.
- **Applications** — students apply once per listing; owners accept or decline.
  Status follows `PENDING → ACCEPTED → MEETING_SCHEDULED → COMPLETED`
  (or `DECLINED`), enforced server-side.
- **Real-time chat** — one room per application over
  `/ws/chat/{application_id}`, with typing indicators, read receipts, presence,
  automatic reconnection and a REST fallback when the socket is down.
- **Meetings** — in-person or video viewings, conflict-checked against both
  parties' calendars, with email notices on schedule/update/cancel.
- **Dashboards** — student view (applications, saved rooms, viewings) and owner
  view (listings, applications, viewings, analytics).
- **Profiles & reviews** — public profiles with ratings, avatars, bios.

## Architecture

Backend follows a strict layering:

```
api/v1/       thin HTTP routes
services/     business rules, permissions, notifications
repositories/ data access
models/       ORM tables
schemas/      Pydantic contracts
```

Frontend mirrors the backend domains under `src/features/`; `src/pages/` stay
thin and compose features. Shared UI lives in `src/components/ui/` and follows
the Jari design system (terracotta / ochre / sage on a warm cream shell, Georgia
display type, Moroccan motifs used only as low-opacity accents).

## Tests

```bash
cd rommie-backend && pytest        # 33 tests: auth, listings, applications,
                                   # meetings, chat, dashboard stats
cd roomie-frontend && npm run build
```

## Notes

- Without `CLOUDINARY_URL`, images are written to `uploads/` and served from
  `/uploads`. Without `BREVO_API_KEY`, emails are logged to stdout. Neither
  missing key breaks a request.
- Outside production the app creates its tables at startup; Alembic owns the
  schema in production (`alembic upgrade head`).
