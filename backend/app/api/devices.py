import secrets
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.models.user import User
from app.models.device import Device, PairingCode
from app.schemas.device import (
    PairingCodeCreate, PairingCodeOut, DeviceRegister, DeviceOut, DeviceListOut,
)
from app.services.auth import get_current_user, get_user_family_id
from app.config import settings

router = APIRouter(prefix="/devices", tags=["devices"])


@router.post("/pairing-code", response_model=PairingCodeOut, status_code=status.HTTP_201_CREATED)
async def create_pairing_code(
    req: PairingCodeCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    family_id = await get_user_family_id(user, db)
    code = secrets.token_hex(3).upper()[:6]
    expires = datetime.now(timezone.utc) + timedelta(minutes=settings.pairing_code_expire_minutes)
    pc = PairingCode(
        family_id=family_id,
        child_profile_id=req.child_profile_id,
        code=code,
        expires_at=expires,
    )
    db.add(pc)
    await db.flush()
    return pc


@router.post("/register", response_model=DeviceOut, status_code=status.HTTP_201_CREATED)
async def register_device(req: DeviceRegister, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(PairingCode).where(
            PairingCode.code == req.pairing_code,
            PairingCode.used == False,
            PairingCode.expires_at > datetime.now(timezone.utc),
        )
    )
    pc = result.scalar_one_or_none()
    if not pc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired pairing code")

    device = Device(
        family_id=pc.family_id,
        child_profile_id=pc.child_profile_id,
        name=req.name,
        platform=req.platform,
    )
    db.add(device)
    pc.used = True
    await db.flush()
    return device


@router.get("", response_model=list[DeviceListOut])
async def list_devices(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    family_id = await get_user_family_id(user, db)
    result = await db.execute(select(Device).where(Device.family_id == family_id))
    return result.scalars().all()


@router.get("/{device_id}", response_model=DeviceOut)
async def get_device(
    device_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    family_id = await get_user_family_id(user, db)
    result = await db.execute(
        select(Device).where(Device.id == device_id, Device.family_id == family_id)
    )
    device = result.scalar_one_or_none()
    if not device:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Device not found")
    return device


@router.delete("/{device_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_device(
    device_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    family_id = await get_user_family_id(user, db)
    result = await db.execute(
        select(Device).where(Device.id == device_id, Device.family_id == family_id)
    )
    device = result.scalar_one_or_none()
    if not device:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Device not found")
    await db.delete(device)
