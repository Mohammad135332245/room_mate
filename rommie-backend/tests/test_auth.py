from tests.conftest import auth

REGISTRATION = {
    "name": "Sara Idrissi",
    "email": "sara@student.ma",
    "password": "password123",
    "role": "STUDENT",
    "city": "Rabat",
}


async def test_register_returns_tokens_and_user(client):
    response = await client.post("/api/v1/auth/register", json=REGISTRATION)

    assert response.status_code == 201
    body = response.json()
    assert body["access_token"] and body["refresh_token"]
    assert body["user"]["email"] == "sara@student.ma"
    assert body["user"]["role"] == "STUDENT"
    assert "password" not in body["user"]


async def test_register_rejects_duplicate_email(client):
    await client.post("/api/v1/auth/register", json=REGISTRATION)
    response = await client.post("/api/v1/auth/register", json=REGISTRATION)

    assert response.status_code == 409


async def test_register_rejects_weak_password(client):
    response = await client.post(
        "/api/v1/auth/register", json={**REGISTRATION, "password": "onlyletters"}
    )

    assert response.status_code == 422


async def test_phone_is_normalized_to_international_format(client):
    response = await client.post(
        "/api/v1/auth/register", json={**REGISTRATION, "phone": "06 12 34 56 78"}
    )

    assert response.json()["user"]["phone"] == "+212612345678"


async def test_login_succeeds_and_wrong_password_fails(client):
    await client.post("/api/v1/auth/register", json=REGISTRATION)

    good = await client.post(
        "/api/v1/auth/login",
        json={"email": REGISTRATION["email"], "password": "password123"},
    )
    bad = await client.post(
        "/api/v1/auth/login",
        json={"email": REGISTRATION["email"], "password": "wrong-password"},
    )

    assert good.status_code == 200
    assert bad.status_code == 401


async def test_me_requires_a_valid_token(client, student):
    ok = await client.get("/api/v1/auth/me", headers=auth(student["access_token"]))
    anonymous = await client.get("/api/v1/auth/me")
    garbage = await client.get("/api/v1/auth/me", headers=auth("not-a-jwt"))

    assert ok.status_code == 200
    assert ok.json()["email"] == "yasmine@student.ma"
    assert anonymous.status_code == 401
    assert garbage.status_code == 401


async def test_refresh_token_issues_a_new_pair(client, student):
    response = await client.post(
        "/api/v1/auth/refresh-token",
        json={"refresh_token": student["refresh_token"]},
    )

    assert response.status_code == 200
    assert response.json()["access_token"]


async def test_access_token_is_rejected_as_a_refresh_token(client, student):
    response = await client.post(
        "/api/v1/auth/refresh-token",
        json={"refresh_token": student["access_token"]},
    )

    assert response.status_code == 401
