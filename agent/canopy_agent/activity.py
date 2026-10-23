"""Activity tracking — app usage, window titles, DNS queries."""

import asyncio
import logging
import time
from collections import defaultdict
from dataclasses import dataclass, field

import httpx

from .config import AgentConfig

logger = logging.getLogger("canopy.activity")


@dataclass
class ActivitySession:
    app_name: str
    bundle_id: str
    window_title: str
    start_time: float
    end_time: float = 0.0
    dns_queries: list[str] = field(default_factory=list)


class ActivityTracker:
    def __init__(self, config: AgentConfig):
        self.config = config
        self._sessions: list[ActivitySession] = []
        self._current_app: str = ""
        self._current_session: ActivitySession | None = None
        self._dns_log: list[tuple[float, str]] = []
        self._running = False
        self._tasks: list[asyncio.Task] = []

    async def start(self) -> None:
        self._running = True
        self._tasks = [
            asyncio.create_task(self._track_active_window()),
            asyncio.create_task(self._upload_loop()),
        ]
        logger.info("Activity tracker started")

    async def stop(self) -> None:
        self._running = False
        self._close_current_session()
        for t in self._tasks:
            t.cancel()
        await asyncio.gather(*self._tasks, return_exceptions=True)
        await self._upload_batch()

    def record_dns_query(self, domain: str) -> None:
        self._dns_log.append((time.time(), domain))
        if self._current_session:
            self._current_session.dns_queries.append(domain)

    async def _track_active_window(self) -> None:
        while self._running:
            try:
                app_name, window_title, bundle_id = _get_active_window()
                if app_name != self._current_app:
                    self._close_current_session()
                    self._current_app = app_name
                    self._current_session = ActivitySession(
                        app_name=app_name,
                        bundle_id=bundle_id,
                        window_title=window_title,
                        start_time=time.time(),
                    )
                elif self._current_session:
                    self._current_session.window_title = window_title
            except Exception as e:
                logger.debug("Active window check failed: %s", e)
            await asyncio.sleep(5)

    def _close_current_session(self) -> None:
        if self._current_session:
            self._current_session.end_time = time.time()
            if self._current_session.end_time - self._current_session.start_time > 2:
                self._sessions.append(self._current_session)
            self._current_session = None

    async def _upload_loop(self) -> None:
        while self._running:
            await asyncio.sleep(self.config.activity_upload_interval)
            await self._upload_batch()

    async def _upload_batch(self) -> None:
        if not self._sessions:
            return

        batch = self._sessions[:]
        self._sessions.clear()

        from datetime import datetime, timezone
        entries = []
        for s in batch:
            duration = int(s.end_time - s.start_time)
            ts = datetime.fromtimestamp(s.start_time, tz=timezone.utc).isoformat()
            entries.append({
                "activity_type": "app_usage",
                "target": s.bundle_id or s.app_name,
                "title": s.window_title,
                "duration_seconds": duration,
                "timestamp": ts,
            })
            for domain in s.dns_queries[:10]:
                entries.append({
                    "activity_type": "site_visit",
                    "target": domain,
                    "title": None,
                    "duration_seconds": 0,
                    "timestamp": ts,
                })
        payload = {"entries": entries}

        try:
            async with httpx.AsyncClient(timeout=15) as client:
                resp = await client.post(
                    f"{self.config.backend_url}/api/v1/activity/submit/{self.config.device_id}",
                    json=payload,
                    headers={"X-Device-Token": self.config.device_token},
                )
                resp.raise_for_status()
                logger.info("Uploaded %d activity sessions", len(batch))
        except Exception as e:
            logger.warning("Activity upload failed: %s — re-queuing", e)
            self._sessions = batch + self._sessions


def _get_active_window() -> tuple[str, str, str]:
    try:
        import AppKit
        workspace = AppKit.NSWorkspace.sharedWorkspace()
        active_app = workspace.activeApplication()
        if active_app:
            return (
                active_app.get("NSApplicationName", ""),
                _get_window_title(),
                active_app.get("NSApplicationBundleIdentifier", ""),
            )
    except ImportError:
        pass

    import subprocess
    try:
        result = subprocess.run(
            ["osascript", "-e",
             'tell application "System Events" to get {name, title of first window} of first process whose frontmost is true'],
            capture_output=True, text=True, timeout=3,
        )
        parts = result.stdout.strip().split(", ", 1)
        app_name = parts[0] if parts else ""
        title = parts[1] if len(parts) > 1 else ""
        return (app_name, title, "")
    except Exception:
        return ("", "", "")


def _get_window_title() -> str:
    import subprocess
    try:
        result = subprocess.run(
            ["osascript", "-e",
             'tell application "System Events" to get title of first window of first process whose frontmost is true'],
            capture_output=True, text=True, timeout=3,
        )
        return result.stdout.strip()
    except Exception:
        return ""
