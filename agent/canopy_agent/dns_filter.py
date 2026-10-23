"""DNS proxy for website blocking."""

import asyncio
import logging
from typing import TYPE_CHECKING

from dnslib import DNSRecord, DNSHeader, RR, A, QTYPE
from dnslib.server import BaseResolver

if TYPE_CHECKING:
    from .config import Rules

logger = logging.getLogger("canopy.dns")

UPSTREAM_DNS = "8.8.8.8"
UPSTREAM_PORT = 53


class DNSFilter:
    def __init__(self, rules: "Rules", listen_port: int = 5354, blocked_page_ip: str = "127.0.0.1"):
        self.rules = rules
        self.listen_port = listen_port
        self.blocked_page_ip = blocked_page_ip
        self._transport: asyncio.DatagramTransport | None = None
        self._on_query_callbacks: list = []

    def on_query(self, callback):
        self._on_query_callbacks.append(callback)

    async def start(self) -> None:
        loop = asyncio.get_running_loop()
        self._transport, _ = await loop.create_datagram_endpoint(
            lambda: _DNSProtocol(self),
            local_addr=("127.0.0.1", self.listen_port),
        )
        logger.info("DNS filter listening on 127.0.0.1:%d", self.listen_port)

    async def stop(self) -> None:
        if self._transport:
            self._transport.close()
            self._transport = None
            logger.info("DNS filter stopped")

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
            logger.info("BLOCKED: %s", qname)
            reply = request.reply()
            if request.q.qtype == QTYPE.A:
                reply.add_answer(RR(
                    request.q.qname,
                    QTYPE.A,
                    rdata=A(self.blocked_page_ip),
                    ttl=60,
                ))
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
    def __init__(self, dns_filter: DNSFilter):
        self.dns_filter = dns_filter

    def connection_made(self, transport: asyncio.DatagramTransport):
        self.transport = transport

    def datagram_received(self, data: bytes, addr: tuple):
        asyncio.ensure_future(self._handle(data, addr))

    async def _handle(self, data: bytes, addr: tuple):
        response = await self.dns_filter.handle_query(data)
        if response:
            self.transport.sendto(response, addr)
