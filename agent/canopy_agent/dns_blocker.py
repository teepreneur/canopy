"""DNS-level website blocking via local DNS proxy using dnslib."""

import asyncio
import logging
import time
from collections import deque
from typing import TYPE_CHECKING, Callable

from dnslib import DNSRecord, RR, A, QTYPE, RCODE

if TYPE_CHECKING:
    from .config import Rules

logger = logging.getLogger("canopy.dns_blocker")

UPSTREAM_DNS = "8.8.8.8"
UPSTREAM_PORT = 53


class DNSBlocker:
    """Local DNS proxy that intercepts queries and blocks domains per rules.

    Blocked domains get NXDOMAIN (or 0.0.0.0 for A queries to redirect to the
    blocked page). Wildcard subdomain blocking is handled by Rules.is_domain_blocked.
    All other queries are forwarded to upstream DNS.
    """

    def __init__(
        self,
        rules: "Rules",
        listen_port: int = 5354,
        blocked_ip: str = "0.0.0.0",
    ):
        self.rules = rules
        self.listen_port = listen_port
        self.blocked_ip = blocked_ip
        self._transport: asyncio.DatagramTransport | None = None
        self._on_blocked_callbacks: list[Callable[[str], None]] = []
        self._on_query_callbacks: list[Callable[[str], None]] = []
        self._blocked_log: deque[tuple[float, str]] = deque(maxlen=1000)

    def on_blocked(self, callback: Callable[[str], None]) -> None:
        self._on_blocked_callbacks.append(callback)

    def on_query(self, callback: Callable[[str], None]) -> None:
        self._on_query_callbacks.append(callback)

    def get_recent_blocked(self, since: float = 0) -> list[tuple[float, str]]:
        return [(ts, d) for ts, d in self._blocked_log if ts > since]

    async def start(self) -> None:
        loop = asyncio.get_running_loop()
        self._transport, _ = await loop.create_datagram_endpoint(
            lambda: _DNSProtocol(self),
            local_addr=("127.0.0.1", self.listen_port),
        )
        logger.info("DNS blocker listening on 127.0.0.1:%d", self.listen_port)

    async def stop(self) -> None:
        if self._transport:
            self._transport.close()
            self._transport = None
            logger.info("DNS blocker stopped")

    async def handle_query(self, data: bytes) -> bytes:
        try:
            request = DNSRecord.parse(data)
        except Exception:
            return b""

        qname = str(request.q.qname).rstrip(".")
        qtype = QTYPE[request.q.qtype]

        for cb in self._on_query_callbacks:
            try:
                cb(qname)
            except Exception:
                pass

        if self.rules.is_domain_blocked(qname):
            logger.info("BLOCKED: %s (%s)", qname, qtype)
            now = time.time()
            self._blocked_log.append((now, qname))

            for cb in self._on_blocked_callbacks:
                try:
                    cb(qname)
                except Exception:
                    pass

            reply = request.reply()
            if request.q.qtype == QTYPE.A:
                reply.add_answer(RR(
                    request.q.qname,
                    QTYPE.A,
                    rdata=A(self.blocked_ip),
                    ttl=60,
                ))
            else:
                reply.header.rcode = getattr(RCODE, "NXDOMAIN")
            return reply.pack()

        return await self._forward_query(data)

    async def _forward_query(self, data: bytes) -> bytes:
        loop = asyncio.get_running_loop()
        future = loop.create_future()

        class UpstreamProtocol(asyncio.DatagramProtocol):
            def connection_made(self, transport):
                transport.sendto(data)

            def datagram_received(self, resp_data, addr):
                if not future.done():
                    future.set_result(resp_data)

            def error_received(self, exc):
                if not future.done():
                    future.set_exception(exc)

        transport, _ = await loop.create_datagram_endpoint(
            UpstreamProtocol,
            remote_addr=(UPSTREAM_DNS, UPSTREAM_PORT),
        )
        try:
            return await asyncio.wait_for(future, timeout=5.0)
        except asyncio.TimeoutError:
            logger.warning("Upstream DNS timeout for query")
            return b""
        finally:
            transport.close()


class _DNSProtocol(asyncio.DatagramProtocol):
    def __init__(self, blocker: DNSBlocker):
        self.blocker = blocker

    def connection_made(self, transport: asyncio.DatagramTransport):
        self.transport = transport

    def datagram_received(self, data: bytes, addr: tuple):
        asyncio.ensure_future(self._handle(data, addr))

    async def _handle(self, data: bytes, addr: tuple):
        response = await self.blocker.handle_query(data)
        if response:
            self.transport.sendto(response, addr)
