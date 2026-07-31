from datetime import UTC, datetime, timedelta

import pytest

from tests.conftest import auth


@pytest.fixture
async def accepted_application(client, listing, student, landlord):
    created = await client.post(
        "/api/v1/applications",
        json={"listing_id": listing["id"]},
        headers=auth(student["access_token"]),
    )
    application = created.json()
    await client.put(
        f"/api/v1/applications/{application['id']}/status",
        json={"status": "ACCEPTED"},
        headers=auth(landlord["access_token"]),
    )
    return application


def _in(hours: int) -> str:
    return (datetime.now(UTC) + timedelta(hours=hours)).isoformat()


async def test_meeting_requires_accepted_application(client, listing, student):
    pending = await client.post(
        "/api/v1/applications",
        json={"listing_id": listing["id"]},
        headers=auth(student["access_token"]),
    )
    response = await client.post(
        "/api/v1/meetings",
        json={
            "application_id": pending.json()["id"],
            "meeting_type": "IN_PERSON",
            "scheduled_at": _in(48),
            "location_link": "12 Rue de Fes, Tanger",
        },
        headers=auth(student["access_token"]),
    )

    assert response.status_code == 422


async def test_scheduling_moves_the_application_forward(
    client, accepted_application, landlord
):
    response = await client.post(
        "/api/v1/meetings",
        json={
            "application_id": accepted_application["id"],
            "meeting_type": "VIRTUAL",
            "scheduled_at": _in(48),
            "location_link": "https://meet.example.com/roomiema",
        },
        headers=auth(landlord["access_token"]),
    )
    application = await client.get(
        f"/api/v1/applications/{accepted_application['id']}",
        headers=auth(landlord["access_token"]),
    )

    assert response.status_code == 201
    assert application.json()["status"] == "MEETING_SCHEDULED"


async def test_meeting_must_be_in_the_future(client, accepted_application, landlord):
    response = await client.post(
        "/api/v1/meetings",
        json={
            "application_id": accepted_application["id"],
            "meeting_type": "IN_PERSON",
            "scheduled_at": _in(-2),
            "location_link": "12 Rue de Fes, Tanger",
        },
        headers=auth(landlord["access_token"]),
    )

    assert response.status_code == 422


async def test_overlapping_meetings_conflict(client, accepted_application, landlord):
    when = _in(72)
    payload = {
        "application_id": accepted_application["id"],
        "meeting_type": "IN_PERSON",
        "scheduled_at": when,
        "location_link": "12 Rue de Fes, Tanger",
    }
    headers = auth(landlord["access_token"])

    first = await client.post("/api/v1/meetings", json=payload, headers=headers)
    second = await client.post("/api/v1/meetings", json=payload, headers=headers)

    assert first.status_code == 201
    assert second.status_code == 409


async def test_cancel_meeting(client, accepted_application, landlord, student):
    created = await client.post(
        "/api/v1/meetings",
        json={
            "application_id": accepted_application["id"],
            "meeting_type": "IN_PERSON",
            "scheduled_at": _in(96),
            "location_link": "12 Rue de Fes, Tanger",
        },
        headers=auth(landlord["access_token"]),
    )
    cancelled = await client.delete(
        f"/api/v1/meetings/{created.json()['id']}",
        headers=auth(student["access_token"]),
    )
    listed = await client.get(
        "/api/v1/meetings?status=SCHEDULED", headers=auth(student["access_token"])
    )

    assert cancelled.status_code == 204
    assert listed.json() == []


# --- chat ------------------------------------------------------------------


async def test_chat_is_limited_to_participants(client, accepted_application, landlord):
    outsider = await client.post(
        "/api/v1/auth/register",
        json={
            "name": "Omar Nadi",
            "email": "omar@student.ma",
            "password": "password123",
            "role": "STUDENT",
        },
    )
    response = await client.get(
        f"/api/v1/chats/{accepted_application['id']}/history",
        headers=auth(outsider.json()["access_token"]),
    )

    assert response.status_code == 403


async def test_messages_persist_and_unread_counts_work(
    client, accepted_application, student, landlord
):
    application_id = accepted_application["id"]

    sent = await client.post(
        f"/api/v1/chats/{application_id}/messages",
        json={"text": "Bonjour, is the studio still available?"},
        headers=auth(student["access_token"]),
    )
    unread_for_owner = await client.get(
        "/api/v1/chats/unread-count", headers=auth(landlord["access_token"])
    )
    history = await client.get(
        f"/api/v1/chats/{application_id}/history",
        headers=auth(landlord["access_token"]),
    )
    unread_after_read = await client.get(
        "/api/v1/chats/unread-count", headers=auth(landlord["access_token"])
    )

    assert sent.status_code == 201
    assert unread_for_owner.json()["unread"] == 1
    assert len(history.json()["items"]) == 1
    assert history.json()["items"][0]["sender"]["name"] == "Yasmine Alaoui"
    # Reading the history marks the other party's messages as read.
    assert unread_after_read.json()["unread"] == 0


async def test_conversation_inbox_shows_last_message(
    client, accepted_application, student, landlord
):
    await client.post(
        f"/api/v1/chats/{accepted_application['id']}/messages",
        json={"text": "See you Saturday!"},
        headers=auth(student["access_token"]),
    )
    inbox = await client.get(
        "/api/v1/applications/conversations", headers=auth(landlord["access_token"])
    )

    entry = inbox.json()[0]
    assert entry["last_message"] == "See you Saturday!"
    assert entry["unread_count"] == 1


async def test_dashboard_stats_shape_by_role(client, accepted_application, landlord, student):
    owner_stats = await client.get(
        "/api/v1/users/me/stats", headers=auth(landlord["access_token"])
    )
    student_stats = await client.get(
        "/api/v1/users/me/stats", headers=auth(student["access_token"])
    )

    assert owner_stats.json()["role"] == "LANDLORD"
    assert owner_stats.json()["listings_total"] == 1
    assert student_stats.json()["role"] == "STUDENT"
    assert student_stats.json()["applications_total"] == 1
