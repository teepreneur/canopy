"""Internet kill switch using macOS pf (packet filter) firewall rules.

Uses a pf anchor to block all outbound network traffic except connections to
the Canopy backend (so the parent can restore) and DNS (so the agent resolves
the backend). Includes a safety timeout that auto-restores networking.
"""

import asyncio
import logging
import os
import subprocess
import tempfile
import time

from .config import AgentConfig

logger = logging.getLogger("canopy.kill_switch")

PF_ANCHOR = "com.canopy.agent"


class KillSwitch:
    def __init__(self, config: AgentConfig):
        self.config = config
        self._active = False
        self._activated_at: float = 0
        self._timeout_task: asyncio.Task | None = None
        self._rules_path: str | None = None

    @property
    def is_active(self) -> bool:
        return self._active

    @property
    def active_duration(self) -> float:
        if not self._active:
            return 0.0
        return time.time() - self._activated_at

    async def activate(self) -> bool:
        if self._active:
            logger.info("Kill switch already active")
            return True

        backend_host = self.config.backend_url.split("://")[-1].split(":")[0].split("/")[0]

        rules = (
            f'# Canopy kill switch — allow only backend + DNS + loopback\n'
            f'pass out quick on lo0 all\n'
            f'pass out quick proto tcp from any to {backend_host}\n'
            f'pass out quick proto udp from any to {backend_host}\n'
            f'pass out quick proto tcp from any to any port 53\n'
            f'pass out quick proto udp from any to any port 53\n'
            f'block out all\n'
        )

        try:
            fd, self._rules_path = tempfile.mkstemp(prefix="canopy_pf_", suffix=".conf")
            with os.fdopen(fd, "w") as f:
                f.write(rules)

            subprocess.run(
                ["sudo", "-n", "pfctl", "-a", PF_ANCHOR, "-f", self._rules_path],
                check=True, capture_output=True, timeout=10,
            )
            subprocess.run(
                ["sudo", "-n", "pfctl", "-e"],
                capture_output=True, timeout=10,
            )

            self._active = True
            self._activated_at = time.time()
            self._timeout_task = asyncio.create_task(self._safety_timeout())
            logger.info("Kill switch ACTIVATED")
            return True
        except subprocess.CalledProcessError as e:
            stderr = e.stderr.decode() if e.stderr else str(e)
            if "sudo" in stderr.lower() or "password" in stderr.lower():
                logger.error("Kill switch requires sudo NOPASSWD for pfctl. "
                             "Add to /etc/sudoers: %%admin ALL=(ALL) NOPASSWD: /sbin/pfctl")
            else:
                logger.error("Failed to activate kill switch: %s", stderr)
            return False
        except FileNotFoundError:
            logger.error("pfctl not found — kill switch unavailable (not macOS?)")
            return False
        finally:
            if self._rules_path and os.path.exists(self._rules_path) and not self._active:
                os.unlink(self._rules_path)

    async def deactivate(self) -> bool:
        if not self._active:
            return True

        try:
            subprocess.run(
                ["sudo", "-n", "pfctl", "-a", PF_ANCHOR, "-F", "all"],
                check=True, capture_output=True, timeout=10,
            )
            self._active = False
            if self._timeout_task:
                self._timeout_task.cancel()
                self._timeout_task = None
            if self._rules_path and os.path.exists(self._rules_path):
                os.unlink(self._rules_path)
                self._rules_path = None
            logger.info("Kill switch DEACTIVATED — normal networking restored")
            return True
        except subprocess.CalledProcessError as e:
            logger.error("Failed to deactivate kill switch: %s",
                         e.stderr.decode() if e.stderr else str(e))
            return False

    async def _safety_timeout(self) -> None:
        try:
            await asyncio.sleep(self.config.kill_switch_timeout)
            if self._active:
                logger.warning("Kill switch safety timeout reached (%ds) — auto-restoring",
                               self.config.kill_switch_timeout)
                await self.deactivate()
        except asyncio.CancelledError:
            pass
