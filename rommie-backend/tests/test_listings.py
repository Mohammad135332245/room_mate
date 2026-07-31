from tests.conftest import LISTING_PAYLOAD, auth


async def test_students_cannot_post_listings(client, student):
    response = await client.post(
        "/api/v1/listings", json=LISTING_PAYLOAD, headers=auth(student["access_token"])
    )

    assert response.status_code == 403


async def test_listing_rejects_unknown_city(client, landlord):
    response = await client.post(
        "/api/v1/listings",
        json={**LISTING_PAYLOAD, "city": "Paris"},
        headers=auth(landlord["access_token"]),
    )

    assert response.status_code == 422


async def test_browse_returns_created_listing(client, listing):
    response = await client.get("/api/v1/listings")

    body = response.json()
    assert response.status_code == 200
    assert body["total"] == 1
    assert body["items"][0]["title"] == listing["title"]
    assert body["items"][0]["owner"]["name"] == "Hassan Benali"


async def test_filters_narrow_results(client, listing):
    by_city = await client.get("/api/v1/listings?city=Tanger")
    wrong_city = await client.get("/api/v1/listings?city=Rabat")
    too_cheap = await client.get("/api/v1/listings?price_max=1000")
    by_amenity = await client.get("/api/v1/listings?amenities=WiFi")
    missing_amenity = await client.get("/api/v1/listings?amenities=Parking")
    by_search = await client.get("/api/v1/listings?search=studio")

    assert by_city.json()["total"] == 1
    assert wrong_city.json()["total"] == 0
    assert too_cheap.json()["total"] == 0
    assert by_amenity.json()["total"] == 1
    assert missing_amenity.json()["total"] == 0
    assert by_search.json()["total"] == 1


async def test_detail_increments_views_and_flags_viewer_state(
    client, listing, student
):
    response = await client.get(
        f"/api/v1/listings/{listing['id']}", headers=auth(student["access_token"])
    )

    body = response.json()
    assert body["views"] == 1
    assert body["is_saved"] is False
    assert body["has_applied"] is False


async def test_only_the_owner_can_update_or_delete(client, listing, student, landlord):
    outsider = await client.put(
        f"/api/v1/listings/{listing['id']}",
        json={"price": 1000},
        headers=auth(student["access_token"]),
    )
    owner = await client.put(
        f"/api/v1/listings/{listing['id']}",
        json={"price": 2800},
        headers=auth(landlord["access_token"]),
    )
    deleted = await client.delete(
        f"/api/v1/listings/{listing['id']}", headers=auth(landlord["access_token"])
    )

    assert outsider.status_code == 403
    assert owner.status_code == 200
    assert owner.json()["price"] == 2800
    assert deleted.status_code == 204


async def test_saving_a_listing_is_idempotent_per_user(client, listing, student):
    headers = auth(student["access_token"])

    first = await client.post(f"/api/v1/listings/{listing['id']}/save", headers=headers)
    second = await client.post(f"/api/v1/listings/{listing['id']}/save", headers=headers)
    saved = await client.get("/api/v1/listings/saved", headers=headers)
    removed = await client.delete(
        f"/api/v1/listings/{listing['id']}/save", headers=headers
    )
    empty = await client.get("/api/v1/listings/saved", headers=headers)

    assert first.status_code == 201
    assert second.status_code == 409
    assert len(saved.json()) == 1
    assert removed.status_code == 204
    assert empty.json() == []


async def test_meta_endpoint_lists_moroccan_context(client):
    body = (await client.get("/api/v1/listings/meta")).json()

    assert "Tanger" in body["cities"]
    assert "EMSI Tanger" in body["campuses"]["Tanger"]
    assert "WiFi" in body["amenities"]
