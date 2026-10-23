"""App launch detection and locking using macOS NSWorkspace notifications."""

import asyncio
import logging
import subprocess
from typing import TYPE_CHECKING

logger = logging.getLogger("canopy.app_monitor")

if TYPE_CHECKING:
    from .config import Rules


class AppMonitor:
    def __init__(self, rules: "Rules"):
        self.rules = rules
        self._running = False
        self._task: asyncio.Task | None = None

    async def start(self) -> None:
        self._running = True
        self._task = asyncio.create_task(self._monitor_loop())
        logger.info("App monitor started")

    async def stop(self) -> None:
        self._running = False
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
        logger.info("App monitor stopped")

    async def _monitor_loop(self) -> None:
        try:
            import AppKit
            workspace = AppKit.NSWorkspace.sharedWorkspace()

            nc = workspace.notificationCenter()
            observer = _AppLaunchObserver.alloc().initWithMonitor_(self)
            nc.addObserver_selector_name_object_(
                observer,
                "appDidLaunch:",
                AppKit.NSWorkspaceDidLaunchApplicationNotification,
                None,
            )

            while self._running:
                AppKit.NSRunLoop.currentRunLoop().runUntilDate_(
                    AppKit.NSDate.dateWithTimeIntervalSinceNow_(1.0)
                )
                await asyncio.sleep(0)
        except ImportError:
            logger.warning("PyObjC not available, falling back to psutil polling")
            await self._poll_loop()

    async def _poll_loop(self) -> None:
        import psutil
        seen_pids: set[int] = set()
        for proc in psutil.process_iter(["pid"]):
            seen_pids.add(proc.info["pid"])

        while self._running:
            await asyncio.sleep(2)
            current_pids: set[int] = set()
            for proc in psutil.process_iter(["pid", "name"]):
                pid = proc.info["pid"]
                current_pids.add(pid)
                if pid not in seen_pids:
                    name = proc.info.get("name", "")
                    bundle_id = _get_bundle_id(pid)
                    self._check_and_block(pid, name, bundle_id)
            seen_pids = current_pids

    def _check_and_block(self, pid: int, name: str, bundle_id: str) -> None:
        if self.rules.is_app_blocked(bundle_id) or self.rules.is_app_blocked(name):
            logger.info("BLOCKED app: %s (pid=%d, bundle=%s)", name, pid, bundle_id)
            _terminate_app(pid)
            _send_notification(
                "App Blocked by Canopy",
                f"{name} is not available right now.",
            )


def _get_bundle_id(pid: int) -> str:
    try:
        result = subprocess.run(
            ["lsappinfo", "info", "-only", "bundleid", str(pid)],
            capture_output=True, text=True, timeout=2,
        )
        for line in result.stdout.splitlines():
            if '"bundleid"' in line:
                return line.split("=")[-1].strip().strip('"')
    except Exception:
        pass
    return ""


def _terminate_app(pid: int) -> None:
    try:
        import signal
        import os
        os.kill(pid, signal.SIGTERM)
    except ProcessLookupError:
        pass
    except Exception as e:
        logger.error("Failed to terminate pid %d: %s", pid, e)


def _send_notification(title: str, message: str) -> None:
    script = f'''display notification "{message}" with title "{title}"'''
    try:
        subprocess.run(
            ["osascript", "-e", script],
            capture_output=True, timeout=5,
        )
    except Exception as e:
        logger.warning("Failed to send notification: %s", e)


try:
    import objc
    import AppKit

    class _AppLaunchObserver(AppKit.NSObject):
        _monitor = None

        def initWithMonitor_(self, monitor):
            self = objc.super(_AppLaunchObserver, self).init()
            if self is not None:
                self._monitor = monitor
            return self

        def appDidLaunch_(self, notification):
            app_info = notification.userInfo()
            if app_info is None:
                return
            bundle_id = app_info.get("NSApplicationBundleIdentifier", "")
            name = app_info.get("NSApplicationName", "")
            pid = int(app_info.get("NSApplicationProcessIdentifier", 0))
            if self._monitor:
                self._monitor._check_and_block(pid, name, bundle_id)

except ImportError:
    _AppLaunchObserver = None
