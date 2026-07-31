# Migrations

The schema is versioned with Alembic. `app/core/database.py:init_models` only
creates tables outside production, for convenience during local development.

Generate a revision after changing models:

```bash
alembic revision --autogenerate -m "add something"
```

Apply migrations:

```bash
alembic upgrade head
```

`alembic/env.py` reads `DATABASE_URL` from the app settings, so no URL lives in
`alembic.ini`.
