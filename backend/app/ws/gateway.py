import json
from datetime import datetime, timezone
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import async_session
from app.models.device import Device
from app.models.command import Command, CommandStatus
from app.ws.manager import manager
from app.services.auth import decode_token

router = APIRouter()


@router.websocket("/ws/agent/{device_id}")
async def agent_websocket(websocket: WebSocket, device_id: str):
    async with async_session() as db:
        token = websocket.query_params.get("token")
        if not token:
            await websocket.close(code=4001, reason="Missing device token")
            return

        result = await db.execute(
            select(Device).where(Device.id == device_id, Device.device_token == token)
        )
        device = result.scalar_one_or_none()
        if not device:
            await websocket.close(code=4003, reason="Invalid device token")
            return

        await manager.connect_device(device_id, websocket)
        device.is_online = True
        device.last_heartbeat = datetime.now(timezone.utc)
        await db.commit()

        try:
            while True:
                data = await websocket.receive_json()
                msg_type = data.get("type")

                if msg_type == "heartbeat":
                    device.last_heartbeat = datetime.now(timezone.utc)
                    device.is_online = True
                    await db.commit()
                    await websocket.send_json({"type": "heartbeat_ack"})

                elif msg_type == "command_ack":
                    cmd_id = data.get("command_id")
                    cmd_status = data.get("status", "executed")
                    result = await db.execute(
                        select(Command).where(Command.id == cmd_id)
                    )
                    cmd = result.scalar_one_or_none()
                    if cmd:
                        cmd.status = CommandStatus(cmd_status)
                        await db.commit()

                elif msg_type == "alert":
                    await manager.send_to_family(str(device.family_id), {
                        "type": "agent_alert",
                        "device_id": device_id,
                        "data": data.get("data"),
                    })

                elif msg_type == "status_update":
                    await manager.send_to_family(str(device.family_id), {
                        "type": "device_status",
                        "device_id": device_id,
                        "data": data.get("data"),
                    })

        except WebSocketDisconnect:
            pass
        finally:
            manager.disconnect_device(device_id)
            device.is_online = False
            await db.commit()


@router.websocket("/ws/dashboard")
async def dashboard_websocket(websocket: WebSocket):
    token = websocket.query_params.get("token")
    if not token:
        await websocket.close(code=4001, reason="Missing auth token")
        return

    try:
        user_id = decode_token(token)
    except Exception:
        await websocket.close(code=4003, reason="Invalid token")
        return

    async with async_session() as db:
        from app.models.family import FamilyMember
        result = await db.execute(
            select(FamilyMember.family_id).where(FamilyMember.user_id == user_id)
        )
        family_id = result.scalar_one_or_none()
        if not family_id:
            await websocket.close(code=4003, reason="No family")
            return

    family_id_str = str(family_id)
    await manager.connect_family(family_id_str, websocket)

    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        pass
    finally:
        manager.disconnect_family(family_id_str, websocket)
