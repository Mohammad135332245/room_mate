# RoomieMA API

FastAPI backend for the RoomieMA student housing marketplace.

## Layers

```
api/v1/       thin HTTP routes, no business logic
services/     business rules, permissions, notifications
repositories/ data access (SQLAlchemy queries)
models/       ORM tables
schemas/      Pydantic request/response contracts
core/         config, database, security, exceptions, websocket manager
integrations/ Cloudinary uploads, Brevo email
```

## Running locally

```bash
python -m venv .venv && .venv/Scripts/activate   # source .venv/bin/activate on macOS/Linux
pip install -r requirements-dev.txt
cp .env.example .env
uvicorn app.main:app --reload
```

Outside production the app creates its tables on startup, so a Postgres URL is
all you need. To try it without Postgres at all:

```bash
DATABASE_URL=sqlite+aiosqlite:///./dev.db uvicorn app.main:app --reload
```

Load demo data (3 owners, 3 students, 6 listings — password `password123`):

```bash
python -m scripts.seed
```

Interactive docs: http://localhost:8000/docs

## Tests

```bash
pytest
```

The suite runs against a throwaway SQLite file and covers auth, listings,
applications, meetings, chat and dashboard stats.

## Migrations

```bash
alembic revision --autogenerate -m "describe change"
alembic upgrade head
```

## Notable behaviour

- **Roles.** Only `LANDLORD` accounts can post listings; only `STUDENT`
  accounts can apply.
- **Application lifecycle.** `PENDING → ACCEPTED → MEETING_SCHEDULED →
  COMPLETED`, or `PENDING → DECLINED`. Illegal jumps return 422.
- **Meetings** require an accepted application and reject bookings within an
  hour of an existing viewing for either party.
- **Chat** is scoped to an application; both parties (and nobody else) may read
  and post. `/ws/chat/{application_id}?token=…` carries `message`, `typing`,
  `read` and `presence` frames.
- **Optional integrations.** Without `CLOUDINARY_URL` images are written to
  `uploads/` and served from `/uploads`; without `BREVO_API_KEY` emails are
  logged to stdout. Neither missing key breaks a request.
