import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.models.user import User
from app.models.device import Device
from app.models.command import Command
from app.schemas.command import CommandCreate, CommandOut
from app.services.auth import get_current_user, get_user_family_id
from app.ws.manager import manager

router = APIRouter(prefix="/commands", tags=["commands"])


@router.post("", response_model=CommandOut, status_code=status.HTTP_201_CREATED)
async def send_command(
    req: CommandCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    family_id = await get_user_family_id(user, db)
    result = await db.execute(
        select(Device).where(Device.id == req.device_id, Device.family_id == family_id)
    )
    device = result.scalar_one_or_none()
    if not device:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Device not found")

    cmd = Command(
        family_id=family_id,
        device_id=req.device_id,
        command_type=req.command_type,
        payload=req.payload,
    )
    db.add(cmd)
    await db.flush()

    delivered = await manager.send_to_device(str(req.device_id), {
        "type": "command",
        "command_id": str(cmd.id),
        "command_type": cmd.command_type.value,
        "payload": cmd.payload,
    })
    if delivered:
        cmd.status = "delivered"
        await db.flush()

    return cmd


@router.get("", response_model=list[CommandOut])
async def list_commands(
    device_id: uuid.UUID | None = None,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    family_id = await get_user_family_id(user, db)
    q = select(Command).where(Command.family_id == family_id)
    if device_id:
        q = q.where(Command.device_id == device_id)
    q = q.order_by(Command.created_at.desc()).limit(100)
    result = await db.execute(q)
    return result.scalars().all()
