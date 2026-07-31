"""Shared schema helpers and Moroccan-context constants."""

from typing import Generic, TypeVar

from pydantic import BaseModel, Field

T = TypeVar("T")

MOROCCAN_CITIES: list[str] = [
    "Tanger",
    "Casablanca",
    "Rabat",
    "Fes",
    "Marrakech",
    "Agadir",
    "Meknes",
    "Oujda",
    "Tetouan",
    "Kenitra",
]

CAMPUSES: dict[str, list[str]] = {
    "Tanger": [
        "EMSI Tanger",
        "Université Abdelmalek Essaâdi",
        "FST Tanger",
        "ENSA Tanger",
        "ENCG Tanger",
    ],
    "Casablanca": [
        "Université Hassan II",
        "Université Centrale",
        "ENCG Casablanca",
        "EMSI Casablanca",
    ],
    "Rabat": [
        "Université Mohammed V",
        "INPT",
        "ENSIAS",
        "EMI Rabat",
    ],
    "Fes": ["Université Sidi Mohamed Ben Abdellah", "FST Fes"],
    "Marrakech": ["Université Cadi Ayyad", "ENSA Marrakech"],
    "Agadir": ["Université Ibn Zohr", "ENCG Agadir"],
    "Meknes": ["Université Moulay Ismail", "ENSAM Meknes"],
    "Oujda": ["Université Mohammed Premier"],
    "Tetouan": ["FST Tetouan"],
    "Kenitra": ["Université Ibn Tofail"],
}

AMENITIES: list[str] = [
    "WiFi",
    "Kitchen",
    "Balcony",
    "Air Conditioning",
    "Heating",
    "Parking",
    "Washing Machine",
    "Elevator",
    "Security",
    "Desk",
    "Private Bathroom",
    "Terrace",
]

#: +212 followed by a 9-digit national number starting with 5, 6 or 7.
PHONE_PATTERN = r"^\+212[5-7]\d{8}$"


class Page(BaseModel, Generic[T]):
    """Envelope for paginated list endpoints."""

    items: list[T]
    total: int = Field(ge=0)
    page: int = Field(ge=1)
    page_size: int = Field(ge=1)

    @property
    def pages(self) -> int:
        return max(1, -(-self.total // self.page_size))


class Message(BaseModel):
    """Generic `{"detail": ...}` acknowledgement."""

    detail: str


def normalize_phone(raw: str | None) -> str | None:
    """Turn '06 12 34 56 78' / '212612345678' into '+212612345678'."""
    if raw is None:
        return None
    digits = "".join(ch for ch in raw if ch.isdigit() or ch == "+")
    digits = digits.replace("+", "")
    if digits.startswith("212"):
        digits = digits[3:]
    elif digits.startswith("0"):
        digits = digits[1:]
    return f"+212{digits}"
