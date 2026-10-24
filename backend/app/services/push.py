import httpx
import logging

logger = logging.getLogger(__name__)

EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"


async def send_push_notification(
    push_token: str,
    title: str,
    body: str,
    data: dict | None = None,
) -> bool:
    if not push_token.startswith("ExponentPushToken["):
        return False

    message = {
        "to": push_token,
        "title": title,
        "body": body,
        "sound": "default",
        "priority": "high",
    }
    if data:
        message["data"] = data

    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                EXPO_PUSH_URL,
                json=message,
                headers={"Content-Type": "application/json"},
                timeout=10,
            )
            resp.raise_for_status()
            return True
    except Exception as e:
        logger.warning("Push notification failed: %s", e)
        return False


async def send_push_to_tokens(
    tokens: list[str],
    title: str,
    body: str,
    data: dict | None = None,
) -> None:
    for token in tokens:
        await send_push_notification(token, title, body, data)
