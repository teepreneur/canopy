"""App locking — monitors running processes and terminates blocked apps."""

import asyncio
import logging
import subprocess
import time
from typing import TYPE_CHECKING, Callable

logger = logging.getLogger("canopy.app_locker")

if TYPE_CHECKING:
    from .config import Rules


class AppLocker:
    """Monitors foreground app changes via NSWorkspace and polls processes with
    psutil. When a blocked app is detected, it is terminated immediately.
    """

    def __init__(self, rules: "Rules", poll_interval: float = 1.5):
        self.rules = rules
        self.poll_interval = poll_interval
        self._running = False
        self._task: asyncio.Task | None = None
        self._on_blocked_callbacks: list[Callable[[str, str], None]] = []
        self._app_switch_times: list[float] = []

    def on_blocked(self, callback: Callable[[str, str], None]) -> None:
        """Register callback(app_name, bundle_id) when an app is blocked."""
        self._on_blocked_callbacks.append(callback)

    def get_recent_switches(self, window_seconds: float = 30) -> list[float]:
        cutoff = time.time() - window_seconds
        return [t for t in self._app_switch_times if t > cutoff]

    async def start(self) -> None:
        self._running = True
        self._task = asyncio.create_task(self._monitor_loop())
        logger.info("App locker started (poll=%.1fs)", self.poll_interval)

    async def stop(self) -> None:
        self._running = False
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
        logger.info("App locker stopped")

    async def _monitor_loop(self) -> None:
        try:
            import AppKit
            await self._nsworkspace_loop()
        except ImportError:
            logger.warning("PyObjC not available, falling back to psutil polling")
            await self._psutil_loop()

    async def _nsworkspace_loop(self) -> None:
        import AppKit

        workspace = AppKit.NSWorkspace.sharedWorkspace()
        last_app = ""

        nc = workspace.notificationCenter()
        observer = _AppLaunchObserver.alloc().initWithLocker_(self)
        nc.addObserver_selector_name_object_(
            observer,
            "appDidLaunch:",
            AppKit.NSWorkspaceDidLaunchApplicationNotification,
            None,
        )
        nc.addObserver_selector_name_object_(
            observer,
            "appDidActivate:",
            AppKit.NSWorkspaceDidActivateApplicationNotification,
            None,
        )

        while self._running:
            active_app = workspace.activeApplication()
            if active_app:
                bundle_id = active_app.get("NSApplicationBundleIdentifier", "")
                name = active_app.get("NSApplicationName", "")
                pid = int(active_app.get("NSApplicationProcessIdentifier", 0))

                if name != last_app:
                    self._app_switch_times.append(time.time())
                    self._trim_switch_times()
                    last_app = name

                if self.rules.is_app_blocked(bundle_id) or self.rules.is_app_blocked(name):
                    self._block_app(pid, name, bundle_id)

            AppKit.NSRunLoop.currentRunLoop().runUntilDate_(
                AppKit.NSDate.dateWithTimeIntervalSinceNow_(self.poll_interval)
            )
            await asyncio.sleep(0)

    async def _psutil_loop(self) -> None:
        import psutil

        seen_pids: set[int] = set()
        for proc in psutil.process_iter(["pid"]):
            seen_pids.add(proc.info["pid"])

        last_foreground = ""

        while self._running:
            await asyncio.sleep(self.poll_interval)

            foreground_name, _, foreground_bundle = _get_foreground_app()
            if foreground_name and foreground_name != last_foreground:
                self._app_switch_times.append(time.time())
                self._trim_switch_times()
                last_foreground = foreground_name

            current_pids: set[int] = set()
            for proc in psutil.process_iter(["pid", "name"]):
                pid = proc.info["pid"]
                current_pids.add(pid)
                if pid not in seen_pids:
                    name = proc.info.get("name", "")
                    bundle_id = _get_bundle_id(pid)
                    if self.rules.is_app_blocked(bundle_id) or self.rules.is_app_blocked(name):
                        self._block_app(pid, name, bundle_id)
            seen_pids = current_pids

    def _block_app(self, pid: int, name: str, bundle_id: str) -> None:
        logger.info("BLOCKED app: %s (pid=%d, bundle=%s)", name, pid, bundle_id)
        _terminate_app(pid)
        _send_notification("App Blocked by Canopy", f"{name} is not available right now.")
        for cb in self._on_blocked_callbacks:
            try:
                cb(name, bundle_id)
            except Exception:
                pass

    def _trim_switch_times(self) -> None:
        cutoff = time.time() - 120
        self._app_switch_times = [t for t in self._app_switch_times if t > cutoff]


def _get_foreground_app() -> tuple[str, str, str]:
    try:
        import AppKit
        workspace = AppKit.NSWorkspace.sharedWorkspace()
        active = workspace.activeApplication()
        if active:
            return (
                active.get("NSApplicationName", ""),
                "",
                active.get("NSApplicationBundleIdentifier", ""),
            )
    except ImportError:
        pass

    try:
        result = subprocess.run(
            ["osascript", "-e",
             'tell application "System Events" to get name of first process whose frontmost is true'],
            capture_output=True, text=True, timeout=3,
        )
        return (result.stdout.strip(), "", "")
    except Exception:
        return ("", "", "")


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
        import signal as sig
        import os
        os.kill(pid, sig.SIGTERM)
    except ProcessLookupError:
        pass
    except Exception as e:
        logger.error("Failed to terminate pid %d: %s", pid, e)


def _send_notification(title: str, message: str) -> None:
    script = f'display notification "{message}" with title "{title}"'
    try:
        subprocess.run(["osascript", "-e", script], capture_output=True, timeout=5)
    except Exception as e:
        logger.warning("Failed to send notification: %s", e)


try:
    import objc
    import AppKit

    class _AppLaunchObserver(AppKit.NSObject):
        _locker = None

        def initWithLocker_(self, locker):
            self = objc.super(_AppLaunchObserver, self).init()
            if self is not None:
                self._locker = locker
            return self

        def appDidLaunch_(self, notification):
            app_info = notification.userInfo()
            if not app_info or not self._locker:
                return
            bundle_id = app_info.get("NSApplicationBundleIdentifier", "")
            name = app_info.get("NSApplicationName", "")
            pid = int(app_info.get("NSApplicationProcessIdentifier", 0))
            if self._locker.rules.is_app_blocked(bundle_id) or self._locker.rules.is_app_blocked(name):
                self._locker._block_app(pid, name, bundle_id)

        def appDidActivate_(self, notification):
            app_info = notification.userInfo()
            if not app_info or not self._locker:
                return
            name = app_info.get("NSApplicationName", "")
            self._locker._app_switch_times.append(time.time())
            self._locker._trim_switch_times()

except ImportError:
    _AppLaunchObserver = None
