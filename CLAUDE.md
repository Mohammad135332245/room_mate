# RoomieMA Development Guide

Student housing marketplace for Moroccan universities.

## Layout
- `rommie-backend/` — FastAPI + SQLAlchemy 2.0 (async) + PostgreSQL
- `roomie-frontend/` — React 19 + Vite + Tailwind v4

## Tech Stack
- Backend: FastAPI, SQLAlchemy 2.0 async, Pydantic v2, Alembic, PyJWT, bcrypt
- Frontend: React 19, Vite, Tailwind v4, Axios, React Router 7, lucide-react
- Real-time: native FastAPI WebSockets (`/ws/chat/{application_id}`)
- File storage: Cloudinary (falls back to local stub when unconfigured)
- Email: Brevo (logs to console when unconfigured)

## Design System (Jari)
- Terracotta `#C85A17` (primary), Ochre `#A58863` (secondary), Sage `#6B8E6F` (accent)
- Text `#3D2817` / `#5A4A3A`, Background `#F5EBE0` / `#FDF8F3`, Border `#DCC5B5`
- Display font: Georgia (serif). Body: system sans-serif.
- Radius scale: 4 / 6 / 8 / 12 / 16px. Spacing: 4 8 12 16 24 32 48 64.
- Moroccan motifs (crescent, zellige) used at low opacity as accents only.

## Architecture
Backend: API routes (thin) → services (business logic) → repositories (data access).
Frontend: `features/` mirrors backend domains; `pages/` stay thin and compose features.

## Database
Tables: users, listings, applications, meetings, messages, reviews, saved_listings.

## Moroccan Context
Cities: Tanger, Casablanca, Rabat, Fes, Marrakech, Agadir, Meknes, Oujda, Tetouan, Kenitra.
Currency: DH (integer, whole dirhams per month). Phones stored as `+212XXXXXXXXX`.

## Commands
- Backend dev: `cd rommie-backend && uvicorn app.main:app --reload`
- Backend tests: `cd rommie-backend && pytest`
- Frontend dev: `cd roomie-frontend && npm run dev`
