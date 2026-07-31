import pytest

from tests.conftest import auth


@pytest.fixture
async def application(client, listing, student):
    response = await client.post(
        "/api/v1/applications",
        json={"listing_id": listing["id"], "message": "I'd love to visit."},
        headers=auth(student["access_token"]),
    )
    assert response.status_code == 201, response.text
    return response.json()


async def test_application_starts_pending(application):
    assert application["status"] == "PENDING"
    assert application["message"] == "I'd love to visit."


async def test_cannot_apply_twice(client, listing, student):
    payload = {"listing_id": listing["id"]}
    headers = auth(student["access_token"])

    first = await client.post("/api/v1/applications", json=payload, headers=headers)
    second = await client.post("/api/v1/applications", json=payload, headers=headers)

    assert first.status_code == 201
    assert second.status_code == 409


async def test_owner_cannot_apply_to_own_listing(client, listing, landlord):
    response = await client.post(
        "/api/v1/applications",
        json={"listing_id": listing["id"]},
        headers=auth(landlord["access_token"]),
    )

    assert response.status_code == 403


async def test_both_sides_see_the_application(
    client, application, student, landlord, listing
):
    mine = await client.get(
        "/api/v1/applications/my", headers=auth(student["access_token"])
    )
    received = await client.get(
        "/api/v1/applications/received", headers=auth(landlord["access_token"])
    )
    per_listing = await client.get(
        f"/api/v1/listings/{listing['id']}/applications",
        headers=auth(landlord["access_token"]),
    )

    assert len(mine.json()) == 1
    assert len(received.json()) == 1
    assert len(per_listing.json()) == 1


async def test_only_owner_changes_status(client, application, student, landlord):
    by_student = await client.put(
        f"/api/v1/applications/{application['id']}/status",
        json={"status": "ACCEPTED"},
        headers=auth(student["access_token"]),
    )
    by_owner = await client.put(
        f"/api/v1/applications/{application['id']}/status",
        json={"status": "ACCEPTED"},
        headers=auth(landlord["access_token"]),
    )

    assert by_student.status_code == 403
    assert by_owner.status_code == 200
    assert by_owner.json()["status"] == "ACCEPTED"


async def test_illegal_status_transition_is_rejected(client, application, landlord):
    headers = auth(landlord["access_token"])
    url = f"/api/v1/applications/{application['id']}/status"

    await client.put(url, json={"status": "DECLINED"}, headers=headers)
    reopened = await client.put(url, json={"status": "ACCEPTED"}, headers=headers)

    assert reopened.status_code == 422


async def test_listing_detail_reports_existing_application(
    client, application, listing, student
):
    response = await client.get(
        f"/api/v1/listings/{listing['id']}", headers=auth(student["access_token"])
    )

    assert response.json()["has_applied"] is True
    assert response.json()["applications_count"] == 1


async def test_student_can_withdraw(client, application, student):
    removed = await client.delete(
        f"/api/v1/applications/{application['id']}",
        headers=auth(student["access_token"]),
    )
    remaining = await client.get(
        "/api/v1/applications/my", headers=auth(student["access_token"])
    )

    assert removed.status_code == 204
    assert remaining.json() == []
