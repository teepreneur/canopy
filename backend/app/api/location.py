from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.models.user import User
from app.models.device import Device
from app.models.location import LocationUpdate, Geofence
from app.schemas.location import (
    LocationSubmit, LocationOut,
    GeofenceCreate, GeofenceUpdate, GeofenceOut,
)
from app.services.auth import get_current_user, get_user_family_id

router = APIRouter(prefix="/location", tags=["location"])


# --- Device reports location (called by agent) ---

@router.post("/submit/{device_id}", response_model=LocationOut, status_code=status.HTTP_201_CREATED)
async def submit_location(
    device_id: str,
    req: LocationSubmit,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Device).where(Device.id == device_id))
    device = result.scalar_one_or_none()
    if not device:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Device not found")

    loc = LocationUpdate(
        device_id=device.id,
        child_profile_id=device.child_profile_id,
        family_id=device.family_id,
        latitude=req.latitude,
        longitude=req.longitude,
        accuracy=req.accuracy,
        address=req.address,
    )
    db.add(loc)
    await db.flush()
    return loc


# --- Parent views ---

@router.get("/latest", response_model=list[LocationOut])
async def get_latest_locations(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get the most recent location for each device in the family."""
    family_id = await get_user_family_id(user, db)
    devices_result = await db.execute(
        select(Device.id).where(Device.family_id == family_id)
    )
    device_ids = [row[0] for row in devices_result.all()]

    locations = []
    for did in device_ids:
        result = await db.execute(
            select(LocationUpdate)
            .where(LocationUpdate.device_id == did)
            .order_by(desc(LocationUpdate.created_at))
            .limit(1)
        )
        loc = result.scalar_one_or_none()
        if loc:
            locations.append(loc)
    return locations


@router.get("/history/{child_profile_id}", response_model=list[LocationOut])
async def get_location_history(
    child_profile_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    limit: int = 50,
):
    family_id = await get_user_family_id(user, db)
    result = await db.execute(
        select(LocationUpdate)
        .where(
            LocationUpdate.child_profile_id == child_profile_id,
            LocationUpdate.family_id == family_id,
        )
        .order_by(desc(LocationUpdate.created_at))
        .limit(limit)
    )
    return result.scalars().all()


# --- Geofences ---

@router.post("/geofences", response_model=GeofenceOut, status_code=status.HTTP_201_CREATED)
async def create_geofence(
    req: GeofenceCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    family_id = await get_user_family_id(user, db)
    gf = Geofence(
        family_id=family_id,
        child_profile_id=req.child_profile_id,
        name=req.name,
        latitude=req.latitude,
        longitude=req.longitude,
        radius_meters=req.radius_meters,
        is_safe_zone=req.is_safe_zone,
    )
    db.add(gf)
    await db.flush()
    return gf


@router.get("/geofences", response_model=list[GeofenceOut])
async def list_geofences(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    family_id = await get_user_family_id(user, db)
    result = await db.execute(
        select(Geofence).where(Geofence.family_id == family_id)
    )
    return result.scalars().all()


@router.put("/geofences/{geofence_id}", response_model=GeofenceOut)
async def update_geofence(
    geofence_id: str,
    req: GeofenceUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    family_id = await get_user_family_id(user, db)
    result = await db.execute(
        select(Geofence).where(Geofence.id == geofence_id, Geofence.family_id == family_id)
    )
    gf = result.scalar_one_or_none()
    if not gf:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Geofence not found")

    for field, value in req.model_dump(exclude_unset=True).items():
        setattr(gf, field, value)

    await db.flush()
    return gf


@router.delete("/geofences/{geofence_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_geofence(
    geofence_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    family_id = await get_user_family_id(user, db)
    result = await db.execute(
        select(Geofence).where(Geofence.id == geofence_id, Geofence.family_id == family_id)
    )
    gf = result.scalar_one_or_none()
    if not gf:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Geofence not found")
    await db.delete(gf)
