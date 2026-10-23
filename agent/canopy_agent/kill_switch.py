"""Internet kill switch using macOS pf (packet filter) firewall rules."""

import asyncio
import logging
import subprocess
import time

from .config import AgentConfig

logger = logging.getLogger("canopy.kill_switch")

PF_ANCHOR = "com.canopy.agent"
PF_RULES_PATH = "/tmp/canopy_pf_rules.conf"


class KillSwitch:
    def __init__(self, config: AgentConfig):
        self.config = config
        self._active = False
        self._activated_at: float = 0
        self._timeout_task: asyncio.Task | None = None

    @property
    def is_active(self) -> bool:
        return self._active

    async def activate(self) -> bool:
        if self._active:
            logger.info("Kill switch already active")
            return True

        backend_host = self.config.backend_url.split("://")[-1].split(":")[0].split("/")[0]

        rules = (
            f'# Canopy kill switch — allow only backend + DNS\n'
            f'pass out quick proto tcp from any to {backend_host}\n'
            f'pass out quick proto tcp from any to any port 53\n'
            f'pass out quick proto udp from any to any port 53\n'
            f'pass out quick on lo0 all\n'
            f'block out all\n'
        )

        try:
            with open(PF_RULES_PATH, "w") as f:
                f.write(rules)

            subprocess.run(
                ["sudo", "-n", "pfctl", "-a", PF_ANCHOR, "-f", PF_RULES_PATH],
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
            logger.error("Failed to activate kill switch: %s", e.stderr.decode())
            return False
        except FileNotFoundError:
            logger.error("pfctl not found — kill switch unavailable")
            return False

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
            logger.info("Kill switch DEACTIVATED")
            return True
        except subprocess.CalledProcessError as e:
            logger.error("Failed to deactivate kill switch: %s", e.stderr.decode())
            return False

    async def _safety_timeout(self) -> None:
        try:
            await asyncio.sleep(self.config.kill_switch_timeout)
            if self._active:
                logger.warning("Kill switch safety timeout reached (%ds) — auto-restoring", self.config.kill_switch_timeout)
                await self.deactivate()
        except asyncio.CancelledError:
            pass
