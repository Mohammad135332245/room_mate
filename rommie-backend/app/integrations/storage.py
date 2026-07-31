import logging
import uuid
from pathlib import Path

from fastapi import UploadFile

from app.core.config import settings
from app.core.exceptions import ValidationError

logger = logging.getLogger(__name__)

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_BYTES = 5 * 1024 * 1024  # 5 MB

UPLOAD_DIR = Path(__file__).resolve().parents[2] / "uploads"


def _validate(file: UploadFile, data: bytes) -> None:
    if file.content_type not in ALLOWED_TYPES:
        raise ValidationError(
            f"Unsupported image type: {file.content_type or 'unknown'}"
        )
    if len(data) > MAX_BYTES:
        raise ValidationError("Images must be 5 MB or smaller")


async def _upload_cloudinary(data: bytes, folder: str) -> str:
    import cloudinary  # imported lazily: optional dependency
    import cloudinary.uploader

    cloudinary.config(cloudinary_url=settings.CLOUDINARY_URL, secure=True)
    result = cloudinary.uploader.upload(data, folder=f"roomiema/{folder}")
    return result["secure_url"]


def _store_local(data: bytes, folder: str, suffix: str) -> str:
    target_dir = UPLOAD_DIR / folder
    target_dir.mkdir(parents=True, exist_ok=True)
    name = f"{uuid.uuid4().hex}{suffix}"
    (target_dir / name).write_bytes(data)
    return f"/uploads/{folder}/{name}"


async def upload_image(file: UploadFile, folder: str = "listings") -> str:
    """Store one image and return the URL to persist on the model."""
    data = await file.read()
    _validate(file, data)

    if settings.CLOUDINARY_URL:
        try:
            return await _upload_cloudinary(data, folder)
        except Exception as exc:
            logger.warning("Cloudinary upload failed, storing locally: %s", exc)

    suffix = Path(file.filename or "image.jpg").suffix or ".jpg"
    return _store_local(data, folder, suffix)


async def upload_images(files: list[UploadFile], folder: str = "listings") -> list[str]:
    if len(files) > 12:
        raise ValidationError("A listing can have at most 12 photos")
    return [await upload_image(file, folder) for file in files]
