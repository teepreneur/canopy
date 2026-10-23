"""Alert detection — keyword matching, evasion detection, and access requests."""

import asyncio
import logging
import time
from collections import deque

import httpx

from .config import AgentConfig

logger = logging.getLogger("canopy.alerts")

ALERT_RATE_LIMIT = 60  # seconds between duplicate alerts

DEFAULT_ALERT_KEYWORDS = [
    "vpn", "proxy", "unblock", "bypass", "tor browser",
    "anonymous", "hide history", "incognito",
    "suicide", "self-harm", "self harm",
    "drugs", "buy weed", "darknet",
    "gun", "weapon",
    "predator", "grooming",
    "bully", "kill myself",
]

RAPID_SWITCH_THRESHOLD = 8
RAPID_SWITCH_WINDOW = 30

REPEATED_BLOCK_THRESHOLD = 5
REPEATED_BLOCK_WINDOW = 120


class AlertManager:
    def __init__(self, config: AgentConfig, keywords: list[str] | None = None):
        self.config = config
        self.alert_keywords = [k.lower() for k in (keywords or DEFAULT_ALERT_KEYWORDS)]
        self._recent_alerts: dict[str, float] = {}
        self._pending_requests: dict[str, asyncio.Future] = {}
        self._blocked_access_log: deque[tuple[float, str]] = deque(maxlen=500)
        self._rapid_switch_alerted_at: float = 0

    async def send_alert(self, alert_type: str, detail: str) -> None:
        key = f"{alert_type}:{detail}"
        now = time.time()
        if key in self._recent_alerts and now - self._recent_alerts[key] < ALERT_RATE_LIMIT:
            return

        self._recent_alerts[key] = now
        self._cleanup_old_alerts()

        payload = {
            "alert_type": alert_type,
            "title": f"{alert_type}: {detail[:100]}",
            "detail": detail,
            "target": detail,
        }

        try:
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.post(
                    f"{self.config.backend_url}/api/v1/alerts/submit/{self.config.device_id}",
                    json=payload,
                    headers={"X-Device-Token": self.config.device_token},
                )
                resp.raise_for_status()
                logger.info("Alert sent: %s — %s", alert_type, detail)
        except Exception as e:
            logger.warning("Failed to send alert: %s", e)

    def check_window_title(self, title: str) -> None:
        """Check a window title against the alert keyword list."""
        if not title:
            return
        title_lower = title.lower()
        for keyword in self.alert_keywords:
            if keyword in title_lower:
                logger.info("Keyword alert: '%s' found in window title", keyword)
                asyncio.create_task(
                    self.send_alert("keyword_match",
                                    f"Window title contains '{keyword}': {title[:200]}")
                )
                return

    def check_rapid_switching(self, switch_times: list[float]) -> None:
        """Detect rapid app switching that may indicate evasion behavior."""
        now = time.time()
        if now - self._rapid_switch_alerted_at < ALERT_RATE_LIMIT:
            return

        recent = [t for t in switch_times if now - t < RAPID_SWITCH_WINDOW]
        if len(recent) >= RAPID_SWITCH_THRESHOLD:
            self._rapid_switch_alerted_at = now
            count = len(recent)
            logger.info("Rapid app switching detected: %d switches in %ds",
                        count, RAPID_SWITCH_WINDOW)
            asyncio.create_task(
                self.send_alert("rapid_switching",
                                f"{count} app switches in {RAPID_SWITCH_WINDOW}s "
                                f"(possible evasion)")
            )

    def record_blocked_access(self, domain_or_app: str) -> None:
        """Record a blocked access attempt and alert if repeated."""
        now = time.time()
        self._blocked_access_log.append((now, domain_or_app))

        cutoff = now - REPEATED_BLOCK_WINDOW
        recent_attempts = sum(
            1 for ts, target in self._blocked_access_log
            if ts > cutoff and target == domain_or_app
        )

        if recent_attempts >= REPEATED_BLOCK_THRESHOLD:
            logger.info("Repeated blocked access: %s (%d times in %ds)",
                        domain_or_app, recent_attempts, REPEATED_BLOCK_WINDOW)
            asyncio.create_task(
                self.send_alert("repeated_blocked_access",
                                f"{domain_or_app} blocked {recent_attempts} times "
                                f"in {REPEATED_BLOCK_WINDOW}s")
            )

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
