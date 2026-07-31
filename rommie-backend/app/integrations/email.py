import logging

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)

BREVO_ENDPOINT = "https://api.brevo.com/v3/smtp/email"


async def send_email(to_email: str, to_name: str, subject: str, html: str) -> bool:
    if not settings.BREVO_API_KEY:
        logger.info("[email:dev] to=%s subject=%s", to_email, subject)
        return False

    payload = {
        "sender": {"email": settings.EMAIL_FROM, "name": settings.EMAIL_FROM_NAME},
        "to": [{"email": to_email, "name": to_name}],
        "subject": subject,
        "htmlContent": html,
    }
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.post(
                BREVO_ENDPOINT,
                json=payload,
                headers={
                    "api-key": settings.BREVO_API_KEY,
                    "content-type": "application/json",
                },
            )
        response.raise_for_status()
        return True
    except Exception as exc:  # network hiccup, bad key, rate limit...
        logger.warning("Failed to send email to %s: %s", to_email, exc)
        return False


def _wrap(title: str, body: str, cta_label: str, cta_path: str) -> str:
    url = f"{settings.FRONTEND_URL.rstrip('/')}{cta_path}"
    return f"""
    <div style="font-family:Georgia,serif;background:#F5EBE0;padding:32px">
      <div style="max-width:560px;margin:0 auto;background:#FDF8F3;
                  border:1px solid #DCC5B5;border-radius:12px;padding:32px">
        <h1 style="color:#C85A17;font-size:24px;margin:0 0 16px">{title}</h1>
        <div style="color:#3D2817;font-family:sans-serif;line-height:1.6">{body}</div>
        <a href="{url}" style="display:inline-block;margin-top:24px;padding:12px 24px;
           background:#C85A17;color:#FDF8F3;text-decoration:none;border-radius:8px;
           font-family:sans-serif">{cta_label}</a>
        <p style="color:#5A4A3A;font-family:sans-serif;font-size:12px;margin-top:32px">
          RoomieMA — student housing across Morocco
        </p>
      </div>
    </div>
    """


async def send_application_received(
    owner_email: str, owner_name: str, applicant_name: str, listing_title: str
) -> bool:
    return await send_email(
        owner_email,
        owner_name,
        f"New application for {listing_title}",
        _wrap(
            "You have a new application",
            f"<p><strong>{applicant_name}</strong> applied to "
            f"<strong>{listing_title}</strong>.</p>",
            "Review the application",
            "/dashboard",
        ),
    )


async def send_application_status(
    applicant_email: str, applicant_name: str, listing_title: str, status: str
) -> bool:
    verdict = "accepted" if status == "ACCEPTED" else status.lower().replace("_", " ")
    return await send_email(
        applicant_email,
        applicant_name,
        f"Your application was {verdict}",
        _wrap(
            f"Application {verdict}",
            f"<p>Your application for <strong>{listing_title}</strong> "
            f"is now <strong>{verdict}</strong>.</p>",
            "Open your dashboard",
            "/dashboard",
        ),
    )


async def send_meeting_notice(
    to_email: str, to_name: str, listing_title: str, when: str, action: str
) -> bool:
    return await send_email(
        to_email,
        to_name,
        f"Viewing {action}: {listing_title}",
        _wrap(
            f"Viewing {action}",
            f"<p>Your viewing for <strong>{listing_title}</strong> is "
            f"{action} — <strong>{when}</strong>.</p>",
            "See your meetings",
            "/dashboard",
        ),
    )
