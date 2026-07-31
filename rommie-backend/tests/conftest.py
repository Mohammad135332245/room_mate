"""Test harness: a fresh in-file SQLite database per test session."""

import os
from pathlib import Path

TEST_DB = Path(__file__).parent / "test.db"

# Must be set before app.core.config is imported anywhere.
os.environ["DATABASE_URL"] = f"sqlite+aiosqlite:///{TEST_DB.as_posix()}"
os.environ["ENVIRONMENT"] = "test"
os.environ["JWT_SECRET_KEY"] = "test-secret-that-is-long-enough-for-hs256"
os.environ["DEBUG"] = "false"

import pytest  # noqa: E402
from httpx import ASGITransport, AsyncClient  # noqa: E402

from app.core.database import engine  # noqa: E402
from app.main import app  # noqa: E402
from app.models.base import Base  # noqa: E402


def _drop_db_file() -> None:
    # Windows keeps a handle open until the pooled connection is released, so
    # a leftover file is not worth failing the run over.
    try:
        TEST_DB.unlink(missing_ok=True)
    except PermissionError:
        pass


@pytest.fixture(scope="session", autouse=True)
def _clean_db_file():
    _drop_db_file()
    yield
    _drop_db_file()


@pytest.fixture(autouse=True)
async def fresh_schema():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    yield


@pytest.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


def auth(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
async def student(client):
    response = await client.post(
        "/api/v1/auth/register",
        json={
            "name": "Yasmine Alaoui",
            "email": "yasmine@student.ma",
            "password": "password123",
            "role": "STUDENT",
            "phone": "0612345678",
            "city": "Tanger",
        },
    )
    assert response.status_code == 201, response.text
    return response.json()


@pytest.fixture
async def landlord(client):
    response = await client.post(
        "/api/v1/auth/register",
        json={
            "name": "Hassan Benali",
            "email": "hassan@owner.ma",
            "password": "password123",
            "role": "LANDLORD",
            "phone": "0698765432",
            "city": "Tanger",
        },
    )
    assert response.status_code == 201, response.text
    return response.json()


LISTING_PAYLOAD = {
    "title": "Bright studio near EMSI Tanger",
    "description": "A sunny furnished studio five minutes from campus, "
    "with fast WiFi and a small balcony overlooking the medina.",
    "price": 2500,
    "city": "Tanger",
    "campus_proximity": "EMSI Tanger",
    "rooms": 1,
    "bathrooms": 1,
    "furnished": True,
    "amenities": ["WiFi", "Balcony"],
}


@pytest.fixture
async def listing(client, landlord):
    response = await client.post(
        "/api/v1/listings",
        json=LISTING_PAYLOAD,
        headers=auth(landlord["access_token"]),
    )
    assert response.status_code == 201, response.text
    return response.json()
