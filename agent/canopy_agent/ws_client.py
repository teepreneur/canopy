"""Persistent WebSocket client with auto-reconnect."""

import asyncio
import json
import logging
import time
from typing import Any, Callable, Coroutine

import websockets
from websockets.exceptions import ConnectionClosed

from .config import AgentConfig

logger = logging.getLogger("canopy.ws")

MAX_BACKOFF = 120
INITIAL_BACKOFF = 1


class WSClient:
    def __init__(self, config: AgentConfig):
        self.config = config
        self._ws: Any = None
        self._running = False
        self._handlers: dict[str, list[Callable]] = {}
        self._task: asyncio.Task | None = None
        self._connected = False

    @property
    def connected(self) -> bool:
        return self._connected

    def on(self, event_type: str, handler: Callable[..., Coroutine]) -> None:
        self._handlers.setdefault(event_type, []).append(handler)

    async def start(self) -> None:
        self._running = True
        self._task = asyncio.create_task(self._connection_loop())

    async def stop(self) -> None:
        self._running = False
        if self._ws:
            await self._ws.close()
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass

    async def send(self, message: dict) -> None:
        if self._ws and self._connected:
            await self._ws.send(json.dumps(message))

    async def _connection_loop(self) -> None:
        backoff = INITIAL_BACKOFF
        while self._running:
            try:
                url = f"{self.config.ws_url}/ws/agent/{self.config.device_id}?token={self.config.device_token}"
                async with websockets.connect(url, ping_interval=20, ping_timeout=10) as ws:
                    self._ws = ws
                    self._connected = True
                    backoff = INITIAL_BACKOFF
                    logger.info("WebSocket connected")

                    heartbeat_task = asyncio.create_task(self._heartbeat_loop())
                    try:
                        async for raw in ws:
                            await self._dispatch(raw)
                    finally:
                        heartbeat_task.cancel()
                        self._connected = False

            except ConnectionClosed as e:
                logger.warning("WebSocket closed: %s", e)
            except Exception as e:
                logger.warning("WebSocket error: %s", e)

            self._connected = False
            if self._running:
                logger.info("Reconnecting in %ds...", backoff)
                await asyncio.sleep(backoff)
                backoff = min(backoff * 2, MAX_BACKOFF)

    async def _heartbeat_loop(self) -> None:
        try:
            while self._connected:
                await self.send({"type": "heartbeat", "timestamp": time.time()})
                await asyncio.sleep(self.config.heartbeat_interval)
        except asyncio.CancelledError:
            pass

    async def _dispatch(self, raw: str) -> None:
        try:
            msg = json.loads(raw)
        except json.JSONDecodeError:
            logger.warning("Invalid WebSocket message: %s", raw[:200])
            return

        msg_type = msg.get("type", "unknown")
        logger.debug("WS received: %s", msg_type)

        handlers = self._handlers.get(msg_type, []) + self._handlers.get("*", [])
        for handler in handlers:
            try:
                await handler(msg)
            except Exception as e:
                logger.error("Handler error for %s: %s", msg_type, e)
