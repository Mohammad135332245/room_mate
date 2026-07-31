"""Populate the database with demo users and listings.

    python -m scripts.seed

Safe to re-run: it skips seeding when the demo accounts already exist.
"""

import asyncio
import random
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.core.database import AsyncSessionLocal, init_models  # noqa: E402
from app.core.security import hash_password  # noqa: E402
from app.models.application import Application, ApplicationStatus  # noqa: E402
from app.models.listing import Listing  # noqa: E402
from app.models.user import User, UserRole  # noqa: E402
from app.repositories.user_repo import UserRepository  # noqa: E402

PASSWORD = "password123"

OWNERS = [
    ("Hassan Benali", "hassan@owner.ma", "Tanger", "+212661234567"),
    ("Naima Cherkaoui", "naima@owner.ma", "Casablanca", "+212662345678"),
    ("Youssef Amrani", "youssef@owner.ma", "Rabat", "+212663456789"),
]

STUDENTS = [
    ("Yasmine Alaoui", "yasmine@student.ma", "Tanger"),
    ("Omar Nadi", "omar@student.ma", "Tanger"),
    ("Salma Bennis", "salma@student.ma", "Casablanca"),
]

LISTINGS = [
    {
        "title": "Bright studio steps from EMSI Tanger",
        "description": (
            "A sunny furnished studio five minutes on foot from EMSI. Fibre "
            "WiFi, a proper desk, and a small balcony over the medina rooftops. "
            "Quiet building, ideal for a student who needs to focus."
        ),
        "price": 2500,
        "city": "Tanger",
        "campus_proximity": "EMSI Tanger",
        "rooms": 1,
        "bathrooms": 1,
        "furnished": True,
        "amenities": ["WiFi", "Kitchen", "Balcony", "Desk"],
        "address": "Rue de Fes, Tanger",
        "latitude": 35.7595,
        "longitude": -5.8340,
    },
    {
        "title": "Shared 3-room flat near Université Abdelmalek Essaâdi",
        "description": (
            "One room available in a friendly three-room flat shared with two "
            "engineering students. Fully equipped kitchen, washing machine, and "
            "a ten minute walk to the faculty gates."
        ),
        "price": 1600,
        "city": "Tanger",
        "campus_proximity": "Université Abdelmalek Essaâdi",
        "rooms": 3,
        "bathrooms": 2,
        "furnished": True,
        "amenities": ["WiFi", "Kitchen", "Washing Machine", "Heating"],
        "address": "Avenue Moulay Rachid, Tanger",
    },
    {
        "title": "Modern apartment with terrace, Malabata",
        "description": (
            "Two-bedroom apartment in a new building near the Malabata "
            "seafront. Air conditioning, secure parking, and a wide terrace "
            "with a sea view. Twenty minutes by bus to most campuses."
        ),
        "price": 4200,
        "city": "Tanger",
        "campus_proximity": "FST Tanger",
        "rooms": 2,
        "bathrooms": 2,
        "furnished": True,
        "amenities": [
            "WiFi",
            "Kitchen",
            "Air Conditioning",
            "Parking",
            "Terrace",
            "Elevator",
            "Security",
        ],
        "address": "Corniche Malabata, Tanger",
    },
    {
        "title": "Quiet unfurnished room near Université Hassan II",
        "description": (
            "Affordable unfurnished room in a calm family house in Casablanca. "
            "Bring your own bed and desk; everything else is in place. Tram "
            "stop at the corner, fifteen minutes to campus."
        ),
        "price": 1200,
        "city": "Casablanca",
        "campus_proximity": "Université Hassan II",
        "rooms": 1,
        "bathrooms": 1,
        "furnished": False,
        "amenities": ["WiFi", "Kitchen"],
        "address": "Quartier Maarif, Casablanca",
    },
    {
        "title": "Furnished studio in Agdal, Rabat",
        "description": (
            "Compact studio in the heart of Agdal, a short walk from INPT and "
            "ENSIAS. Cafés and a supermarket downstairs, heating for winter, "
            "and a building concierge."
        ),
        "price": 3000,
        "city": "Rabat",
        "campus_proximity": "INPT",
        "rooms": 1,
        "bathrooms": 1,
        "furnished": True,
        "amenities": ["WiFi", "Kitchen", "Heating", "Elevator", "Security"],
        "address": "Avenue de France, Agdal, Rabat",
    },
    {
        "title": "Sunny two-room flat near ENSIAS",
        "description": (
            "Bright two-room flat on a leafy street, recently repainted. Comes "
            "with a washing machine and a balcony big enough for a small table. "
            "Shares well between two students."
        ),
        "price": 3400,
        "city": "Rabat",
        "campus_proximity": "ENSIAS",
        "rooms": 2,
        "bathrooms": 1,
        "furnished": True,
        "amenities": ["WiFi", "Kitchen", "Balcony", "Washing Machine"],
        "address": "Rue Oued Ziz, Rabat",
    },
]


async def seed() -> None:
    await init_models()

    async with AsyncSessionLocal() as session:
        users = UserRepository(session)
        if await users.get_by_email(OWNERS[0][1]):
            print("Demo data already present — nothing to do.")
            return

        owners = [
            User(
                name=name,
                email=email,
                password_hash=hash_password(PASSWORD),
                role=UserRole.LANDLORD,
                city=city,
                phone=phone,
                bio=f"Renting student housing in {city} since 2019.",
            )
            for name, email, city, phone in OWNERS
        ]
        students = [
            User(
                name=name,
                email=email,
                password_hash=hash_password(PASSWORD),
                role=UserRole.STUDENT,
                city=city,
                bio="Engineering student looking for a quiet place to study.",
            )
            for name, email, city in STUDENTS
        ]
        session.add_all([*owners, *students])
        await session.flush()

        by_city = {owner.city: owner for owner in owners}
        listings = []
        for data in LISTINGS:
            owner = by_city.get(data["city"], owners[0])
            listing = Listing(
                owner_id=owner.id, views=random.randint(4, 90), **data
            )
            listings.append(listing)
        session.add_all(listings)
        await session.flush()

        # A couple of applications so the dashboards aren't empty.
        session.add_all(
            [
                Application(
                    applicant_id=students[0].id,
                    listing_id=listings[0].id,
                    status=ApplicationStatus.PENDING,
                    message="Bonjour! I start at EMSI in September — is it free then?",
                ),
                Application(
                    applicant_id=students[1].id,
                    listing_id=listings[1].id,
                    status=ApplicationStatus.ACCEPTED,
                    message="I'm tidy, quiet, and happy to visit any weekend.",
                ),
            ]
        )
        await session.commit()

    print(f"Seeded {len(OWNERS)} owners, {len(STUDENTS)} students, "
          f"{len(LISTINGS)} listings.")
    print(f"Sign in with any demo email and the password: {PASSWORD}")


if __name__ == "__main__":
    asyncio.run(seed())
