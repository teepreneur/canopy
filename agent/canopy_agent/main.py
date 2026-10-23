"""Canopy agent entry point — orchestrates all subsystems."""

import argparse
import asyncio
import logging
import signal
import sys

from .config import AgentConfig, Rules
from .dns_filter import DNSFilter
from .blocked_page import BlockedPageServer
from .app_monitor import AppMonitor
from .activity import ActivityTracker
from .kill_switch import KillSwitch
from .ws_client import WSClient
from .alerts import AlertManager
from .setup import run_setup_wizard

logger = logging.getLogger("canopy")


class CanopyAgent:
    def __init__(self):
        self.config = AgentConfig.load()
        self.rules = Rules.load()
        self.dns_filter = DNSFilter(self.rules, listen_port=self.config.dns_port)
        self.blocked_page = BlockedPageServer(port=self.config.blocked_page_port)
        self.app_monitor = AppMonitor(self.rules)
        self.activity = ActivityTracker(self.config)
        self.kill_switch = KillSwitch(self.config)
        self.ws_client = WSClient(self.config)
        self.alerts = AlertManager(self.config)
        self._running = False

    async def start(self) -> None:
        logger.info("Starting Canopy agent v0.1.0 (device=%s)", self.config.device_id)
        self._running = True

        self.dns_filter.on_query(self.activity.record_dns_query)
        self.dns_filter.on_query(lambda domain: asyncio.create_task(
            self.alerts.send_alert("blocked_site", domain)
        ) if self.rules.is_domain_blocked(domain) else None)

        self._register_ws_handlers()

        await self.blocked_page.start()
        await self.dns_filter.start()
        await self.app_monitor.start()
        await self.activity.start()

        if self.config.is_registered:
            await self.ws_client.start()
            await self._sync_rules()

        logger.info("Canopy agent running")

    async def stop(self) -> None:
        logger.info("Stopping Canopy agent...")
        self._running = False
        await self.ws_client.stop()
        await self.activity.stop()
        await self.app_monitor.stop()
        await self.dns_filter.stop()
        await self.blocked_page.stop()
        if self.kill_switch.is_active:
            await self.kill_switch.deactivate()
        logger.info("Canopy agent stopped")

    def _register_ws_handlers(self) -> None:
        self.ws_client.on("rules_update", self._handle_rules_update)
        self.ws_client.on("command", self._handle_command)
        self.ws_client.on("access_response", self.alerts.handle_access_response)

    async def _handle_rules_update(self, msg: dict) -> None:
        rules_data = msg.get("rules", {})
        self.rules.blocked_domains = rules_data.get("blocked_domains", self.rules.blocked_domains)
        self.rules.blocked_apps = rules_data.get("blocked_apps", self.rules.blocked_apps)
        self.rules.schedules = rules_data.get("schedules", self.rules.schedules)
        self.rules.save()
        logger.info("Rules updated: %d domains, %d apps blocked",
                     len(self.rules.blocked_domains), len(self.rules.blocked_apps))

    async def _handle_command(self, msg: dict) -> None:
        action = msg.get("action", "")
        logger.info("Received command: %s", action)

        if action == "kill_internet":
            await self.kill_switch.activate()
        elif action == "restore_internet":
            await self.kill_switch.deactivate()
        elif action == "sync_rules":
            await self._sync_rules()
        elif action == "lock_app":
            app = msg.get("app", "")
            if app and app not in self.rules.blocked_apps:
                self.rules.blocked_apps.append(app)
                self.rules.save()
        elif action == "unlock_app":
            app = msg.get("app", "")
            if app in self.rules.blocked_apps:
                self.rules.blocked_apps.remove(app)
                self.rules.save()
        else:
            logger.warning("Unknown command: %s", action)

    async def _sync_rules(self) -> None:
        if not self.config.is_registered:
            return
        import httpx
        try:
            async with httpx.AsyncClient(timeout=15) as client:
                resp = await client.get(
                    f"{self.config.backend_url}/api/devices/{self.config.device_id}/rules",
                    headers={"Authorization": f"Bearer {self.config.device_token}"},
                )
                resp.raise_for_status()
                data = resp.json()
                self.rules.blocked_domains = data.get("blocked_domains", [])
                self.rules.blocked_apps = data.get("blocked_apps", [])
                self.rules.schedules = data.get("schedules", [])
                self.rules.save()
                logger.info("Rules synced from backend")
        except Exception as e:
            logger.warning("Rules sync failed: %s — using cached rules", e)


def _setup_logging(verbose: bool) -> None:
    level = logging.DEBUG if verbose else logging.INFO
    logging.basicConfig(
        level=level,
        format="%(asctime)s [%(name)s] %(levelname)s: %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )


async def _run_agent(verbose: bool) -> None:
    _setup_logging(verbose)
    agent = CanopyAgent()

    if not agent.config.is_registered:
        logger.warning("Device not registered. Run 'canopy-agent setup' first.")
        logger.info("Starting in offline mode (DNS filter + app monitor with cached rules)")

    loop = asyncio.get_running_loop()
    stop_event = asyncio.Event()

    def _signal_handler():
        stop_event.set()

    for sig in (signal.SIGTERM, signal.SIGINT):
        loop.add_signal_handler(sig, _signal_handler)

    await agent.start()
    await stop_event.wait()
    await agent.stop()


def main() -> None:
    parser = argparse.ArgumentParser(description="Canopy macOS Device Agent")
    sub = parser.add_subparsers(dest="command", help="Command")

    sub.add_parser("setup", help="Register this device with Canopy")
    run_parser = sub.add_parser("run", help="Start the agent")
    run_parser.add_argument("-v", "--verbose", action="store_true")

    args = parser.parse_args()

    if args.command == "setup":
        run_setup_wizard()
    elif args.command == "run":
        asyncio.run(_run_agent(args.verbose))
    else:
        parser.print_help()
        sys.exit(1)


if __name__ == "__main__":
    main()
