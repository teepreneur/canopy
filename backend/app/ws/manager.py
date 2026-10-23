import json
from fastapi import WebSocket


class ConnectionManager:
    def __init__(self):
        self.device_connections: dict[str, WebSocket] = {}
        self.family_connections: dict[str, list[WebSocket]] = {}

    async def connect_device(self, device_id: str, websocket: WebSocket):
        await websocket.accept()
        self.device_connections[device_id] = websocket

    async def connect_family(self, family_id: str, websocket: WebSocket):
        await websocket.accept()
        if family_id not in self.family_connections:
            self.family_connections[family_id] = []
        self.family_connections[family_id].append(websocket)

    def disconnect_device(self, device_id: str):
        self.device_connections.pop(device_id, None)

    def disconnect_family(self, family_id: str, websocket: WebSocket):
        if family_id in self.family_connections:
            self.family_connections[family_id] = [
                ws for ws in self.family_connections[family_id] if ws != websocket
            ]

    async def send_to_device(self, device_id: str, message: dict) -> bool:
        ws = self.device_connections.get(device_id)
        if ws:
            await ws.send_json(message)
            return True
        return False

    async def send_to_family(self, family_id: str, message: dict):
        for ws in self.family_connections.get(family_id, []):
            try:
                await ws.send_json(message)
            except Exception:
                pass


manager = ConnectionManager()
