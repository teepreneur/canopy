"""Local HTTP server that shows a friendly 'blocked' page."""

import asyncio
import logging
from pathlib import Path

from aiohttp import web

logger = logging.getLogger("canopy.blocked_page")

BLOCKED_HTML = (Path(__file__).parent.parent / "resources" / "blocked.html").resolve()


class BlockedPageServer:
    def __init__(self, port: int = 8853):
        self.port = port
        self._runner: web.AppRunner | None = None

    async def start(self) -> None:
        app = web.Application()
        app.router.add_get("/{path:.*}", self._handle)
        self._runner = web.AppRunner(app)
        await self._runner.setup()
        site = web.TCPSite(self._runner, "127.0.0.1", self.port)
        await site.start()
        logger.info("Blocked page server on http://127.0.0.1:%d", self.port)

    async def stop(self) -> None:
        if self._runner:
            await self._runner.cleanup()
            self._runner = None

    async def _handle(self, request: web.Request) -> web.Response:
        domain = request.host.split(":")[0] if request.host else "this site"
        try:
            html = BLOCKED_HTML.read_text()
        except FileNotFoundError:
            html = _FALLBACK_HTML
        html = html.replace("{{DOMAIN}}", domain)
        return web.Response(text=html, content_type="text/html")


_FALLBACK_HTML = """<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Blocked by Canopy</title>
<style>
body{font-family:system-ui,sans-serif;display:flex;justify-content:center;
align-items:center;min-height:100vh;margin:0;background:#F6F4EF;color:#2A3130}
.card{text-align:center;padding:3rem;border-radius:1rem;background:#fff;
box-shadow:0 4px 24px rgba(0,0,0,.08);max-width:420px}
h1{color:#1B5E43;font-size:1.5rem}
.domain{color:#D4654A;font-weight:600;word-break:break-all}
.btn{display:inline-block;margin-top:1.5rem;padding:.7rem 1.5rem;
background:#1B5E43;color:#fff;border-radius:.5rem;text-decoration:none;
border:none;cursor:pointer;font-size:.95rem}
</style></head><body>
<div class="card">
<h1>🌿 Blocked by Canopy</h1>
<p><span class="domain">{{DOMAIN}}</span> is not available right now.</p>
<p>A parent has restricted access to this site.</p>
<button class="btn" onclick="window.canopyRequestAccess()">Request Access</button>
<script>
window.canopyRequestAccess = function() {
  fetch('/api/request-access', {method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({domain:'{{DOMAIN}}'})
  }).then(function(){
    document.querySelector('.btn').textContent='Request Sent!';
    document.querySelector('.btn').disabled=true;
  });
};
</script>
</div></body></html>"""
