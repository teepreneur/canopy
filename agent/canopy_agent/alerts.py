"""Alert generation and child access request flow."""

import asyncio
import logging
import time

import httpx

from .config import AgentConfig

logger = logging.getLogger("canopy.alerts")

ALERT_RATE_LIMIT = 60  # seconds between duplicate alerts


class AlertManager:
    def __init__(self, config: AgentConfig):
        self.config = config
        self._recent_alerts: dict[str, float] = {}
        self._pending_requests: dict[str, asyncio.Future] = {}

    async def send_alert(self, alert_type: str, detail: str) -> None:
        key = f"{alert_type}:{detail}"
        now = time.time()
        if key in self._recent_alerts and now - self._recent_alerts[key] < ALERT_RATE_LIMIT:
            return

        self._recent_alerts[key] = now
        self._cleanup_old_alerts()

        payload = {
            "device_id": self.config.device_id,
            "type": alert_type,
            "detail": detail,
            "timestamp": now,
        }

        try:
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.post(
                    f"{self.config.backend_url}/api/alerts",
                    json=payload,
                    headers={"Authorization": f"Bearer {self.config.device_token}"},
                )
                resp.raise_for_status()
                logger.info("Alert sent: %s — %s", alert_type, detail)
        except Exception as e:
            logger.warning("Failed to send alert: %s", e)

    async def request_access(self, domain: str) -> bool:
        request_id = f"{domain}:{time.time()}"
        future: asyncio.Future = asyncio.get_running_loop().create_future()
        self._pending_requests[request_id] = future

        await self.send_alert("access_request", domain)

        _show_access_dialog(domain)

        try:
            approved = await asyncio.wait_for(future, timeout=300)
            return approved
        except asyncio.TimeoutError:
            logger.info("Access request for %s timed out", domain)
            return False
        finally:
            self._pending_requests.pop(request_id, None)

    async def handle_access_response(self, msg: dict) -> None:
        domain = msg.get("domain", "")
        approved = msg.get("approved", False)

        for key, future in list(self._pending_requests.items()):
            if key.startswith(f"{domain}:") and not future.done():
                future.set_result(approved)
                break

    def _cleanup_old_alerts(self) -> None:
        now = time.time()
        self._recent_alerts = {
            k: v for k, v in self._recent_alerts.items()
            if now - v < ALERT_RATE_LIMIT * 5
        }


def _show_access_dialog(domain: str) -> None:
    import subprocess
    script = (
        f'display dialog "Would you like to request access to {domain}?" '
        f'with title "Canopy Access Request" '
        f'buttons {{"Cancel", "Request Access"}} default button "Request Access"'
    )
    try:
        subprocess.Popen(["osascript", "-e", script])
    except Exception as e:
        logger.warning("Failed to show access dialog: %s", e)
